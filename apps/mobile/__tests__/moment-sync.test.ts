// Unit tests for the Moments sync lanes: the pure local↔cloud mappers, the
// best-effort push (swallow + consent/auth gates), and the pull/restore merge.
// Injected fakes only — no real Supabase, no network.

import { describe, expect, it, vi } from 'vitest';

import { MomentStore, type Moment, type Storage } from '@psychage/shared/engagement';
import type { MomentRecord, SupabaseLike, WriteContext } from '@psychage/shared/data';

import { mapMomentToInput, mapRecordToMoment } from '@/lib/moment-sync-map';
import {
  type MomentSyncDeps,
  hydrateMomentsFromRemote,
  pushMoment,
} from '@/lib/moment-store';

const MOMENT: Moment = {
  id: 'mm_1',
  timestamp: '2026-06-17T09:00:00.000Z',
  labelPrimary: 'calm', // band 4 → server valence 4
  labelSecondary: 'grateful',
  note: 'a line',
  routedToSupport: false,
};

const CTX: WriteContext = { device_id: 'dev-1', client_version: 'mobile@1.0.0' };

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

// ── mappers (pure) ────────────────────────────────────────────────────────────

describe('mapMomentToInput', () => {
  it('carries the client-minted id + maps words to labels; valence is derived from the band', () => {
    expect(mapMomentToInput(MOMENT, 'user-1')).toEqual({
      id: 'mm_1',
      user_id: 'user-1',
      experienced_at: '2026-06-17T09:00:00.000Z',
      valence: 4, // bandForLabel('calm')
      labels: ['calm', 'grateful'], // primary + optional secondary
      context: [], // retired locally — sent empty
      routed_to_support: false,
      note: 'a line',
    });
  });

  it('omits note when absent', () => {
    const noNote: Moment = { ...MOMENT, note: undefined };
    expect(mapMomentToInput(noNote, 'user-1')).not.toHaveProperty('note');
  });
});

describe('mapRecordToMoment (pull lane)', () => {
  it('maps a server record back to a local moment (labels → words)', () => {
    const record = {
      id: 'r1',
      user_id: 'user-1',
      created_at: 'x',
      updated_at: 'y',
      device_id: 'd',
      client_version: 'v',
      schema_version: 1,
      experienced_at: '2026-06-10T09:00:00.000Z',
      valence: 5,
      labels: ['hopeful', 'light'],
      context: [],
      routed_to_support: false,
    } as unknown as MomentRecord;
    expect(mapRecordToMoment(record)).toEqual({
      id: 'r1',
      timestamp: '2026-06-10T09:00:00.000Z',
      labelPrimary: 'hopeful',
      labelSecondary: 'light',
      routedToSupport: false,
    });
  });

  it('a word-less legacy row falls back to its band-ANCHOR word (no row lost)', () => {
    const record = {
      id: 'r2',
      experienced_at: '2026-06-10T09:00:00.000Z',
      valence: 1,
      labels: [],
      context: ['x'],
      routed_to_support: true,
    } as unknown as MomentRecord;
    const m = mapRecordToMoment(record);
    expect(m.labelPrimary).toBe('overwhelmed'); // band-1 anchor
    expect(m.labelSecondary).toBeUndefined();
    expect(m.routedToSupport).toBe(true);
  });
});

// ── push (best-effort) ──────────────────────────────────────────────────────────

interface Capture {
  table?: string;
  upsert?: Record<string, unknown>;
  upsertOptions?: { onConflict?: string };
  selectedTable?: string;
}

function makeClient(capture: Capture, opts: { throwOnUpsert?: boolean; rows?: unknown[] } = {}): SupabaseLike {
  const builder: Record<string, unknown> = {};
  Object.assign(builder, {
    upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => {
      if (opts.throwOnUpsert) throw new Error('network down');
      capture.upsert = values;
      capture.upsertOptions = options;
      return builder;
    },
    select: () => builder,
    eq: () => Promise.resolve({ data: opts.rows ?? [], error: null }),
    single: () => Promise.resolve({ data: { id: 'row-1' }, error: null }),
  });
  return {
    from: (table: string) => {
      capture.table = table;
      return builder as never;
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  } as unknown as SupabaseLike;
}

function pushDeps(over: Partial<MomentSyncDeps>, capture: Capture, opts?: { throwOnUpsert?: boolean; rows?: unknown[] }): MomentSyncDeps {
  return {
    enabled: () => true,
    getConsent: () => true,
    getUserId: async () => 'user-1',
    getClient: () => makeClient(capture, opts),
    writeContext: () => CTX,
    ...over,
  };
}

describe('pushMoment — best-effort backup', () => {
  it('upserts the mapped payload on the client-minted id key', async () => {
    const capture: Capture = {};
    await pushMoment(MOMENT, pushDeps({}, capture));
    expect(capture.table).toBe('moments');
    expect(capture.upsert).toMatchObject({
      id: 'mm_1',
      user_id: 'user-1',
      valence: 4,
      device_id: 'dev-1',
      client_version: 'mobile@1.0.0',
    });
    expect(capture.upsertOptions).toEqual({ onConflict: 'id' });
  });

  it('swallows a write failure — never throws (local save is source of truth)', async () => {
    const capture: Capture = {};
    await expect(pushMoment(MOMENT, pushDeps({}, capture, { throwOnUpsert: true }))).resolves.toBeUndefined();
  });

  it('skips when signed out / unconfigured / un-consented (consent checked before auth)', async () => {
    const signedOut: Capture = {};
    await pushMoment(MOMENT, pushDeps({ getUserId: async () => null }, signedOut));
    expect(signedOut.upsert).toBeUndefined();

    const offEnv: Capture = {};
    const uidA = vi.fn(async () => 'user-1');
    await pushMoment(MOMENT, pushDeps({ enabled: () => false, getUserId: uidA }, offEnv));
    expect(uidA).not.toHaveBeenCalled();

    const noConsent: Capture = {};
    const uidB = vi.fn(async () => 'user-1');
    await pushMoment(MOMENT, pushDeps({ getConsent: () => false, getUserId: uidB }, noConsent));
    expect(uidB).not.toHaveBeenCalled();
    expect(noConsent.upsert).toBeUndefined();
  });
});

// ── pull / restore (survives reinstall) ─────────────────────────────────────────

describe('hydrateMomentsFromRemote — pull/restore', () => {
  const REMOTE_ROWS = [
    {
      id: 'srv-1',
      experienced_at: '2026-06-10T09:00:00.000Z',
      valence: 4,
      labels: [],
      context: [],
      routed_to_support: false,
    },
  ];

  it('restores remote moments into a fresh (reinstalled) local store', async () => {
    const fresh = new MomentStore({ storage: memStorage(), now: () => new Date(), generateId: () => 'x' });
    expect(fresh.getAll()).toHaveLength(0);
    const ran = await hydrateMomentsFromRemote(fresh, pushDeps({}, {}, { rows: REMOTE_ROWS }));
    expect(ran).toBe(true);
    expect(fresh.getAll().map((m) => m.id)).toEqual(['srv-1']);
  });

  it('skips (returns false) when un-consented — no fetch', async () => {
    const fresh = new MomentStore({ storage: memStorage(), now: () => new Date(), generateId: () => 'x' });
    const uid = vi.fn(async () => 'user-1');
    const ran = await hydrateMomentsFromRemote(fresh, pushDeps({ getConsent: () => false, getUserId: uid }, {}, { rows: REMOTE_ROWS }));
    expect(ran).toBe(false);
    expect(uid).not.toHaveBeenCalled();
    expect(fresh.getAll()).toHaveLength(0);
  });
});
