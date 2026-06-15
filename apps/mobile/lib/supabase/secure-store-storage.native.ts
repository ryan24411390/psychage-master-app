// Supabase auth session storage — expo-secure-store binding (iOS / Android).
//
// Metro resolves `./secure-store-storage` to this file on native; node + vitest
// + Metro web fall back to `./secure-store-storage.ts`'s in-memory impl. Both
// expose the identical `SupabaseAuthStorage` interface + `secureStoreStorage`
// export name.
//
// SECURITY (rules/auth.md §6 / Procedure-B checklist #4): the Supabase session
// (access + refresh token) lives ONLY here — the OS keychain (iOS) / keystore
// (Android) via expo-secure-store. NEVER MMKV, NEVER AsyncStorage.
//
// NOTE (follow-up, not this slice): expo-secure-store warns when a single value
// exceeds 2048 bytes on Android. A Supabase session can exceed that; if it does,
// production needs key-chunking. Tracked for the B1 hardening pass — out of scope
// for the identity-substrate slice.

import * as SecureStore from 'expo-secure-store';

import type { SupabaseAuthStorage } from './secure-store-storage';

export const secureStoreStorage: SupabaseAuthStorage = {
  async getItem(key) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(key);
  },
};

export type { SupabaseAuthStorage };
