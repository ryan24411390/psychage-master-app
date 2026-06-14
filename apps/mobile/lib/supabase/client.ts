// Supabase AUTH client — the session-bearing @supabase/supabase-js instance.
//
// Slice 2 (platform JWT claim). Scoped to AUTH only: sign-up / sign-in /
// sign-out / session + the record_auth_event RPC. No personal-data reads/writes.
//
// RELATIONSHIP TO `@/lib/supabase` (lib/supabase.ts): that module is the
// READ-ONLY ANON client for public reference data (crisis, articles) —
// persistSession:false, returns null when unconfigured. THIS module is the
// session-bearing AUTH client — persistSession:true + expo-secure-store. They
// are deliberately separate instances with different contracts; a distinct
// `storageKey` keeps their session storage from colliding. Consolidating both
// into `packages/api` is the planned follow-up (see lib/supabase.ts's own note)
// — out of scope for the identity-substrate slice.
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

export function createSupabaseAuthClient(
  url: string,
  anonKey: string,
  storage: SupabaseAuthStorage = secureStoreStorage,
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      storage,
      // distinct from the anon read client (lib/supabase.ts) to avoid a shared
      // GoTrue storage key across the two coexisting instances.
      storageKey: 'psychage-auth',
      persistSession: true,
      autoRefreshToken: true,
      // No URL-based session detection on native (no browser redirect surface).
      detectSessionInUrl: false,
    },
  });
}

let cached: SupabaseClient | null = null;

/** Lazy singleton auth client. Throws only if called without configured env. */
export function getSupabaseAuthClient(): SupabaseClient {
  if (cached) return cached;
  const env = readEnv();
  if (!env) {
    throw new Error('Supabase env not configured (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY).');
  }
  cached = createSupabaseAuthClient(env.url, env.anonKey);
  return cached;
}
