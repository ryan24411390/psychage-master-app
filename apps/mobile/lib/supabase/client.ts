// Supabase client — the mobile app's single @supabase/supabase-js instance.
//
// Slice 2 (platform JWT claim) introduces the FIRST real Supabase binding in the
// mobile app, scoped to AUTH only (sign-up / sign-in / sign-out / session) plus
// the record_auth_event RPC. No personal-data reads/writes go through here yet —
// those land with their own slices.
//
// SECURITY (Procedure-B checklist):
//   #1 TLS — the URL is HTTPS; supabase-js enforces TLS on every request.
//   #2 Secrets — only the PUBLISHABLE anon key + URL are read, from EXPO_PUBLIC_*
//      env (EAS env in production). The service-role key is NEVER in the app.
//   #4 Tokens — the session persists to expo-secure-store via secureStoreStorage
//      (OS keychain/keystore), never MMKV/AsyncStorage.

import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import { type SupabaseAuthStorage, secureStoreStorage } from './secure-store-storage';

/** Read at call time (not import time) so tests/tooling without env don't throw. */
function readEnv(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** True when the Supabase env is configured — gates use of the real auth service. */
export function isSupabaseConfigured(): boolean {
  return readEnv() !== null;
}

export function createSupabaseClient(
  url: string,
  anonKey: string,
  storage: SupabaseAuthStorage = secureStoreStorage,
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      // No URL-based session detection on native (no browser redirect surface).
      detectSessionInUrl: false,
    },
  });
}

let cached: SupabaseClient | null = null;

/** Lazy singleton. Throws only if called without configured env. */
export function getSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  const env = readEnv();
  if (!env) {
    throw new Error('Supabase env not configured (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY).');
  }
  cached = createSupabaseClient(env.url, env.anonKey);
  return cached;
}
