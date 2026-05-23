import * as Haptics from 'expo-haptics';

export type HapticEvent =
  | 'tab'
  | 'affirm'
  | 'confirm'
  | 'celebrate'
  | 'alert'
  | 'complete'
  | 'breathIn'
  | 'breathOut';

type SequenceStep = { run: () => void; delayMs: number };

const sequences: Record<'complete' | 'breathIn' | 'breathOut', SequenceStep[]> = {
  complete: [
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 0 },
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delayMs: 80 },
    { run: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), delayMs: 80 },
  ],
  breathIn: [
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 0 },
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 200 },
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delayMs: 200 },
  ],
  breathOut: [
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delayMs: 0 },
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 200 },
    { run: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delayMs: 200 },
  ],
};

/**
 * Fire a Psychage haptic event mapped to tokens/mobile.tokens.json haptic.*.
 *
 * No-haptic zones (DESIGN.mobile.md §3.3, tokens haptic._noHapticZones) —
 * guard at the CALL SITE, not here (the lib has no surface context):
 *   1. Error states — warm copy + visual only; no haptic.error token exists.
 *   2. High-frequency micro-interactions — typing keystrokes, slider drag
 *      deltas, scroll velocity. Aggregated end-of-gesture OK; per-event not.
 *   3. Background notifications — OS notification haptic owns this surface.
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
      Haptics.selectionAsync();
      return;
    case 'affirm':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'confirm':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    case 'celebrate':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'alert':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    case 'complete':
    case 'breathIn':
    case 'breathOut':
      runSequence(sequences[event], isEnabled);
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
