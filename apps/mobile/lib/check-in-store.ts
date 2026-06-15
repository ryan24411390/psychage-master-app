import {
  type CheckInEntry,
  CheckInRecordStore,
  type CheckInState,
} from '@psychage/shared/check-in';
import { type SupabaseLike, type WriteContext, writeCheckIn } from '@psychage/shared/data';

import { config } from '@/lib/adapters/config';
import { storage } from '@/lib/adapters/storage';
import { mapEntryToCheckInInput } from '@/lib/check-in-sync-map';
import { getOrCreateDeviceId } from '@/lib/device-id';
import { generateId } from '@/lib/id';
import { getCheckInSyncConsent } from '@/lib/persistence/sync-consent';
import { getSupabaseAuthClient, isSupabaseConfigured } from '@/lib/supabase/client';

// The app's single CheckInRecordStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
//
// LOCAL IS THE SOURCE OF TRUTH. The MMKV-backed store is authoritative; on top of a
// successful local save the SyncingCheckInStore fires a BEST-EFFORT, PUSH-ONLY backup
// to Supabase (ADR-001 Accepted — SR-4 carve-out for consented mood self-tracking).
// There is no pull, no merge, no conflict resolution, and no Navigator/symptom path.
// A failed or unauthenticated push is swallowed and never blocks the local save.
//
// This module imports the shared package at RUNTIME, so it is loaded only on the
// device / in Vitest — never in a Jest-rendered path (HomeContainer takes the store
// as a prop so render tests inject an in-memory double instead).

/** Capabilities the best-effort push needs; injectable so the swallow is testable. */
export interface CheckInPushDeps {
  /** True only when the Supabase env is configured (else the push is a no-op). */
  enabled(): boolean;
  /**
   * The user's explicit check-in cloud-backup CONSENT (SR-4 / ADR-001). The push is
   * skipped when false — this is the privacy gate the carve-out's "consented self-
   * tracking" basis rests on. Read synchronously from the on-device consent store;
   * default OFF, so no entry leaves the device until the person opts in (S46).
   */
  getConsent(): boolean;
  /** The authenticated user's id, or null when signed out (push is then skipped). */
  getUserId(): Promise<string | null>;
  /** The session-bearing write client (the existing auth client, cast to the seam). */
  getWriteClient(): SupabaseLike;
  /** The §2 provenance stamp for the write. */
  writeContext(): WriteContext;
}

// Exported so the anon→account migration push (features/auth/migration/remote.ts)
// reuses the EXACT same seam — same auth client, user-id source, device/version
// stamp, and configured-guard — instead of re-wiring a parallel set (SR-4: one
// check-in write path, no duplicate plumbing).
export const productionPushDeps: CheckInPushDeps = {
  enabled: isSupabaseConfigured,
  getConsent: getCheckInSyncConsent,
  getUserId: async () => {
    // The auth client is the session-bearing instance; getUser reads the live session.
    const { data, error } = await getSupabaseAuthClient().auth.getUser();
    return error || !data.user ? null : data.user.id;
  },
  // supabase-js's client satisfies the `{ from, rpc }` seam structurally; cast at the
  // boundary (adapters.ts design note). We only ever import the EXISTING auth client.
  getWriteClient: () => getSupabaseAuthClient() as unknown as SupabaseLike,
  writeContext: () => ({
    device_id: getOrCreateDeviceId(),
    client_version: `mobile@${config.appVersion}`,
  }),
};

/**
 * Best-effort, push-only backup of one local entry. Skips silently when the env is
 * unconfigured, the user has NOT consented to cloud backup (SR-4 / ADR-001), or the
 * user is signed out; swallows any write/auth error. NEVER throws — the local save is
 * the source of truth and must not be affected by the push.
 */
export async function pushCheckInEntry(
  entry: CheckInEntry,
  deps: CheckInPushDeps = productionPushDeps,
): Promise<void> {
  try {
    if (!deps.enabled()) return;
    // USER-CONSENT GATE (SR-4 / ADR-001): no push without the person's explicit
    // opt-in. Checked before getUserId() so an un-consented backup never even
    // reads the auth session. Default OFF — silence here is the privacy-safe path.
    if (!deps.getConsent()) return;
    const userId = await deps.getUserId();
    if (!userId) return;
    await writeCheckIn(deps.getWriteClient(), mapEntryToCheckInInput(entry, userId), deps.writeContext());
  } catch {
    // Swallowed by design: best-effort push-only backup. No analytics (blocked scope,
    // PROJECT_CONTEXT §10) and no PII is logged. The local entry is unaffected.
  }
}

/**
 * CheckInRecordStore that mirrors each successful local write to the cloud as a
 * fire-and-forget backup. Reads and all other behavior are inherited unchanged.
 */
class SyncingCheckInStore extends CheckInRecordStore {
  saveToday(state: CheckInState, note?: string): CheckInEntry {
    const entry = super.saveToday(state, note);
    void pushCheckInEntry(entry);
    return entry;
  }

  editEntry(id: string, state: CheckInState, note?: string): CheckInEntry {
    const entry = super.editEntry(id, state, note);
    void pushCheckInEntry(entry);
    return entry;
  }
}

let store: CheckInRecordStore | null = null;

export function getCheckInStore(): CheckInRecordStore {
  if (!store) {
    store = new SyncingCheckInStore({
      storage,
      now: () => new Date(),
      generateId,
    });
  }
  return store;
}

// Wave B2 (S48): drop the cached singleton so the NEXT getCheckInStore()
// re-constructs and re-load()s from disk. The store caches entries in-memory at
// construction, so a "delete my record" that only clears the storage key would
// leave a stale live instance still answering getRecent() from its cached Map.
// The delete flow calls wipeLocalData(storage) (clears disk) THEN
// resetCheckInStore() so the next read reflects the now-empty disk. Additive —
// existing callers are unaffected.
export function resetCheckInStore(): void {
  store = null;
}
