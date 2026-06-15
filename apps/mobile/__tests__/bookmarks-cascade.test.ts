import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as bookmarkService from '@/features/bookmarks/service';
import { requestRemoteAccountDeletion } from '@/lib/persistence/account-deletion';

/**
 * US-7 / AC-7.1 / AC-7.2 — account deletion clears bookmarks.
 *
 * The shared `public.bookmarks` table has `user_id UUID FK auth.users ON DELETE
 * CASCADE` (web migration; brief open-Q#2 resolved). So bookmark rows are erased
 * by the DB when the account-deletion path removes the auth.users row — NO mobile
 * cleanup code. AC-7.2 ("integration test against the account-deletion path") is
 * covered here at the achievable unit level; the live row-gone assertion belongs
 * to a DB harness (cf. scripts/verify-checkin-rls.ts), tracked as a follow-up.
 */
describe('bookmarks account-deletion cascade (US-7)', () => {
  it('AC-7.1: removal relies on FK CASCADE — the service exposes no client-side bulk delete', () => {
    const svc = bookmarkService as Record<string, unknown>;
    expect(svc.deleteAllForUser).toBeUndefined();
    expect(svc.clearBookmarks).toBeUndefined();
  });

  it('AC-7.2: the account-deletion path fires delete_account() — the RPC that cascades bookmarks', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const getUser = vi.fn(async () => ({ data: { user: { id: 'u-1' } }, error: null }));
    const client = { auth: { getUser }, rpc } as unknown as SupabaseClient;

    const result = await requestRemoteAccountDeletion({ client });

    expect(result).toEqual({ ok: true, deleted: true });
    expect(rpc).toHaveBeenCalledWith('delete_account');
  });
});
