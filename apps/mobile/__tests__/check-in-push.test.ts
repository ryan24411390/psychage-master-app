// Unit tests for the best-effort, push-only check-in backup. Exercises the swallow
// guarantee (a failed/absent-auth push never throws) and the mapped payload via an
// injected fake client + deps — no real Supabase, no network.

import { describe, expect, it, vi } from 'vitest';

import type { CheckInEntry } from '@psychage/shared/check-in';
import type { SupabaseLike, WriteContext } from '@psychage/shared/data';

import { type CheckInPushDeps, pushCheckInEntry } from '@/lib/check-in-store';

const ENTRY: CheckInEntry = {
  id: 'cie_1',
  date: '2026-06-15' as CheckInEntry['date'],
  state: 3,
  note: 'rough day',
};

const CTX: WriteContext = { device_id: 'dev-1', client_version: 'mobile@1.0.0' };

interface Capture {
  table?: string;
  upsert?: Record<string, unknown>;
  upsertOptions?: { onConflict?: string };
}

/** Fake SupabaseLike that records the upsert call; `throwOnUpsert` simulates failure. */
function makeClient(capture: Capture, throwOnUpsert = false): SupabaseLike {
  const builder: Record<string, unknown> = {};
  Object.assign(builder, {
    upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => {
      if (throwOnUpsert) throw new Error('network down');
      capture.upsert = values;
      capture.upsertOptions = options;
      return builder;
    },
    select: () => builder,
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

function deps(over: Partial<CheckInPushDeps>, capture: Capture, throwOnUpsert = false): CheckInPushDeps {
  return {
    enabled: () => true,
    getConsent: () => true,
    getUserId: async () => 'user-1',
    getWriteClient: () => makeClient(capture, throwOnUpsert),
    writeContext: () => CTX,
    ...over,
  };
}

describe('pushCheckInEntry — best-effort backup', () => {
  it('upserts the mapped payload on the per-day conflict key', async () => {
    const capture: Capture = {};
    await pushCheckInEntry(ENTRY, deps({}, capture));

    expect(capture.table).toBe('check_ins');
    expect(capture.upsert).toMatchObject({
      user_id: 'user-1',
      mood_score: 7,
      experienced_at: '2026-06-15T00:00:00.000Z',
      prompt_response: 'rough day',
      context: {},
      // §2 provenance stamp
      device_id: 'dev-1',
      client_version: 'mobile@1.0.0',
    });
    expect(capture.upsertOptions).toEqual({ onConflict: 'user_id,experienced_at' });
  });

  it('swallows a write failure — never throws (local save is source of truth)', async () => {
    const capture: Capture = {};
    await expect(pushCheckInEntry(ENTRY, deps({}, capture, true))).resolves.toBeUndefined();
  });

  it('skips the write when the user is signed out', async () => {
    const capture: Capture = {};
    const getWriteClient = vi.fn(() => makeClient(capture));
    await pushCheckInEntry(ENTRY, deps({ getUserId: async () => null, getWriteClient }, capture));

    expect(getWriteClient).not.toHaveBeenCalled();
    expect(capture.upsert).toBeUndefined();
  });

  it('skips the write when Supabase is not configured', async () => {
    const capture: Capture = {};
    const getUserId = vi.fn(async () => 'user-1');
    await pushCheckInEntry(ENTRY, deps({ enabled: () => false, getUserId }, capture));

    expect(getUserId).not.toHaveBeenCalled();
    expect(capture.upsert).toBeUndefined();
  });

  it('skips the write when the user has NOT consented (SR-4 / ADR-001 gate)', async () => {
    const capture: Capture = {};
    const getUserId = vi.fn(async () => 'user-1');
    // Consent OFF: the push must be skipped even though Supabase is configured and a
    // user is signed in. The gate is checked before getUserId, so auth is never read.
    await pushCheckInEntry(ENTRY, deps({ getConsent: () => false, getUserId }, capture));

    expect(getUserId).not.toHaveBeenCalled();
    expect(capture.upsert).toBeUndefined();
  });

  it('writes when consent is ON and the user is signed in', async () => {
    const capture: Capture = {};
    await pushCheckInEntry(ENTRY, deps({ getConsent: () => true }, capture));

    expect(capture.table).toBe('check_ins');
    expect(capture.upsert).toMatchObject({ user_id: 'user-1', mood_score: 7 });
  });

  it('omits prompt_response when the entry has no note', async () => {
    const capture: Capture = {};
    const noNote: CheckInEntry = { id: 'cie_2', date: '2026-06-15' as CheckInEntry['date'], state: 0 };
    await pushCheckInEntry(noNote, deps({}, capture));

    expect(capture.upsert).not.toHaveProperty('prompt_response');
    expect(capture.upsert).toMatchObject({ mood_score: 1 });
  });
});
