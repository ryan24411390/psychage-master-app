import {
  type EngagementStore,
  type Moment,
  type MomentDraft,
  MomentStore,
} from '@psychage/shared/engagement';
import {
  type MomentRecord,
  type SupabaseLike,
  type WriteContext,
  readMoments,
  writeMoment,
} from '@psychage/shared/data';

import { config } from '@/lib/adapters/config';
import { storage } from '@/lib/adapters/storage';
import { getOrCreateDeviceId } from '@/lib/device-id';
import { generateId } from '@/lib/id';
import { mapMomentToInput, mapRecordToMoment } from '@/lib/moment-sync-map';
import { migrateMoodJournalIntoMoments } from '@/lib/moments-migration';
import { getMomentSyncConsent } from '@/lib/persistence/sync-consent';
import { getSupabaseAuthClient, isSupabaseConfigured } from '@/lib/supabase/client';

// The app's single Moments EngagementStore, constructed with the mobile DI seam
// (storage adapter + clock + id factory) per apps/mobile/CLAUDE.md convention #3.
//
// LOCAL-FIRST. The MMKV-backed MomentStore is authoritative. On top of it the
// SyncingMomentStore runs a BACKGROUND, CONSENT-GATED sync (ADR-001 / SR-4 — moments
// are the evolved check-in: user-owned self-tracking, NOT telemetry):
//   - PUSH: each successful local append fires a best-effort upsert (idempotent on
//     the client-minted id). A failed/unauthenticated/un-consented push is swallowed
//     and never blocks the local write.
//   - PULL: hydrateFromRemote() reads the user's moments and merges them into the
//     local cache (last-write-wins). This is what restores history after a reinstall.
//
// This module imports the shared package at RUNTIME, so it is loaded only on the
// device / in Vitest — never in a Jest-rendered path (containers take the store as a
// prop so render tests inject an in-memory double instead).

/** Capabilities the best-effort sync needs; injectable so the swallow is testable. */
export interface MomentSyncDeps {
  /** True only when the Supabase env is configured (else sync is a no-op). */
  enabled(): boolean;
  /**
   * The user's explicit Moments cloud-sync CONSENT (SR-4 / ADR-001). Sync is skipped
   * when false — the privacy gate the carve-out's "consented self-tracking" basis
   * rests on. Read synchronously from the on-device consent store; default OFF, so no
   * moment leaves the device until the person opts in.
   */
  getConsent(): boolean;
  /** The authenticated user's id, or null when signed out (sync is then skipped). */
  getUserId(): Promise<string | null>;
  /** The session-bearing client (the existing auth client, cast to the seam). */
  getClient(): SupabaseLike;
  /** The §2 provenance stamp for writes. */
  writeContext(): WriteContext;
}

// Exported so the anon→account migration reuses the EXACT same seam — same auth
// client, user-id source, device/version stamp, and configured-guard — instead of
// re-wiring a parallel set (SR-4: one moment write path, no duplicate plumbing).
export const productionSyncDeps: MomentSyncDeps = {
  enabled: isSupabaseConfigured,
  getConsent: getMomentSyncConsent,
  getUserId: async () => {
    const { data, error } = await getSupabaseAuthClient().auth.getUser();
    return error || !data.user ? null : data.user.id;
  },
  getClient: () => getSupabaseAuthClient() as unknown as SupabaseLike,
  writeContext: () => ({
    device_id: getOrCreateDeviceId(),
    client_version: `mobile@${config.appVersion}`,
  }),
};

/**
 * Best-effort, push-only backup of one local moment. Skips silently when the env is
 * unconfigured, the user has NOT consented (SR-4 / ADR-001), or the user is signed
 * out; swallows any write/auth error. NEVER throws — the local save is the source of
 * truth and must not be affected by the push.
 */
export async function pushMoment(
  moment: Moment,
  deps: MomentSyncDeps = productionSyncDeps,
): Promise<void> {
  try {
    if (!deps.enabled()) return;
    // USER-CONSENT GATE (SR-4 / ADR-001): checked before getUserId() so an
    // un-consented sync never even reads the auth session. Default OFF.
    if (!deps.getConsent()) return;
    const userId = await deps.getUserId();
    if (!userId) return;
    await writeMoment(deps.getClient(), mapMomentToInput(moment, userId), deps.writeContext());
  } catch {
    // Swallowed by design: best-effort. No analytics (blocked scope), no PII logged.
  }
}

/**
 * Best-effort PULL/restore: read the user's moments and merge them into `store`. Same
 * consent + auth gate as the push — nothing is fetched until the person opts in and
 * is signed in. Swallows errors. Returns true when a merge ran (for an optional UI
 * refresh signal), false when it was skipped/failed.
 */
export async function hydrateMomentsFromRemote(
  store: EngagementStore,
  deps: MomentSyncDeps = productionSyncDeps,
): Promise<boolean> {
  try {
    if (!deps.enabled()) return false;
    if (!deps.getConsent()) return false;
    const userId = await deps.getUserId();
    if (!userId) return false;
    const records: readonly MomentRecord[] = await readMoments(deps.getClient(), userId);
    store.ingestRemote(records.map(mapRecordToMoment));
    return true;
  } catch {
    return false;
  }
}

/**
 * MomentStore that mirrors each successful local append to the cloud as a
 * fire-and-forget backup. Reads and all other behavior are inherited unchanged.
 */
class SyncingMomentStore extends MomentStore {
  append(draft: MomentDraft): Moment {
    const moment = super.append(draft);
    void pushMoment(moment);
    return moment;
  }
}

let store: MomentStore | null = null;

export function getMomentStore(): MomentStore {
  if (!store) {
    store = new SyncingMomentStore({
      storage,
      now: () => new Date(),
      generateId,
    });
    // One-time, idempotent, local-only fold of the retired Mood Journal into Moments
    // (P42–P44). Runs on first construction; the done-flag short-circuits later launches.
    // Best-effort: a failed fold must never block the local store.
    try {
      migrateMoodJournalIntoMoments(storage, store);
    } catch {
      // Swallowed by design — the store is the source of truth and must still return.
    }
  }
  return store;
}

/**
 * Drop the cached singleton so the NEXT getMomentStore() re-constructs and re-load()s
 * from disk. The store caches moments in-memory at construction, so a "delete my
 * record" that only clears the storage key would leave a stale live instance still
 * answering reads. The delete flow clears disk THEN calls this so the next read
 * reflects the now-empty disk.
 */
export function resetMomentStore(): void {
  store = null;
}
