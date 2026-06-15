// Unit tests for the REAL anon→account migration remote (features/auth/migration/
// remote.ts) — the push-only backup of the merged local record onto the new account.
//
// Proven here, all via an injected fake client + deps (no Supabase, no network):
//   - N merged entries ⇒ N mapped upserts on the per-day conflict key (#72 mapper)
//   - re-running yields BYTE-IDENTICAL payloads (deterministic UTC-midnight key) so a
//     re-push collides on `(user_id, experienced_at)` and UPDATEs instead of duping
//   - a write failure PROPAGATES (NOT swallowed) → runMigration reports `offline`
//   - signed-out / env-unconfigured are handled without writing
//   - SR-4: the ONLY sink touched is `check_ins`; no rpc, no other table

import { asLocalCalendarDate, type CheckInEntry } from '@psychage/shared/check-in';
import type { SupabaseLike, WriteContext } from '@psychage/shared/data';
import { describe, expect, it, vi } from 'vitest';

import { runMigration } from '@/features/auth/migration/orchestrate';
import { createMigrationRemote, MigrationNotAuthenticatedError } from '@/features/auth/migration/remote';
import type { CheckInPushDeps } from '@/lib/check-in-store';

const CTX: WriteContext = { device_id: 'dev-1', client_version: 'mobile@1.0.0' };

function entry(date: string, state: CheckInEntry['state'], note?: string): CheckInEntry {
  const base = { id: `id-${date}`, date: asLocalCalendarDate(date), state };
  return note === undefined ? base : { ...base, note };
}

// Three local entries spanning the window; the middle one carries a note.
const LOCAL: readonly CheckInEntry[] = [
  entry('2026-06-10', 2),
  entry('2026-06-11', 4, 'a steadier day'),
  entry('2026-06-12', 0),
];

interface UpsertCall {
  table: string;
  values: Record<string, unknown>;
  options?: { onConflict?: string };
}

interface ClientSpy {
  calls: UpsertCall[];
  rpcCalled: boolean;
}

/** Fake SupabaseLike accumulating every upsert; `failOnCall` (1-based) simulates a mid-batch error. */
function makeClient(spy: ClientSpy, failOnCall?: number): SupabaseLike {
  let table = '';
  let n = 0;
  const builder: Record<string, unknown> = {
    upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => {
      n += 1;
      if (failOnCall === n) throw new Error('network down');
      spy.calls.push({ table, values, options });
      return builder;
    },
    select: () => builder,
    single: () => Promise.resolve({ data: { id: `row-${n}` }, error: null }),
  };
  return {
    from: (t: string) => {
      table = t;
      return builder as never;
    },
    rpc: () => {
      spy.rpcCalled = true;
      return Promise.resolve({ data: null, error: null });
    },
  } as unknown as SupabaseLike;
}

function makeDeps(
  over: Partial<CheckInPushDeps>,
  spy: ClientSpy,
  failOnCall?: number,
): CheckInPushDeps {
  return {
    enabled: () => true,
    getConsent: () => true,
    getUserId: async () => 'user-1',
    getWriteClient: () => makeClient(spy, failOnCall),
    writeContext: () => CTX,
    ...over,
  };
}

const newSpy = (): ClientSpy => ({ calls: [], rpcCalled: false });

