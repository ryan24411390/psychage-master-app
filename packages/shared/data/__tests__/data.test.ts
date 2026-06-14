// Data layer unit tests — exercise the read/write wrappers through an injected
// fake SupabaseLike, prove the check-in gate is OFF, and assert the §2 write stamp
// + the empty v1 migrator registry. No real Supabase client, no network.

import { describe, expect, it } from 'vitest';

import {
  DataAccessError,
  defaultPlatformClaimProvider,
  noopSupabaseClient,
  type SupabaseLike,
} from '../adapters';
import {
  CHECKIN_PERSISTENCE_ENABLED,
  CheckInPersistenceDisabledError,
  writeCheckIn,
} from '../checkin-gate';
import * as barrel from '../index';
import { DATA_SCHEMA_VERSION, migratorCount, runForwardMigrations } from '../migrations';
import type { WriteContext } from '../types';
import {
  readCheckIns,
  readProfile,
  readTherapistLinks,
  writeNavigatorHistory,
  writeProfile,
  writeTherapistLink,
} from '../wrappers';

// ── Recording fake client ─────────────────────────────────────────────────────

interface Capture {
  table?: string;
  insert?: Record<string, unknown>;
  upsert?: Record<string, unknown>;
  eq: [string, string][];
  rpc?: string;
  rpcArgs?: Record<string, unknown>;
}

interface FakeReturns {
  rows?: readonly unknown[];
  single?: unknown;
  maybeSingle?: unknown;
  rpc?: unknown;
  error?: { message: string };
}

function makeClient(returns: FakeReturns, capture: Capture): SupabaseLike {
  const err = returns.error ?? null;
  const result = (data: unknown) => Promise.resolve({ data, error: err });
  // The builder is a real Promise (so `await builder` resolves the list read via the
  // native thenable) with the PostgREST chain methods attached — no literal `then`.
  const methods = {
    select: () => builder,
    insert: (values: Record<string, unknown>) => {
      capture.insert = values;
      return builder;
    },
    upsert: (values: Record<string, unknown>) => {
      capture.upsert = values;
      return builder;
    },
    eq: (column: string, value: string) => {
      capture.eq.push([column, value]);
      return builder;
    },
    single: () => result(returns.single),
    maybeSingle: () => result(returns.maybeSingle ?? null),
  };
  const builder = Object.assign(result(returns.rows ?? []), methods);
  const client = {
    from: (table: string) => {
      capture.table = table;
      return builder;
    },
    rpc: (fn: string, args?: Record<string, unknown>) => {
      capture.rpc = fn;
      capture.rpcArgs = args;
      return result(returns.rpc);
    },
  };
  return client as unknown as SupabaseLike;
}

function emptyCapture(): Capture {
  return { eq: [] };
}

const ctx: WriteContext = { device_id: 'dev-1', client_version: 'mobile@1.0.0' };

// ── Check-in gate (OFF) ───────────────────────────────────────────────────────

describe('check-in gate', () => {
  it('CHECKIN_PERSISTENCE_ENABLED is false', () => {
    expect(CHECKIN_PERSISTENCE_ENABLED).toBe(false);
  });

  it('writeCheckIn throws while the gate is OFF', async () => {
    const capture = emptyCapture();
    const client = makeClient({ single: {} }, capture);
    await expect(
      writeCheckIn(
        client,
        { user_id: 'u1', mood_score: 5, experienced_at: 'now', context: {} },
        ctx,
      ),
    ).rejects.toBeInstanceOf(CheckInPersistenceDisabledError);
    // It throws BEFORE touching the client — no insert reached the seam.
    expect(capture.table).toBeUndefined();
    expect(capture.insert).toBeUndefined();
  });

  it('writeCheckIn is NOT on the public barrel surface', () => {
    expect('writeCheckIn' in barrel).toBe(false);
    expect('CHECKIN_PERSISTENCE_ENABLED' in barrel).toBe(false);
  });
});

// ── DI seam: safe no-op defaults (AC-8.2) ─────────────────────────────────────

describe('DI no-op defaults', () => {
  it('noop client throws "no Supabase client injected" on from/rpc', () => {
    expect(() => noopSupabaseClient.from('check_ins')).toThrow('no Supabase client injected');
    expect(() => noopSupabaseClient.rpc('get_therapist_links')).toThrow(DataAccessError);
  });

  it('default platform claim is web (read-only)', () => {
    expect(defaultPlatformClaimProvider()).toBe('web');
  });
});

// ── §2 write stamping (AC-8.3) ────────────────────────────────────────────────

