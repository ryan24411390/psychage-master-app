// Pure local→cloud mapper for the best-effort check-in PUSH (SR-4 carve-out,
// ADR-001 Accepted 2026-06-14). Shapes a local `CheckInEntry` into the data
// layer's `CheckInInput` for `writeCheckIn`. No I/O, no deps — unit-testable in
// isolation. LOCAL stays the source of truth; this only describes the backup.

import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import type { CheckInInput } from '@psychage/shared/data';

/**
 * Local 0..4 ordinal → server `mood_score` ∈ {1,3,5,7,9}. Spreads the 5-point
 * local scale across the 1..10 server scale (DB check: 1..10) at its odd
 * midpoints, leaving symmetric headroom at both ends.
 */
export function stateToMoodScore(state: CheckInState): number {
  return state * 2 + 1;
}

/**
 * Reverse of {@link stateToMoodScore}: nearest local state, clamped to 0..4.
 * Push-only does not call this yet (there is no pull lane), but the slice
 * contract requires the mapping be reversible.
 */
export function moodScoreToState(score: number): CheckInState {
  const nearest = Math.round((score - 1) / 2);
  return Math.min(4, Math.max(0, nearest)) as CheckInState;
}

/**
 * Local calendar day `YYYY-MM-DD` → `experienced_at` as that date's UTC-midnight.
 *
 * WHY UTC-midnight, not the device's local midnight: the cloud idempotency key is
 * the unique index `(user_id, experienced_at)`. A re-push of the same calendar day
 * must produce the BYTE-IDENTICAL instant so it collides and upserts instead of
 * duplicating. UTC-midnight is deterministic and tz-independent — re-pushing
 * "2026-06-15" always yields `2026-06-15T00:00:00.000Z`. Local-midnight stored as
 * timestamptz would vary with the device's tz between pushes and could collapse two
 * adjacent local days onto one server date.
 */
export function localDateToExperiencedAt(date: string): string {
  return `${date}T00:00:00.000Z`;
}

/** Reverse helper (unused by push-only; defined for the eventual pull lane). */
export function experiencedAtToLocalDate(experiencedAt: string): string {
  return experiencedAt.slice(0, 10);
}

/**
 * Shape a local entry into a data-layer `CheckInInput` for `writeCheckIn`. The
 * note lands in `prompt_response` (the schema's typed free-text column); `prompt_id`
 * is left undefined — a local check-in has no contextual-prompt concept. `context`
 * is the required non-PII metadata bag and is empty here.
 */
export function mapEntryToCheckInInput(entry: CheckInEntry, userId: string): CheckInInput {
  return {
    user_id: userId,
    mood_score: stateToMoodScore(entry.state),
    experienced_at: localDateToExperiencedAt(entry.date),
    ...(entry.note !== undefined ? { prompt_response: entry.note } : {}),
    context: {},
  };
}
