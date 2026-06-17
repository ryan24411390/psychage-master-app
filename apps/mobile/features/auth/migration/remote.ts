import { writeMoment } from '@psychage/shared/data';

import { type MomentSyncDeps, productionSyncDeps } from '@/lib/moment-store';
import { mapMomentToInput } from '@/lib/moment-sync-map';

import type { MigrationRemote } from './orchestrate';

// Anonymous → account MOMENTS migration REMOTE — the real, push-only backup of the
// merged local moments onto the freshly-created account (Flow 9 / SYS-S5). REUSES the
// moment sync seam wholesale — same mapper (mapMomentToInput), same gated writeMoment
// (upserts on the client-minted id), same DI seam (productionSyncDeps: auth client +
// user-id + §2 stamp + configured-guard). No parallel mapping or client wiring here.
//
// THE BOUNDARY vs the ambient per-append push (lib/moment-store.ts): the ambient push
// swallows failure (local is the truth). THIS push backs the user's explicit "bring my
// data" action, so a failure PROPAGATES — runMigration() maps the throw to an honest
// `offline` outcome the user can retry. Local data is never touched regardless.
//
// PUSH-ONLY (V1): fetchAccountEntries returns [] — fresh-account assumption, no pull
// lane. SR-4: only moments are written; no Navigator/symptom path exists here.

/** Thrown when the explicit migration push runs without an authenticated user. */
export class MigrationNotAuthenticatedError extends Error {
  constructor() {
    super('migration push requires an authenticated user');
    this.name = 'MigrationNotAuthenticatedError';
  }
}

/**
 * Build a real {@link MigrationRemote} from the moment sync seam. Pure factory — inject
 * a fake `deps` to unit-test the push without Supabase or the network.
 */
export function createMigrationRemote(deps: MomentSyncDeps = productionSyncDeps): MigrationRemote {
  return {
    // V1 fresh-account assumption (rules/auth.md §4: one-way, one-time, onto a brand-new
    // account). No pull lane in V1 — returning [] makes mergeMomentRecords([], local)
    // yield exactly the local set.
    async fetchAccountEntries() {
      return [];
    },

    // Best-effort backup of the merged set — but NOT swallowed (see header). Each moment
    // upserts on its client-minted id, so a partial failure + retry re-pushes the
    // already-landed rows harmlessly (they collide and UPDATE, not duplicate).
    async pushMergedEntries(moments) {
      if (!deps.enabled()) return;

      const userId = await deps.getUserId();
      if (!userId) {
        throw new MigrationNotAuthenticatedError();
      }

      const client = deps.getClient();
      const ctx = deps.writeContext();
      for (const m of moments) {
        await writeMoment(client, mapMomentToInput(m, userId), ctx);
      }
    },
  };
}

/** The production migration remote, wired to the live moment sync seam. */
export const productionMigrationRemote: MigrationRemote = createMigrationRemote();
