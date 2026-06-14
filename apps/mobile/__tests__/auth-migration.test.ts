import { asLocalCalendarDate, type CheckInEntry, type CheckInState } from '@psychage/shared/check-in';
import { describe, expect, it, vi } from 'vitest';

import { mergeCheckInRecords } from '@/features/auth/migration/merge';
import {
  lastSevenDayWindow,
  runMigration,
  stubMigrationRemote,
  type MigrationRemote,
} from '@/features/auth/migration/orchestrate';

// The migration is the launch-blocker surface: losing a single local entry during
// the anonymous→account upgrade is a launch blocker. These prove the LOCAL merge
// loses nothing and resolves a same-day collision newest(local)-wins. The REMOTE
// write is stubbed/gated (SR-4 ADR) — exercised only through the stub seam.

function entry(date: string, state: CheckInState, note?: string): CheckInEntry {
  const base = { id: `id-${date}`, date: asLocalCalendarDate(date), state };
  return note === undefined ? base : { ...base, note };
}

const dates = (entries: readonly CheckInEntry[]) => entries.map((e) => e.date);

describe('mergeCheckInRecords', () => {
  it('returns nothing for two empty sets', () => {
    const { merged, conflictsResolved } = mergeCheckInRecords([], []);
    expect(merged).toEqual([]);
    expect(conflictsResolved).toBe(0);
  });

  it('keeps every local entry when the account is empty (the fresh-account upgrade)', () => {
    const local = [entry('2026-06-10', 2), entry('2026-06-12', 4), entry('2026-06-11', 0)];
    const { merged, conflictsResolved } = mergeCheckInRecords([], local);
    expect(dates(merged)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']); // sorted, none lost
    expect(conflictsResolved).toBe(0);
  });

  it('unions disjoint dates without dropping any entry', () => {
    const account = [entry('2026-06-08', 1), entry('2026-06-09', 3)];
    const local = [entry('2026-06-10', 2), entry('2026-06-11', 4)];
    const { merged, conflictsResolved } = mergeCheckInRecords(account, local);
    expect(merged).toHaveLength(4);
    expect(dates(merged)).toEqual(['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11']);
    expect(conflictsResolved).toBe(0);
  });

  it('resolves a same-day collision local-wins and counts it (no entry lost)', () => {
    const account = [entry('2026-06-10', 0, 'account note'), entry('2026-06-09', 1)];
    const local = [entry('2026-06-10', 4, 'local note'), entry('2026-06-11', 2)];
    const { merged, conflictsResolved } = mergeCheckInRecords(account, local);

    // Distinct dates preserved: 09, 10, 11 — three entries, none discarded.
    expect(dates(merged)).toEqual(['2026-06-09', '2026-06-10', '2026-06-11']);
    // The same-day winner is the LOCAL entry.
    const tenth = merged.find((e) => e.date === '2026-06-10');
    expect(tenth?.state).toBe(4);
    expect(tenth?.note).toBe('local note');
    expect(conflictsResolved).toBe(1);
  });
});

describe('runMigration (remote stubbed/gated)', () => {
  it('merges local into the empty stub account and reports done', async () => {
    const local = [entry('2026-06-10', 2), entry('2026-06-11', 3)];
    const outcome = await runMigration({
      readLocalEntries: () => local,
      remote: stubMigrationRemote,
    });
    expect(outcome.status).toBe('done');
    expect(outcome.mergedCount).toBe(2);
    expect(outcome.conflictsResolved).toBe(0);
  });

  it('pushes the merged set to the remote seam (newest-wins on same day)', async () => {
    const account = [entry('2026-06-10', 0)];
    const local = [entry('2026-06-10', 4), entry('2026-06-11', 2)];
    const push = vi.fn<(entries: readonly CheckInEntry[]) => Promise<void>>(async () => {});
    const remote: MigrationRemote = {
      fetchAccountEntries: async () => account,
      pushMergedEntries: push,
    };

    const outcome = await runMigration({ readLocalEntries: () => local, remote });

    expect(outcome.status).toBe('done');
    expect(outcome.conflictsResolved).toBe(1);
    expect(push).toHaveBeenCalledTimes(1);
    const pushed = push.mock.calls[0]?.[0] ?? [];
    expect(pushed.find((e) => e.date === '2026-06-10')?.state).toBe(4);
    expect(pushed).toHaveLength(2);
  });

  it('reports offline (and does not push) when the remote fetch fails', async () => {
    const push = vi.fn<(entries: readonly CheckInEntry[]) => Promise<void>>(async () => {});
    const remote: MigrationRemote = {
      fetchAccountEntries: async () => {
        throw new Error('no network');
      },
      pushMergedEntries: push,
    };
    const outcome = await runMigration({
      readLocalEntries: () => [entry('2026-06-10', 2)],
      remote,
    });
    expect(outcome.status).toBe('offline');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('lastSevenDayWindow', () => {
  it('spans the inclusive 7-day TTL window ending today', () => {
    const { from, to } = lastSevenDayWindow(new Date(2026, 5, 14, 9, 30)); // 2026-06-14 local
    expect(to).toBe('2026-06-14');
    expect(from).toBe('2026-06-08');
  });

  it('crosses a month boundary correctly', () => {
    const { from, to } = lastSevenDayWindow(new Date(2026, 6, 3, 0, 30)); // 2026-07-03 local
    expect(to).toBe('2026-07-03');
    expect(from).toBe('2026-06-27');
  });
});
