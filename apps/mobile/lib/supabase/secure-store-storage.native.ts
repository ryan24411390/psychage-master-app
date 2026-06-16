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
// CHUNKING: expo-secure-store warns (and a future SDK will throw) when a single
// value exceeds 2048 bytes. OAuth sessions (Google/Apple, with provider tokens)
// routinely exceed that. So a large value is split across multiple keychain items
// (`<key>.0`, `<key>.1`, …) with a small manifest at the base key; everything still
// lives in secure storage (no AsyncStorage/MMKV — the rule holds). Plain (small)
// values are stored directly, and legacy single-value entries read back unchanged.

import * as SecureStore from 'expo-secure-store';

import type { SupabaseAuthStorage } from './secure-store-storage';

// Conservative char budget per item — well under the 2048-byte limit even if a few
// characters are multi-byte (session tokens are ASCII base64/JSON, so char ≈ byte).
const CHUNK_SIZE = 1800;
// Sentinel a real session value never starts with (sessions are JSON `{…}` / base64).
const MANIFEST = '__SB_CHUNKS__:';

function manifestCount(raw: string | null): number | null {
  if (raw === null || !raw.startsWith(MANIFEST)) return null;
  const n = Number.parseInt(raw.slice(MANIFEST.length), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function deleteChunks(key: string, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await SecureStore.deleteItemAsync(`${key}.${i}`);
  }
}

export const secureStoreStorage: SupabaseAuthStorage = {
  async getItem(key) {
    const raw = await SecureStore.getItemAsync(key);
    const count = manifestCount(raw);
    if (count === null) return raw; // plain value (or legacy single entry)
    let out = '';
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null; // a chunk is missing — treat as no session
      out += part;
    }
    return out;
  },

  async setItem(key, value) {
    // Clear any chunks from a previous larger write before re-writing.
    const prev = manifestCount(await SecureStore.getItemAsync(key));
    if (prev !== null) await deleteChunks(key, prev);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < chunks.length; i += 1) {
      await SecureStore.setItemAsync(`${key}.${i}`, chunks[i] as string);
    }
    // Write the manifest LAST so a partial write can't be read as a complete value.
    await SecureStore.setItemAsync(key, `${MANIFEST}${chunks.length}`);
  },

  async removeItem(key) {
    const count = manifestCount(await SecureStore.getItemAsync(key));
    if (count !== null) await deleteChunks(key, count);
    await SecureStore.deleteItemAsync(key);
  },
};

export type { SupabaseAuthStorage };
