import type { Storage } from '@/lib/adapters/storage';

import { KNOWN_LOCAL_KEYS } from './known-keys';

// S48 local delete — HARD-IMMEDIATE, no recovery window. Removes every known
// namespaced key through the storage seam. Pure + synchronous + Vitest-testable.
//
// THE LOCAL/REMOTE BOUNDARY (explicit):
//   - LOCAL (this function) is real and complete for all named keys. The caller
//     (delete-confirm.tsx) then calls resetCheckInStore() so the live store
//     instance reflects the now-empty disk.
//   - REMOTE/account cascade is the SYNC layer, gated behind the SR-4 ADR — see
//     lib/persistence/account-deletion.ts (a not-implemented stub, no network).
//   - The dynamic `…:quarantine:*` residue is the one local gap — see known-keys.ts.
export function wipeLocalData(storage: Storage): void {
  for (const key of KNOWN_LOCAL_KEYS) {
    storage.remove(key);
  }
}
