// Storage adapter — MMKV-backed production binding (iOS / Android).
//
// Metro resolves `./storage` to this file on native platforms; node + vitest
// + Metro web fall back to `./storage.ts`'s in-memory impl. The two files
// expose an identical `Storage` interface + `storage` export name so the
// rest of the app (and the lib/persistence/tier-flags migrator) is unaware
// of the platform split.
//
// Sacred Rule #4: symptom payloads must never be persisted through this
// surface. Keys are caller-controlled but consumers namespace them
// (`mobile:tier-flags`, `mobile:haptics-enabled`, …) — never store a raw
// symptom_id, symptom text, severity, duration, frequency, or mood
// selection via this interface.
//
// Instance: `psychage-anonymous` per rules/auth.md §"MMKV instance
// separation" (Tier 1 local data, no account, no sync). `psychage-account`
// is a separate instance reserved for account-tier mirror data — wired in a
// later auth slice.
//
// Encryption: not configured here. rules/auth.md §146 calls for OS-keystore
// at-rest encryption; that requires an encryption key bootstrapped from
// expo-secure-store, which lands with the auth slice. Tier flags are
// non-PII (SR #11 N/A), so plain-on-disk is acceptable for the V1 surface
// behind this adapter. Adding `encryptionKey` later does NOT migrate
// existing plaintext data — the auth slice will need to handle re-encryption
// of any pre-existing `psychage-anonymous` data on first run.

import { createMMKV } from 'react-native-mmkv';

import type { Storage } from './storage';

const mmkv = createMMKV({ id: 'psychage-anonymous' });

export const storage: Storage = {
  get(key) {
    return mmkv.getString(key) ?? null;
  },
  set(key, value) {
    mmkv.set(key, value);
  },
  remove(key) {
    mmkv.remove(key);
  },
  getAllKeys() {
    return mmkv.getAllKeys();
  },
};

export type { Storage };
