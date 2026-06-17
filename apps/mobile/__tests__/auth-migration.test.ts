import type { Moment } from '@psychage/shared/engagement';
import { describe, expect, it, vi } from 'vitest';

import { mergeMomentRecords } from '@/features/auth/migration/merge';
import {
  lastSevenDayWindow,
  runMigration,
  stubMigrationRemote,
  type MigrationRemote,
} from '@/features/auth/migration/orchestrate';

// The migration is the launch-blocker surface: losing a single local moment during
// the anonymous→account upgrade is a launch blocker. Moments are append-only with a
// client-minted id, so the merge unions BY ID (a shared id is the same capture; local
// wins). The REMOTE write is stubbed/gated (SR-4 ADR) — exercised via the stub seam.

// The 3rd arg is a band 1..5, mapped to that band's anchor WORD — moments are
// affect-labeled now, so a distinct band gives a distinct `labelPrimary` for the
// local-wins assertions below.
const BAND_WORD = ['', 'overwhelmed', 'anxious', 'steady', 'calm', 'joyful'] as const;
function moment(id: string, ts: string, band: number): Moment {
  return { id, timestamp: ts, labelPrimary: BAND_WORD[band] ?? 'steady', routedToSupport: false };
}

const ids = (ms: readonly Moment[]) => ms.map((m) => m.id);

describe('mergeMomentRecords', () => {
  it('returns nothing for two empty sets', () => {
    const { merged, conflictsResolved } = mergeMomentRecords([], []);
    expect(merged).toEqual([]);
    expect(conflictsResolved).toBe(0);
  });

  it('keeps every local moment when the account is empty (the fresh-account upgrade)', () => {
    const local = [
      moment('a', '2026-06-10T09:00:00.000Z', 2),
      moment('c', '2026-06-12T09:00:00.000Z', 4),
      moment('b', '2026-06-11T09:00:00.000Z', 1),
    ];
    const { merged, conflictsResolved } = mergeMomentRecords([], local);
    expect(ids(merged)).toEqual(['a', 'b', 'c']); // sorted by timestamp, none lost
    expect(conflictsResolved).toBe(0);
  });

  it('unions disjoint ids without dropping any moment', () => {
    const account = [moment('x', '2026-06-08T09:00:00.000Z', 1), moment('y', '2026-06-09T09:00:00.000Z', 3)];
    const local = [moment('a', '2026-06-10T09:00:00.000Z', 2), moment('b', '2026-06-11T09:00:00.000Z', 4)];
    const { merged, conflictsResolved } = mergeMomentRecords(account, local);
    expect(merged).toHaveLength(4);
    expect(ids(merged)).toEqual(['x', 'y', 'a', 'b']);
    expect(conflictsResolved).toBe(0);
  });

  it('resolves a shared-id collision local-wins and counts it (no moment lost)', () => {
    const account = [moment('shared', '2026-06-10T09:00:00.000Z', 1), moment('y', '2026-06-09T09:00:00.000Z', 1)];
    const local = [moment('shared', '2026-06-10T09:00:00.000Z', 5), moment('b', '2026-06-11T09:00:00.000Z', 2)];
    const { merged, conflictsResolved } = mergeMomentRecords(account, local);

    expect(ids(merged).sort()).toEqual(['b', 'shared', 'y']);
    expect(merged.find((m) => m.id === 'shared')?.labelPrimary).toBe('joyful'); // local (band 5) wins
    expect(conflictsResolved).toBe(1);
  });
});

describe('runMigration (remote stubbed/gated)', () => {
  it('merges local into the empty stub account and reports done', async () => {
    const local = [moment('a', '2026-06-10T09:00:00.000Z', 2), moment('b', '2026-06-11T09:00:00.000Z', 3)];
    const outcome = await runMigration({ readLocalEntries: () => local, remote: stubMigrationRemote });
    expect(outcome.status).toBe('done');
    expect(outcome.mergedCount).toBe(2);
    expect(outcome.conflictsResolved).toBe(0);
  });

  it('pushes the merged set to the remote seam (local wins a shared id)', async () => {
    const account = [moment('shared', '2026-06-10T09:00:00.000Z', 1)];
    const local = [moment('shared', '2026-06-10T09:00:00.000Z', 5), moment('b', '2026-06-11T09:00:00.000Z', 2)];
    const push = vi.fn<(ms: readonly Moment[]) => Promise<void>>(async () => {});
    const remote: MigrationRemote = { fetchAccountEntries: async () => account, pushMergedEntries: push };

    const outcome = await runMigration({ readLocalEntries: () => local, remote });

    expect(outcome.status).toBe('done');
    expect(outcome.conflictsResolved).toBe(1);
    expect(push).toHaveBeenCalledTimes(1);
    const pushed = push.mock.calls[0]?.[0] ?? [];
    expect(pushed.find((m) => m.id === 'shared')?.labelPrimary).toBe('joyful');
    expect(pushed).toHaveLength(2);
  });

  it('reports offline (and does not push) when the remote fetch fails', async () => {
    const push = vi.fn<(ms: readonly Moment[]) => Promise<void>>(async () => {});
    const remote: MigrationRemote = {
      fetchAccountEntries: async () => {
        throw new Error('no network');
      },
      pushMergedEntries: push,
    };
    const outcome = await runMigration({
      readLocalEntries: () => [moment('a', '2026-06-10T09:00:00.000Z', 2)],
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
