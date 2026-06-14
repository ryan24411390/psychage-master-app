import type { CheckInState } from '@psychage/shared/check-in';

// The five check-in state labels — verbatim from the v5 `labels` array. Single-
// sourced for StateRows (C0.4), the terrain VoiceOver (C0.3), and the home status
// line (S3 "Yesterday: [state]" / "Checked in · [state]"). The token _note's
// Awful…Great set is stale; the order names the endpoints "Very low → Very good"
// and v5 governs the rest.
export const STATE_LABELS: Record<CheckInState, string> = {
  0: 'Very low',
  1: 'Low',
  2: 'Okay',
  3: 'Good',
  4: 'Very good',
};
