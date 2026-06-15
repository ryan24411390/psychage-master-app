// Remote account deletion — the SYNC-layer cascade. The explicit local/remote
// boundary seam for S48: delete-confirm.tsx attempts THIS first (it needs the live
// secure-store session), then runs the local wipe, then surfaces any remote
// failure so deletion never silently half-completes.
//
// Calls the delete_account() SECURITY DEFINER RPC (supabase/migrations/
// 20260615000001), which for the authenticated user erases every user-scoped row
// (check_ins + the personal-data tables + audit_events) and the auth.users row
// itself — hard-immediate, no recovery window (rules/auth.md §7).

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAuthClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { isNetworkError } from '@/lib/supabase/is-network-error';

/**
 * Result of the remote cascade.
 *   - { ok: true, deleted: true }   the server cascade ran for the signed-in user.
 *   - { ok: true, deleted: false }  no server data to delete (not signed in / no
 *                                   Supabase env) — local-only delete still proceeds.
 *   - { ok: false, reason }         the cascade was attempted and FAILED; the caller
 *                                   MUST surface this (server data may still exist).
 */
export type RemoteDeletionResult =
  | { ok: true; deleted: boolean }
  | { ok: false; reason: 'offline' | 'unknown' };

export interface RemoteDeletionDeps {
  /** Defaults to the lazy app singleton; injected in tests. */
  readonly client?: SupabaseClient;
}

/**
 * Request the authenticated account + personal-data cascade. Awaited by the delete
 * flow (NOT fire-and-forget): the caller branches on the result to surface failure.
 */
export async function requestRemoteAccountDeletion(
  deps: RemoteDeletionDeps = {},
): Promise<RemoteDeletionResult> {
  // No configured backend and no injected client -> nothing exists server-side.
  if (!deps.client && !isSupabaseConfigured()) return { ok: true, deleted: false };
  const client = deps.client ?? getSupabaseAuthClient();
  try {
    const { data, error: userError } = await client.auth.getUser();
    // No session -> the user never synced anything; treat as a clean no-op.
    if (userError || !data.user) return { ok: true, deleted: false };

    const { error } = await client.rpc('delete_account');
    if (error) return { ok: false, reason: isNetworkError(error) ? 'offline' : 'unknown' };
    return { ok: true, deleted: true };
  } catch (error) {
    return { ok: false, reason: isNetworkError(error) ? 'offline' : 'unknown' };
  }
}

/**
 * Clear the local session after a successful remote delete. The account is gone
 * server-side so the token is dead — local scope avoids a doomed server round-trip
 * while still clearing the secure-store session (rules/auth.md §7: clear tokens).
 * Best-effort: a failure here must not block the completed deletion.
 */
export async function clearAuthSessionLocal(deps: RemoteDeletionDeps = {}): Promise<void> {
  if (!deps.client && !isSupabaseConfigured()) return;
  try {
    await (deps.client ?? getSupabaseAuthClient()).auth.signOut({ scope: 'local' });
  } catch {
    // supabase-js clears the local session even on a network failure.
  }
}
