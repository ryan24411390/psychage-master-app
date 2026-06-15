import { writeCheckIn } from '@psychage/shared/data';

import { type CheckInPushDeps, productionPushDeps } from '@/lib/check-in-store';
import { mapEntryToCheckInInput } from '@/lib/check-in-sync-map';

import type { MigrationRemote } from './orchestrate';

// Anonymous → account migration REMOTE — the real, push-only backup of the merged
// local check-in record onto the freshly-created account (Flow 9 / SYS-S5).
//
// ADR-001 is Accepted (2026-06-14) and #72 flipped the check-in write gate ON, so
// the remote that orchestrate.ts stubbed now exists. It REUSES #72's write path
// wholesale — same mapper (mapEntryToCheckInInput), same gated writeCheckIn (upserts
// on the `(user_id, experienced_at)` unique index), same DI seam (productionPushDeps:
// auth client + user-id + §2 device/version stamp + configured-guard). No parallel
// mapping or client wiring lives here.
//
// THE BOUNDARY vs the ambient per-save push (lib/check-in-store.ts):
//   - Ambient push is fire-and-forget and SWALLOWS failure (the local save is the
//     truth; a backup glitch must never disturb it).
//   - THIS push backs the user's explicit "bring my data to my account" action, so a
//     failure PROPAGATES — runMigration() maps the throw to an honest `offline`
//     outcome the user can retry, rather than a false `done`. Local data is never
//     touched by the migration flow regardless, so a failed push loses nothing.
//
// PUSH-ONLY (V1): fetchAccountEntries returns [] — fresh-account assumption, no pull
// lane. SR-4: only check_ins is written; no Navigator/symptom path exists here.

/** Thrown when the explicit migration push runs without an authenticated user. */
export class MigrationNotAuthenticatedError extends Error {
  constructor() {
    super('migration push requires an authenticated user');
    this.name = 'MigrationNotAuthenticatedError';
  }
}

/**
 * Build a real {@link MigrationRemote} from the check-in push seam. Pure factory —
 * inject a fake `deps` to unit-test the push without Supabase or the network.
 */
export function createMigrationRemote(deps: CheckInPushDeps = productionPushDeps): MigrationRemote {
  return {
    // V1 fresh-account assumption (rules/auth.md §4: migration is one-way, one-time,
    // onto a brand-new account — no account-merge). No pull lane in V1, so there is
    // nothing to fetch; cloud→local reverse-map is deferred to bidirectional V2.
    // Returning [] makes mergeCheckInRecords([], local) yield exactly the local set.
    async fetchAccountEntries() {
      return [];
    },

    // Best-effort backup of the merged set — but NOT swallowed (see header). Each
    // entry upserts on the per-day key, so a partial failure + retry re-pushes the
    // already-landed rows harmlessly (they collide and UPDATE, not duplicate).
    async pushMergedEntries(entries) {
      // Env unconfigured ⇒ no cloud target. Unreachable in a real migration (account
      // creation needs Supabase too); skip quietly for parity with the ambient push.
      if (!deps.enabled()) return;

      const userId = await deps.getUserId();
      if (!userId) {
        // Post-account-creation flow expects a session. Surface as retryable.
        throw new MigrationNotAuthenticatedError();
      }

      const client = deps.getWriteClient();
      const ctx = deps.writeContext();
      for (const entry of entries) {
        await writeCheckIn(client, mapEntryToCheckInInput(entry, userId), ctx);
      }
    },
  };
}

/** The production migration remote, wired to the live check-in push seam. */
export const productionMigrationRemote: MigrationRemote = createMigrationRemote();