describe('createMigrationRemote — push-only account backup', () => {
  it('upserts every merged entry, mapped, on the per-day conflict key', async () => {
    const spy = newSpy();
    const remote = createMigrationRemote(makeDeps({}, spy));

    await remote.pushMergedEntries(LOCAL);

    expect(spy.calls).toHaveLength(3);
    // SR-4: the ONLY sink is check_ins, and the rpc lane is never touched.
    expect(spy.calls.every((c) => c.table === 'check_ins')).toBe(true);
    expect(spy.calls.every((c) => c.options?.onConflict === 'user_id,experienced_at')).toBe(true);
    expect(spy.rpcCalled).toBe(false);

    // #72 mapper: state→{1,3,5,7,9}, date→UTC-midnight, note→prompt_response, +§2 stamp.
    expect(spy.calls[0]?.values).toMatchObject({
      user_id: 'user-1',
      mood_score: 5,
      experienced_at: '2026-06-10T00:00:00.000Z',
      context: {},
      device_id: 'dev-1',
      client_version: 'mobile@1.0.0',
    });
    expect(spy.calls[0]?.values).not.toHaveProperty('prompt_response');
    expect(spy.calls[1]?.values).toMatchObject({
      mood_score: 9,
      experienced_at: '2026-06-11T00:00:00.000Z',
      prompt_response: 'a steadier day',
    });
    expect(spy.calls[2]?.values).toMatchObject({ mood_score: 1 });
    expect(spy.calls[2]?.values).not.toHaveProperty('prompt_response');
  });

  it('is idempotent: a re-push produces byte-identical payloads + conflict key', async () => {
    const first = newSpy();
    const second = newSpy();
    await createMigrationRemote(makeDeps({}, first)).pushMergedEntries(LOCAL);
    await createMigrationRemote(makeDeps({}, second)).pushMergedEntries(LOCAL);

    // Identical wire payloads across runs ⇒ same (user_id, experienced_at) key ⇒ the
    // DB unique index collapses the second push onto the first (UPDATE, not INSERT).
    expect(second.calls.map((c) => c.values)).toEqual(first.calls.map((c) => c.values));
    expect(second.calls.map((c) => c.options)).toEqual(first.calls.map((c) => c.options));
  });

  it('PROPAGATES a write failure (not swallowed like the ambient per-save push)', async () => {
    const spy = newSpy();
    const remote = createMigrationRemote(makeDeps({}, spy, 2)); // fail on the 2nd write
    await expect(remote.pushMergedEntries(LOCAL)).rejects.toThrow('network down');
    expect(spy.calls).toHaveLength(1); // the first landed; the batch then aborted
  });

  it('throws MigrationNotAuthenticatedError when signed out, without writing', async () => {
    const spy = newSpy();
    const getWriteClient = vi.fn(() => makeClient(spy));
    const remote = createMigrationRemote(makeDeps({ getUserId: async () => null, getWriteClient }, spy));

    await expect(remote.pushMergedEntries(LOCAL)).rejects.toBeInstanceOf(MigrationNotAuthenticatedError);
    expect(getWriteClient).not.toHaveBeenCalled();
    expect(spy.calls).toHaveLength(0);
  });

  it('skips quietly (no write) when Supabase is unconfigured', async () => {
    const spy = newSpy();
    const getUserId = vi.fn(async () => 'user-1');
    const remote = createMigrationRemote(makeDeps({ enabled: () => false, getUserId }, spy));

    await expect(remote.pushMergedEntries(LOCAL)).resolves.toBeUndefined();
    expect(getUserId).not.toHaveBeenCalled();
    expect(spy.calls).toHaveLength(0);
  });

  it('fetchAccountEntries returns [] (V1 fresh-account, no pull lane)', async () => {
    const remote = createMigrationRemote(makeDeps({}, newSpy()));
    await expect(remote.fetchAccountEntries()).resolves.toEqual([]);
  });
});

describe('runMigration with the real remote', () => {
  it('pushes the full local set and reports done (fresh empty account)', async () => {
    const spy = newSpy();
    const remote = createMigrationRemote(makeDeps({}, spy));

    const outcome = await runMigration({ readLocalEntries: () => LOCAL, remote });

    expect(outcome.status).toBe('done');
    expect(outcome.mergedCount).toBe(3);
    expect(spy.calls).toHaveLength(3);
  });

  it('reports offline when the push fails — local data is never touched', async () => {
    const spy = newSpy();
    const remote = createMigrationRemote(makeDeps({}, spy, 1)); // fail on the 1st write
    const local = [...LOCAL];

    const outcome = await runMigration({ readLocalEntries: () => local, remote });

    expect(outcome.status).toBe('offline');
    expect(local).toEqual(LOCAL); // the flow never mutates the local record
  });
});
