import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import PsychageHapticsModule from '../modules/psychage-haptics';
export type HapticEvent =
  | 'tab'
  | 'affirm'
  | 'confirm'
  | 'celebrate'
  | 'alert'
  | 'error'
  | 'complete'
  | 'breathIn'
  | 'breathOut';

type SequenceStep = { run: () => void; delayMs: number };

// Sequence steps mirror tokens/mobile.tokens.json haptic.*._sequence by hand.
// Token leaves are documentation strings (e.g. "Haptics.impactAsync(...)"), not
// machine-consumable data — see Phase 6 design item: propose data-shaped haptic
// tokens + dispatcher (likely Slice 6 when toggle persistence + DI seam land).
const sequences: Record<'complete' | 'breathIn' | 'breathOut', SequenceStep[]> = {
  complete: [
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 0 },        // → haptic.complete._sequence[0]
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delayMs: 80 },       // → haptic.complete._sequence[1]
    { run: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), delayMs: 80 }, // → haptic.complete._sequence[2]
  ],
  breathIn: [
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 0 },   // → haptic.breath_in._sequence[0]
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 200 }, // → haptic.breath_in._sequence[1]
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delayMs: 200 },// → haptic.breath_in._sequence[2]
  ],
  breathOut: [
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delayMs: 0 },  // → haptic.breath_out._sequence[0]
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 200 }, // → haptic.breath_out._sequence[1]
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 200 }, // → haptic.breath_out._sequence[2]
  ],
};

/**
 * Fire a Psychage haptic event mapped to tokens/mobile.tokens.json haptic.*.
 *
 * No-haptic zones (DESIGN.mobile.md §3.3, tokens haptic._noHapticZones) —
 * guard at the CALL SITE, not here (the lib has no surface context):
 *   1. High-frequency micro-interactions — typing keystrokes, slider drag
 *      deltas, scroll velocity. Aggregated end-of-gesture OK; per-event not.
 *   2. Background notifications — OS notification haptic owns this surface.
 *
 * `isEnabled` is checked before each step (including inside sequenced setTimeout
 * callbacks) so a mid-sequence toggle-off halts the rest of the pattern.
 *
 * OS-level respect (iOS System Haptics, Low Power Mode) is handled automatically
 * inside expo-haptics — no app code needed.
 */
export function fireHaptic(event: HapticEvent, isEnabled: () => boolean): void {
  if (!isEnabled()) return;

  switch (event) {
    case 'tab':
      Haptics.selectionAsync(); // → haptic.tap._expo
      return;
    case 'affirm':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // → haptic.affirm._expo
      return;
    case 'confirm':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // → haptic.confirm._expo
      return;
    case 'celebrate':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // → haptic.celebrate._expo
      return;
    case 'alert':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // → haptic.alert._expo
      return;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // → haptic.error._expo
      return;
    case 'complete':
      if (Platform.OS === 'ios' && PsychageHapticsModule) {
        PsychageHapticsModule.playCompleteSequence();
      } else {
        runSequence(sequences[event], isEnabled);
      }
      return;
    case 'breathIn':
      if (Platform.OS === 'ios' && PsychageHapticsModule) {
        PsychageHapticsModule.playBreathIn();
      } else {
        runSequence(sequences[event], isEnabled);
      }
      return;
    case 'breathOut':
      if (Platform.OS === 'ios' && PsychageHapticsModule) {
        PsychageHapticsModule.playBreathOut();
      } else {
        runSequence(sequences[event], isEnabled);
      }
      return;
  }
}

function runSequence(steps: SequenceStep[], isEnabled: () => boolean): void {
  let cumulative = 0;
  for (const step of steps) {
    cumulative += step.delayMs;
    if (cumulative === 0) {
      if (isEnabled()) step.run();
    } else {
      setTimeout(() => {
        if (isEnabled()) step.run();
      }, cumulative);
    }
  }
}
