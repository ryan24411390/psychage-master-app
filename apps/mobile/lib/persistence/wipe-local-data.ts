import type { Storage } from '@/lib/adapters/storage';

import { KNOWN_LOCAL_KEYS } from './known-keys';

// S48 local delete — HARD-IMMEDIATE, no recovery window. Erases every key the app
// owns through the storage seam. Pure + synchronous + Vitest-testable.
//
// THE LOCAL/REMOTE BOUNDARY (explicit):
//   - LOCAL (this function) is real and complete: the static KNOWN_LOCAL_KEYS plus
//     the dynamic `…:quarantine:*` residue (reached via getAllKeys enumeration).
//     The caller (delete-confirm.tsx) then calls resetCheckInStore() so the live
//     store instance reflects the now-empty disk.
//   - REMOTE/account cascade is the SYNC layer — see
//     lib/persistence/account-deletion.ts (delete_account() RPC).
export function wipeLocalData(storage: Storage): void {
  for (const key of KNOWN_LOCAL_KEYS) {
    storage.remove(key);
  }
  // Reach the dynamically-suffixed `…:quarantine:<iso>-<uuid>` residue — keys with
  // no static KNOWN_LOCAL_KEYS entry (see known-keys.ts QUARANTINE_KEY_PREFIX). The
  // `:quarantine:` segment is the store-agnostic marker, so this also covers any
  // future store's quarantine keys. Both production adapters expose getAllKeys; a
  // double without it simply skips the sweep.
  for (const key of storage.getAllKeys?.() ?? []) {
    if (key.includes(':quarantine:')) {
      storage.remove(key);
    }
  }
}
