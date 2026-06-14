import type { CheckInEntry, LocalCalendarDate } from '@psychage/shared/check-in';

// Anonymous → account check-in MERGE. LOCAL + Vitest-testable; this is the part of
// the upgrade (Flow 9 / SYS-S5) that must NEVER lose an entry — losing a single
// local entry during upgrade is a launch blocker.
//
// Rule: union by calendar DATE. Every distinct date from either set appears exactly
// once in the result — no entry is discarded. On a same-day collision the LOCAL
// (upgrade-time) entry wins.
//
// FLAGGED TIEBREAKER: the brief says "same-day conflicts keep the newer save", but
// CheckInEntry is {id,date,state,note?} with NO savedAt timestamp, and a single store
// holds at most one entry per day (date is its Map key). A true same-day collision can
// only arise across two SETS (local vs account). With no per-entry timestamp, "newer
// save" is interpreted as the LOCAL set — the data the user is actively upgrading is
// the most recent truth at the upgrade moment. In V1 the account side is empty (a fresh
// account; rules/auth.md §4 — one-way, one-time, no account-merge), so no real collision
// occurs; this resolution is the forward-looking generalisation. If true timestamp LWW
// is ever required, that needs a `savedAt` field + a versioned migrator (Sacred Rule #13).

export interface MergeResult {
  /** Union of both sets, one entry per date, sorted ascending by date. */
  readonly merged: readonly CheckInEntry[];
  /** Count of dates present in BOTH sets (resolved local-wins). */
  readonly conflictsResolved: number;
}

export function mergeCheckInRecords(
  accountEntries: readonly CheckInEntry[],
  localEntries: readonly CheckInEntry[],
): MergeResult {
  const byDate = new Map<LocalCalendarDate, CheckInEntry>();
  for (const entry of accountEntries) byDate.set(entry.date, entry);

  let conflictsResolved = 0;
  for (const entry of localEntries) {
    if (byDate.has(entry.date)) conflictsResolved += 1; // local overrides account same-day
    byDate.set(entry.date, entry);
  }

  // YYYY-MM-DD is fixed-width, so lexical order equals chronological order.
  const merged = [...byDate.values()].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  return { merged, conflictsResolved };
}
