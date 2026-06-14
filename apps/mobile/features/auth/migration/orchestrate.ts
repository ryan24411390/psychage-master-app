import type { CheckInEntry, LocalCalendarDate } from '@psychage/shared/check-in';
import { toLocalCalendarDate } from '@psychage/shared/check-in';

import { mergeCheckInRecords } from './merge';

// Anonymous → account migration ORCHESTRATION (Flow 9 / SYS-S5), client side.
//
// THE LOCAL/REMOTE BOUNDARY — the section's law:
//   BUILT here (LOCAL, testable): read the local record, merge it into the account
//     set, report the outcome.
//   STUBBED / GATED here (do NOT implement in this wave): the Supabase fetch + push.
//     Gated behind ADR-001 (SR-4), cooling-off → 2026-06-20. The stub writes NOTHING
//     to the network. Check-in data never reaches analytics/Sentry here either.

export interface MigrationRemote {
  /** GATED. Real impl reads the account's rows from Supabase. Stub returns []. */
  fetchAccountEntries(): Promise<readonly CheckInEntry[]>;
  /** GATED. Real impl is the transactional batch insert (rules/auth.md §4). Stub is a no-op. */
  pushMergedEntries(entries: readonly CheckInEntry[]): Promise<void>;
}

// The gated remote, stubbed for this wave. Account side is empty (a fresh V1 account),
// the push goes nowhere. Real impl lands when ADR-001 is Accepted and packages/api exists
// (@supabase/supabase-js + RLS). Swapping this stub for the real client is the ONLY change
// the remote side needs — the merge + read above stay exactly as tested.
export const stubMigrationRemote: MigrationRemote = {
  async fetchAccountEntries() {
    return [];
  },
  async pushMergedEntries() {
    // no-op — the remote write is the gated sync layer (SR-4 ADR).
  },
};

export type MigrationStatus = 'merging' | 'done' | 'offline';

export interface MigrationOutcome {
  readonly status: 'done' | 'offline';
  readonly mergedCount: number;
  readonly conflictsResolved: number;
}

export interface MigrationDeps {
  /** Reads the local entries to migrate (the route wires the 7-day window via the store). */
  readonly readLocalEntries: () => readonly CheckInEntry[];
  readonly remote: MigrationRemote;
}

export async function runMigration(deps: MigrationDeps): Promise<MigrationOutcome> {
  const local = deps.readLocalEntries();

  let account: readonly CheckInEntry[];
  try {
    account = await deps.remote.fetchAccountEntries();
  } catch {
    // Auth/migration needs the network — honest offline outcome, local data untouched.
    return { status: 'offline', mergedCount: 0, conflictsResolved: 0 };
  }

  const { merged, conflictsResolved } = mergeCheckInRecords(account, local);

  try {
    await deps.remote.pushMergedEntries(merged);
  } catch {
    return { status: 'offline', mergedCount: 0, conflictsResolved: 0 };
  }

  return { status: 'done', mergedCount: merged.length, conflictsResolved };
}

// The 7-day TTL window (rules/auth.md §4: migrate "all check-ins from the last 7
// days"). Local-time correct across month/DST boundaries; bounds for store.getRange.
export function lastSevenDayWindow(now: Date): {
  from: LocalCalendarDate;
  to: LocalCalendarDate;
} {
  const to = toLocalCalendarDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  const from = toLocalCalendarDate(start);
  return { from, to };
}
