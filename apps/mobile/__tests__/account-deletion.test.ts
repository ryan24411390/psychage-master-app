import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { clearAuthSessionLocal, requestRemoteAccountDeletion } from '@/lib/persistence/account-deletion';

// A minimal fake of the session-bearing auth client. Passing deps.client bypasses
// the isSupabaseConfigured() env gate, so these tests need no Supabase env.
function makeClient(
  opts: {
    user?: { id: string } | null;
    getUserError?: unknown;
    getUserThrows?: unknown;
    rpcError?: unknown;
    signOutThrows?: unknown;
  } = {},
) {
  const rpc = vi.fn(async () => ({ data: null, error: opts.rpcError ?? null }));
  const signOut = vi.fn(async () => {
    if (opts.signOutThrows) throw opts.signOutThrows;
    return { error: null };
  });
  const getUser = vi.fn(async () => {
    if (opts.getUserThrows) throw opts.getUserThrows;
    const user = opts.user === undefined ? { id: 'user-1' } : opts.user;
    return { data: { user }, error: opts.getUserError ?? null };
  });
  const client = { auth: { getUser, signOut }, rpc } as unknown as SupabaseClient;
  return { client, rpc, signOut, getUser };
}

describe('requestRemoteAccountDeletion', () => {
  it('no session -> ok with deleted:false, never calls the RPC', async () => {
    const { client, rpc } = makeClient({ user: null });
    const result = await requestRemoteAccountDeletion({ client });
    expect(result).toEqual({ ok: true, deleted: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('a getUser error is treated as no session (deleted:false), no RPC', async () => {
    const { client, rpc } = makeClient({ user: null, getUserError: { message: 'bad' } });
    const result = await requestRemoteAccountDeletion({ client });
    expect(result).toEqual({ ok: true, deleted: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('signed in -> calls delete_account RPC and reports deleted:true', async () => {
    const { client, rpc } = makeClient({ user: { id: 'user-1' } });
    const result = await requestRemoteAccountDeletion({ client });
    expect(rpc).toHaveBeenCalledWith('delete_account');
    expect(result).toEqual({ ok: true, deleted: true });
  });

  it('RPC network failure -> ok:false reason:offline (retryable)', async () => {
    const { client } = makeClient({ user: { id: 'user-1' }, rpcError: { name: 'AuthRetryableFetchError' } });
    const result = await requestRemoteAccountDeletion({ client });
    expect(result).toEqual({ ok: false, reason: 'offline' });
  });

  it('RPC server-side rejection -> ok:false reason:unknown', async () => {
    const { client } = makeClient({ user: { id: 'user-1' }, rpcError: { message: 'permission denied' } });
    const result = await requestRemoteAccountDeletion({ client });
    expect(result).toEqual({ ok: false, reason: 'unknown' });
  });

  it('getUser throws a network error -> ok:false reason:offline', async () => {
    const { client, rpc } = makeClient({ getUserThrows: { message: 'network request failed' } });
    const result = await requestRemoteAccountDeletion({ client });
    expect(result).toEqual({ ok: false, reason: 'offline' });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('clearAuthSessionLocal', () => {
  it('signs out with local scope (drops the dead session, no server round-trip)', async () => {
    const { client, signOut } = makeClient();
    await clearAuthSessionLocal({ client });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('swallows a signOut failure (never blocks a completed deletion)', async () => {
    const { client } = makeClient({ signOutThrows: new Error('boom') });
    await expect(clearAuthSessionLocal({ client })).resolves.toBeUndefined();
  });
});
