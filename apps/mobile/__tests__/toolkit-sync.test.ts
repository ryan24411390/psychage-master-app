import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { PersistedItemProgress } from '@/features/toolkits/progress-store';
import { type ToolkitPushDeps, pushToolkitProgress } from '@/features/toolkits/sync';

const RECORD: PersistedItemProgress = {
  toolkitId: 'tk1',
  itemId: 'i1',
  openedAt: '2026-06-15T10:00:00.000Z',
  completedAt: null,
  selfRating: 'a_little',
  updatedAt: '2026-06-15T10:00:00.000Z',
};

function makeClient() {
  const upsert = vi.fn(async () => ({ error: null }));
  const from = vi.fn(() => ({ upsert }));
  const client = { from } as unknown as SupabaseClient;
  return { client, from, upsert };
}

function makeDeps(over: Partial<ToolkitPushDeps>, client: SupabaseClient): ToolkitPushDeps {
  return {
    enabled: () => true,
    getConsent: () => true,
    getUserId: async () => 'user-1',
    getWriteClient: () => client,
    ...over,
  };
}

describe('pushToolkitProgress', () => {
  it('skips when the env is unconfigured', async () => {
    const { client, from } = makeClient();
    await pushToolkitProgress(RECORD, makeDeps({ enabled: () => false }, client));
    expect(from).not.toHaveBeenCalled();
  });

  it('skips when consent is OFF (gate before any session read)', async () => {
    const { client, from } = makeClient();
    const getUserId = vi.fn(async () => 'user-1');
    await pushToolkitProgress(RECORD, makeDeps({ getConsent: () => false, getUserId }, client));
    expect(getUserId).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('skips when signed out', async () => {
    const { client, from } = makeClient();
    await pushToolkitProgress(RECORD, makeDeps({ getUserId: async () => null }, client));
    expect(from).not.toHaveBeenCalled();
  });

  it('upserts the row scoped to the user when all gates pass', async () => {
    const { client, from, upsert } = makeClient();
    await pushToolkitProgress(RECORD, makeDeps({}, client));
    expect(from).toHaveBeenCalledWith('user_toolkit_progress');
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        toolkit_id: 'tk1',
        item_id: 'i1',
        opened_at: '2026-06-15T10:00:00.000Z',
        completed_at: null,
        self_rating: 'a_little',
      },
      { onConflict: 'user_id,item_id' },
    );
  });

  it('never throws when the write errors (table absent / RLS) — local-only degrade', async () => {
    const upsert = vi.fn(async () => ({ error: { code: 'PGRST205', message: 'no table' } }));
    const client = { from: () => ({ upsert }) } as unknown as SupabaseClient;
    await expect(pushToolkitProgress(RECORD, makeDeps({}, client))).resolves.toBeUndefined();
  });

  it('never throws when the client itself throws', async () => {
    const client = {
      from: () => {
        throw new Error('boom');
      },
    } as unknown as SupabaseClient;
    await expect(pushToolkitProgress(RECORD, makeDeps({}, client))).resolves.toBeUndefined();
  });
});
