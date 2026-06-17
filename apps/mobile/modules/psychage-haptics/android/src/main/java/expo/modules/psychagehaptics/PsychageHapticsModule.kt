package expo.modules.psychagehaptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PsychageHapticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PsychageHaptics")

    Function("playBreathIn") {
      playBreath(true)
    }

    Function("playBreathOut") {
      playBreath(false)
    }

    Function("playCompleteSequence") {
      playComplete()
    }
  }

  private fun getVibrator(): Vibrator? {
    val context = appContext.reactContext ?: return null
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      vibratorManager.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
  }

  private fun playBreath(isInhale: Boolean) {
    val vibrator = getVibrator() ?: return
    if (!vibrator.hasVibrator()) return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && vibrator.hasAmplitudeControl()) {
      val timings = LongArray(40) { 100L }
      val amplitudes = IntArray(40) { i ->
        val progress = i / 39f
        val intensity = if (isInhale) progress else (1f - progress)
        (intensity * 200).toInt()
      }
      val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
      vibrator.vibrate(effect)
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(4000)
    }
  }

  private fun playComplete() {
    val vibrator = getVibrator() ?: return
    if (!vibrator.hasVibrator()) return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && vibrator.hasAmplitudeControl()) {
      val timings = longArrayOf(20, 60, 30, 50, 40)
      val amplitudes = intArrayOf(100, 0, 150, 0, 255)
      val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
      vibrator.vibrate(effect)
    } else {
      val pattern = longArrayOf(0, 20, 60, 30, 50, 40)
      @Suppress("DEPRECATION")
      vibrator.vibrate(pattern, -1)
    }
  }
}
