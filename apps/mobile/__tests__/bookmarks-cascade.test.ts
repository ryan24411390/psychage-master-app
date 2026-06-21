import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEY as BOOKMARKS_KEY } from '@/features/bookmarks/store';
import { requestRemoteAccountDeletion } from '@/lib/persistence/account-deletion';
import { KNOWN_LOCAL_KEYS } from '@/lib/persistence/known-keys';
import { wipeLocalData } from '@/lib/persistence/wipe-local-data';

/**
 * US-7 / AC-7.1 / AC-7.2 — account deletion clears bookmarks.
 *
 * Bookmarks are now LOCAL-FIRST (P13): they live on the device (no Supabase
 * `bookmarks` rows), so the old DB FK CASCADE no longer applies. "Delete my
 * record" (S48 `wipeLocalData`) erases them because the key is registered in
 * KNOWN_LOCAL_KEYS; the remote account-deletion RPC still tears down the account.
 */
describe('bookmarks deletion (US-7, local-first)', () => {
  it('AC-7.1: the bookmarks key is registered for local wipe (S48)', () => {
    expect(KNOWN_LOCAL_KEYS).toContain(BOOKMARKS_KEY);
  });

  it('AC-7.1: wipeLocalData removes the bookmarks blob', () => {
    const map = new Map<string, string>([[BOOKMARKS_KEY, JSON.stringify({ version: 1, items: [] })]]);
    wipeLocalData({
      get: (k) => map.get(k) ?? null,
      set: (k, v) => void map.set(k, v),
      remove: (k) => void map.delete(k),
      getAllKeys: () => Array.from(map.keys()),
    });
    expect(map.has(BOOKMARKS_KEY)).toBe(false);
  });

  it('AC-7.2: the account-deletion path still fires delete_account() (account teardown)', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const getUser = vi.fn(async () => ({ data: { user: { id: 'u-1' } }, error: null }));
    const client = { auth: { getUser }, rpc } as unknown as SupabaseClient;

    const result = await requestRemoteAccountDeletion({ client });

    expect(result).toEqual({ ok: true, deleted: true });
    expect(rpc).toHaveBeenCalledWith('delete_account');
  });
});
