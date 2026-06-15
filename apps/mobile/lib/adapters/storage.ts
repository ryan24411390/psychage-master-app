// Storage adapter — in-memory fallback (node, vitest, Metro web).
//
// The MMKV-backed native binding lives in `storage.native.ts`. Metro resolves
// `./storage` to the `.native.ts` file on iOS / Android automatically; node
// and Metro web resolve here. Same `Storage` interface, same `storage`
// export name — consumers and lib/persistence/tier-flags don't know which
// platform they're on.
//
// On native this Map-backed impl is unreachable. In tests the in-memory
// store resets per process; the persistence test (tier-flags-persistence)
// constructs its own local Storage rather than depending on this singleton.
//
// Sacred Rule #4: symptom payloads must never be persisted from this
// surface. Keys are caller-controlled but consumers namespace them
// (`mobile:tier-flags`, `mobile:haptics-enabled`, …) — never store a raw
// symptom_id, symptom text, severity, duration, frequency, or mood
// selection via this interface.

export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /**
   * Enumerate every key. Needed to reach dynamically-suffixed keys (e.g. the
   * check-in store's `…:quarantine:<iso>-<uuid>` residue) that have no entry in
   * the static KNOWN_LOCAL_KEYS registry — wipeLocalData uses it to fully erase
   * on "delete my record". Optional so lightweight in-memory test doubles need
   * not implement it; BOTH production adapters (this one + the MMKV native one) do.
   */
  getAllKeys?(): string[];
}

const memory = new Map<string, string>();

export const storage: Storage = {
  get(key) {
    return memory.get(key) ?? null;
  },
  set(key, value) {
    memory.set(key, value);
  },
  remove(key) {
    memory.delete(key);
  },
  getAllKeys() {
    return Array.from(memory.keys());
  },
};
