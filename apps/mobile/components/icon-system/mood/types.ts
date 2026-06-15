// Mood-scale state type for the draft mood glyphs (Slice 3a).
//
// Structurally the same 0..4 five-point scale as the check-in CheckInState, kept
// as a local alias so the draft icon components don't take a dependency on the
// check-in feature while they are still review-only and unwired. When a direction
// is chosen and wired in, callers pass their CheckInState straight through.

import type { CheckInState } from '@psychage/shared/check-in';

export type MoodScale = CheckInState;

/** The fixed scale order, lowest → highest. */
export const MOOD_STATES: readonly MoodScale[] = [0, 1, 2, 3, 4];
