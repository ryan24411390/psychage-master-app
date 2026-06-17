import { type Moment, type LocalCalendarDate, toLocalCalendarDate } from '@psychage/shared/engagement';

import { mergeMomentRecords } from './merge';

// Anonymous → account MOMENTS migration ORCHESTRATION (Flow 9 / SYS-S5), client side.
//
// BUILT here (LOCAL, testable): read the local moments, merge them into the account
//   set, report the outcome. STUBBED/GATED: the Supabase fetch + push (the moment
//   sync layer, SR-4 / ADR-001). Moment data never reaches analytics/Sentry here.

export interface MigrationRemote {
  /** Real impl reads the account's moments from Supabase. Stub returns []. */
  fetchAccountEntries(): Promise<readonly Moment[]>;
  /** Real impl is the best-effort batch upsert of the merged set. Stub is a no-op. */
  pushMergedEntries(moments: readonly Moment[]): Promise<void>;
}

// The gated remote, stubbed. Account side empty (a fresh V1 account); push goes nowhere.
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
  /** Reads the local moments to migrate (the route wires the 7-day window via the store). */
  readonly readLocalEntries: () => readonly Moment[];
  readonly remote: MigrationRemote;
}

export async function runMigration(deps: MigrationDeps): Promise<MigrationOutcome> {
  const local = deps.readLocalEntries();

  let account: readonly Moment[];
  try {
    account = await deps.remote.fetchAccountEntries();
  } catch {
    return { status: 'offline', mergedCount: 0, conflictsResolved: 0 };
  }

  const { merged, conflictsResolved } = mergeMomentRecords(account, local);

  try {
    await deps.remote.pushMergedEntries(merged);
  } catch {
    return { status: 'offline', mergedCount: 0, conflictsResolved: 0 };
  }

  return { status: 'done', mergedCount: merged.length, conflictsResolved };
}

// The 7-day TTL window (rules/auth.md §4: migrate the last 7 days). Local-time correct
// across month/DST boundaries; bounds for store.getRange.
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