describe('write stamping', () => {
  it('writeNavigatorHistory stamps device_id/client_version/schema_version', async () => {
    const capture = emptyCapture();
    const client = makeClient({ single: { id: 'n1' } }, capture);
    await writeNavigatorHistory(
      client,
      {
        user_id: 'u1',
        matched_conditions: [{ condition_id: 'gad', confidence: 0.7, tier: 'primary' }],
        duration_category: 'acute',
        flow_completed: true,
        crisis_triggered: false,
        outcome: 'saved',
      },
      ctx,
    );
    expect(capture.table).toBe('navigator_history');
    expect(capture.insert).toMatchObject({
      user_id: 'u1',
      device_id: 'dev-1',
      client_version: 'mobile@1.0.0',
      schema_version: DATA_SCHEMA_VERSION,
    });
    // Server-managed columns are NOT sent by the client.
    expect(capture.insert).not.toHaveProperty('id');
    expect(capture.insert).not.toHaveProperty('created_at');
  });

  it('SR-4: navigator write carries no raw-symptom field', async () => {
    const capture = emptyCapture();
    const client = makeClient({ single: { id: 'n1' } }, capture);
    await writeNavigatorHistory(
      client,
      {
        user_id: 'u1',
        matched_conditions: [],
        duration_category: 'chronic',
        flow_completed: false,
        crisis_triggered: false,
      },
      ctx,
    );
    const keys = Object.keys(capture.insert ?? {});
    expect(keys).not.toContain('symptoms');
    expect(keys).not.toContain('raw_symptoms');
    expect(keys).not.toContain('symptom_selections');
  });

  it('writeProfile stamps schema_version only (no device_id/client_version)', async () => {
    const capture = emptyCapture();
    const client = makeClient({ single: { user_id: 'u1' } }, capture);
    await writeProfile(client, {
      user_id: 'u1',
      preferred_language: 'en',
      premium_status: 'free',
      display_name: 'A',
    });
    expect(capture.table).toBe('profiles');
    expect(capture.upsert).toMatchObject({ user_id: 'u1', schema_version: DATA_SCHEMA_VERSION });
    expect(capture.upsert).not.toHaveProperty('device_id');
    expect(capture.upsert).not.toHaveProperty('client_version');
  });

  it('propagates a PostgREST error as DataAccessError', async () => {
    const capture = emptyCapture();
    const client = makeClient({ single: null, error: { message: 'boom' } }, capture);
    await expect(
      writeNavigatorHistory(
        client,
        {
          user_id: 'u1',
          matched_conditions: [],
          duration_category: 'acute',
          flow_completed: true,
          crisis_triggered: false,
        },
        ctx,
      ),
    ).rejects.toThrowError(new DataAccessError('boom'));
  });
});

// ── Reads ─────────────────────────────────────────────────────────────────────

describe('reads', () => {
  it('readCheckIns selects from check_ins filtered by user', async () => {
    const capture = emptyCapture();
    const rows = [{ id: 'c1', user_id: 'u1' }];
    const client = makeClient({ rows }, capture);
    const out = await readCheckIns(client, 'u1');
    expect(capture.table).toBe('check_ins');
    expect(capture.eq).toContainEqual(['user_id', 'u1']);
    expect(out).toBe(rows);
  });

  it('readProfile uses maybeSingle and returns null when absent', async () => {
    const capture = emptyCapture();
    const client = makeClient({ maybeSingle: null }, capture);
    const out = await readProfile(client, 'u1');
    expect(capture.table).toBe('profiles');
    expect(out).toBeNull();
  });
});

// ── Therapist links via RPC (Q-4/Q-5) ─────────────────────────────────────────

describe('therapist links via RPC', () => {
  it('readTherapistLinks calls get_therapist_links (no client-side user filter)', async () => {
    const capture = emptyCapture();
    const links = [{ id: 't1', user_id: 'u1', display_name: 'Dr X' }];
    const client = makeClient({ rpc: links }, capture);
    const out = await readTherapistLinks(client);
    expect(capture.rpc).toBe('get_therapist_links');
    expect(capture.rpcArgs).toBeUndefined();
    expect(out).toBe(links);
  });

  it('writeTherapistLink calls upsert_therapist_link with stamped plaintext args', async () => {
    const capture = emptyCapture();
    const client = makeClient({ rpc: { id: 't1' } }, capture);
    const out = await writeTherapistLink(
      client,
      { user_id: 'u1', display_name: 'Dr X', role: 'therapist', treats_tags: ['anxiety'], email: 'x@y.com' },
      ctx,
    );
    expect(capture.rpc).toBe('upsert_therapist_link');
    expect(capture.rpcArgs).toMatchObject({
      display_name: 'Dr X',
      email: 'x@y.com',
      device_id: 'dev-1',
      schema_version: DATA_SCHEMA_VERSION,
    });
    expect(out).toEqual({ id: 't1' });
  });
});

// ── Migration runner (SR-13) ──────────────────────────────────────────────────

describe('migration runner', () => {
  it('ships at schema_version 1 with an empty registry', () => {
    expect(DATA_SCHEMA_VERSION).toBe(1);
    expect(migratorCount()).toBe(0);
  });

  it('is a passthrough for a row already at v1', () => {
    const row = { id: 'x', schema_version: 1 };
    expect(runForwardMigrations(row, 1)).toBe(row);
  });

  it('throws when no forward path exists (older version, empty registry)', () => {
    expect(() => runForwardMigrations({}, 0, 1)).toThrow(/No forward migration path/);
  });
});
