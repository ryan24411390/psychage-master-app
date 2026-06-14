// Minimal Supabase anon client for mobile reads.
//
// V1 mobile reads public reference data (crisis resources, articles, …) from
// the shared Supabase project per ARCHITECTURE.md §1 (unidirectional read).
// This is the first network client in the app; it is intentionally tiny and
// inline rather than a packages/api package — there is exactly one consumer
// today (the crisis data module). Promote to packages/api when a second
// consumer appears.
//
// The anon key is PUBLIC by design — Row-Level Security is the access gate, not
// the key (see the crisis_helplines RLS: anon SELECT is restricted to
// verification_status = 'verified'). URL + anon key come from EXPO_PUBLIC_*
// env vars, inlined by Expo at build time. Never put the service-role key here.
//
// SR-4: this client only ever reads PUBLIC reference data. It must never be
// used to read or write symptom / mood / navigator state.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * The shared anon client, or `null` when env vars are absent (e.g. a build
 * without Supabase configured). Callers must treat `null` as "no network
 * source available" and fall back to local data — the crisis module does this,
 * so crisis never depends on this client being present.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
