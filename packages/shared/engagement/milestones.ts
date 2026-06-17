// Cumulative milestones — the reward side of the Moments habit loop. PURE + injected-
// free (a count in, thresholds out), so it lives in shared and is device-free testable.
//
// CUMULATIVE-ONLY by construction: a milestone is a TOTAL-captured threshold, never a
// consecutive run. Progress only ever counts up; a gap is invisible. There is no streak,
// no "current run", no reset, no loss framing anywhere in this module — and there must
// never be. The only state a consumer keeps is the SET of thresholds already reached;
// detection compares the new total against that set and the thresholds.

/**
 * The milestone thresholds — total moments captured. The SINGLE source of truth; the
 * strip renders one marker per entry and detection crosses them in order. Cumulative
 * totals, never consecutive. Editing this array is the only knob (no other config).
 */
export const MILESTONE_THRESHOLDS = [1, 10, 30, 100, 250] as const;

export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

/**
 * The first rung is reached on the very first capture — which happens during onboarding,
 * a moment that owns its own warm beat. So the first rung is marked SILENTLY (no
 * celebration overlay); celebrations fire from the second rung up. This is the only
 * threshold the celebration layer skips.
 */
export const SILENT_MILESTONE: MilestoneThreshold = MILESTONE_THRESHOLDS[0];

/** Every threshold reached at `totalCount` (count is cumulative, so this only grows). */
export function reachedAt(totalCount: number): number[] {
  return MILESTONE_THRESHOLDS.filter((t) => totalCount >= t);
}

/**
 * Thresholds newly crossed at `totalCount` that are not already in `reached`. Returns
 * them ascending. Idempotent: a threshold already in `reached` is never returned again
 * (re-capture can't re-flag a past milestone), and because `totalCount` only ever rises
 * a gap simply yields `[]` — nothing resets.
 */
export function detectNewMilestones(totalCount: number, reached: Iterable<number>): number[] {
  const reachedSet = new Set(reached);
  return MILESTONE_THRESHOLDS.filter((t) => totalCount >= t && !reachedSet.has(t));
}

/**
 * Whether a reached threshold warrants the celebration overlay. The first rung
 * ([[SILENT_MILESTONE]]) is silent (onboarding owns that beat); every later rung
 * celebrates. Use to filter the output of [[detectNewMilestones]] before celebrating.
 */
export function isCelebratedMilestone(threshold: number): boolean {
  return threshold !== SILENT_MILESTONE;
}
