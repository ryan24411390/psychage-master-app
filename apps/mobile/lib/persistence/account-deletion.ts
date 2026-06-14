// Remote account deletion — the SYNC-layer cascade. GATED behind the SR-4 ADR
// (no Supabase / network in Wave B2). This is the explicit local/remote boundary
// seam: S48 runs the LOCAL wipe unconditionally, then calls this so the boundary
// is a visible function, not a buried branch.
//
// When the sync layer lands (B1 + SR-4 lift), this issues the authenticated
// account + remote-record cascade. Until then it is a deliberate no-op stub.

export class RemoteDeletionNotAvailableError extends Error {
  constructor() {
    super('Remote account deletion is gated behind the SR-4 sync ADR.');
    this.name = 'RemoteDeletionNotAvailableError';
  }
}

/**
 * STUB(SR-4): request the remote account + record cascade. No network call in B2.
 * Returns a settled result so S48's local-first flow never blocks on it; the
 * `requested:false` signal lets a future caller distinguish "not wired yet" from
 * a real success.
 */
export async function requestRemoteAccountDeletion(): Promise<{ requested: boolean }> {
  // TODO(SR-4 / B1): POST the authenticated account-deletion cascade. Reads the
  // session token from expo-secure-store; emits the audit_events row. Gated.
  return { requested: false };
}
