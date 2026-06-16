import ExpoModulesCore
import CoreHaptics

public class PsychageHapticsModule: Module {
  private var engine: CHHapticEngine?

  public func definition() -> ModuleDefinition {
    Name("PsychageHaptics")

    OnCreate {
      self.createEngine()
    }

    Function("playBreathIn") { () in
      self.playContinuous(duration: 4.0, isInhale: true)
    }

    Function("playBreathOut") { () in
      self.playContinuous(duration: 4.0, isInhale: false)
    }

    Function("playCompleteSequence") { () in
      self.playCompleteSequencePattern()
    }
  }

  private func createEngine() {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
    do {
      engine = try CHHapticEngine()
      try engine?.start()
    } catch {
      print("PsychageHaptics: Engine Creation Error: \(error)")
    }
  }

  private func playContinuous(duration: TimeInterval, isInhale: Bool) {
    guard let engine = engine else { return }
    do {
      let intensityCurve = CHHapticParameterCurve(
        parameterID: .hapticIntensityControl,
        controlPoints: [
          CHHapticParameterCurve.ControlPoint(relativeTime: 0, value: isInhale ? 0.0 : 0.8),
          CHHapticParameterCurve.ControlPoint(relativeTime: duration, value: isInhale ? 0.8 : 0.0)
        ],
        relativeTime: 0
      )
      
      let event = CHHapticEvent(
        eventType: .hapticContinuous,
        parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2)
        ],
        relativeTime: 0,
        duration: duration
      )

      let pattern = try CHHapticPattern(events: [event], parameterCurves: [intensityCurve])
      let player = try engine.makePlayer(with: pattern)
      try engine.start()
      try player.start(atTime: CHHapticTimeImmediate)
    } catch {
      print("PsychageHaptics: Failed to play continuous haptic: \(error)")
    }
  }
  
  private func playCompleteSequencePattern() {
    guard let engine = engine else { return }
    do {
      let light = CHHapticEvent(eventType: .hapticTransient, parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.4),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.4)
      ], relativeTime: 0)
      
      let medium = CHHapticEvent(eventType: .hapticTransient, parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5)
      ], relativeTime: 0.08)
      
      let success = CHHapticEvent(eventType: .hapticTransient, parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8)
      ], relativeTime: 0.16)
      
      let pattern = try CHHapticPattern(events: [light, medium, success], parameters: [])
      let player = try engine.makePlayer(with: pattern)
      try engine.start()
      try player.start(atTime: CHHapticTimeImmediate)
    } catch {
      print("PsychageHaptics: Failed to play complete sequence: \(error)")
    }
  }
}
