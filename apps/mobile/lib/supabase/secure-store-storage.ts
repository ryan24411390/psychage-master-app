// Supabase auth session storage — node / vitest / Metro-web fallback (in-memory).
//
// The expo-secure-store binding lives in `secure-store-storage.native.ts`. Metro
// resolves `./secure-store-storage` to the `.native.ts` file on iOS / Android;
// node + vitest + Metro web resolve here. Same `SupabaseAuthStorage` interface,
// same `secureStoreStorage` export name — the Supabase client never knows which
// platform it's on.
//
// SECURITY (rules/auth.md §6 / Procedure-B checklist #4): on native, the session
// (access + refresh token) is persisted ONLY to the OS keychain/keystore via
// expo-secure-store — NEVER MMKV or AsyncStorage. This in-memory map is the
// non-native fallback and persists nothing across processes.

/** The async subset of supabase-js `SupportedStorage` we implement. */
export interface SupabaseAuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const memory = new Map<string, string>();

export const secureStoreStorage: SupabaseAuthStorage = {
  async getItem(key) {
    return memory.get(key) ?? null;
  },
  async setItem(key, value) {
    memory.set(key, value);
  },
  async removeItem(key) {
    memory.delete(key);
  },
};
