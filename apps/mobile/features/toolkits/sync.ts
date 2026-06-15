// Toolkit-progress sync — best-effort, push-only backup of one local record.
//
// Mirrors lib/check-in-store.ts pushCheckInEntry's contract EXACTLY: skips silently
// when the env is unconfigured, the user has NOT consented (default OFF), or the
// user is signed out; swallows any write/auth error. NEVER throws — the local save
// is the source of truth and must not be affected by the push.
//
// DEGRADES TO LOCAL-ONLY when the `user_toolkit_progress` table is absent: a 404 /
// PGRST205 comes back as a Supabase `error` (not a throw), which we ignore exactly
// like any other write failure. Nothing surfaces as broken.
//
// Gate ORDER matters: enabled → consent → user → write. Consent is checked before
// the auth session is ever read, so an un-consented backup never even touches the
// user id (privacy-safe default).

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAuthClient, isSupabaseConfigured } from '@/lib/supabase/client';

import type { PersistedItemProgress } from './progress-store';
import { getToolkitSyncConsent } from './sync-consent';

/** Capabilities the best-effort push needs; injectable so the swallow is testable. */
export interface ToolkitPushDeps {
  /** True only when the Supabase env is configured (else the push is a no-op). */
  enabled(): boolean;
  /** The user's explicit toolkit-progress backup CONSENT (default OFF). */
  getConsent(): boolean;
  /** The authenticated user's id, or null when signed out (push is then skipped). */
  getUserId(): Promise<string | null>;
  /** The session-bearing write client (the existing auth client). */
  getWriteClient(): SupabaseClient;
}

export const productionToolkitPushDeps: ToolkitPushDeps = {
  enabled: isSupabaseConfigured,
  getConsent: getToolkitSyncConsent,
  getUserId: async () => {
    const { data, error } = await getSupabaseAuthClient().auth.getUser();
    return error || !data.user ? null : data.user.id;
  },
  getWriteClient: () => getSupabaseAuthClient(),
};

/**
 * Push one item-progress record to `user_toolkit_progress` (upsert on the
 * (user_id, item_id) unique constraint). Best-effort: returns without throwing on
 * any gate miss or error.
 */
export async function pushToolkitProgress(
  record: PersistedItemProgress,
  deps: ToolkitPushDeps = productionToolkitPushDeps,
): Promise<void> {
  try {
    if (!deps.enabled()) return;
    // USER-CONSENT GATE: no push without the person's explicit opt-in. Checked
    // before getUserId() so an un-consented backup never reads the auth session.
    if (!deps.getConsent()) return;
    const userId = await deps.getUserId();
    if (!userId) return;

    await deps
      .getWriteClient()
      .from('user_toolkit_progress')
      .upsert(
        {
          user_id: userId,
          toolkit_id: record.toolkitId,
          item_id: record.itemId,
          opened_at: record.openedAt,
          completed_at: record.completedAt,
          self_rating: record.selfRating,
        },
        { onConflict: 'user_id,item_id' },
      );
    // We intentionally ignore the returned `{ error }` — a missing table (404 /
    // PGRST205) or an RLS rejection is a swallowed best-effort failure, not a crash.
  } catch {
    // Swallowed by design: best-effort push-only backup. No analytics, no PII
    // logged. The local record is unaffected.
  }
}
