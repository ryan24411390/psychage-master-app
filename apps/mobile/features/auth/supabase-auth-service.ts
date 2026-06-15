// The REAL Supabase-backed AuthService (Slice 2 — platform JWT claim).
//
// Implements the same AuthService interface the screens already consume (see
// auth-service.ts). The in-memory stub stays for tests and for builds without
// Supabase env; use-auth selects this one when EXPO_PUBLIC_SUPABASE_* is set.
//
// WHAT THIS WIRES (and only this):
//   - signUp carries `options.data = { platform: 'mobile' }` -> raw_user_meta_data
//     -> the custom_access_token hook lifts it to a top-level `platform` JWT claim
//     (migration 20260614000007). That claim is what the slice-1 RLS write policies
//     check. No personal-data writes happen here.
//   - successful auth events emit an audit_events row via the record_auth_event
//     SECURITY DEFINER RPC (migration 20260614000006) — Procedure-B checklist #5.
//
// SECURITY (Procedure-B checklist #3): error codes are GENERIC. We NEVER surface
// whether an email is registered — every credential/sign-up failure collapses to
// 'invalid-credentials' (or 'offline' for network failures). No message strings
// leave this module.

import type { SupabaseClient } from '@supabase/supabase-js';

import { getOrCreateDeviceId } from '@/lib/device-id';
import { getSupabaseAuthClient } from '@/lib/supabase/client';
import { isNetworkError } from '@/lib/supabase/is-network-error';

import type { AuthResult, AuthService, VerificationStatus } from './auth-service';

type AuthEventType = 'sign_up' | 'sign_in' | 'sign_out';

export interface SupabaseAuthServiceDeps {
  /** Defaults to the lazy app singleton; injected in tests. */
  readonly client?: SupabaseClient;
  /** Defaults to the stable per-install id; injected in tests. */
  readonly deviceId?: string;
}

export function createSupabaseAuthService(deps: SupabaseAuthServiceDeps = {}): AuthService {
  const client = deps.client ?? getSupabaseAuthClient();
  const deviceId = deps.deviceId ?? getOrCreateDeviceId();

  // Best-effort audit. Never throws into the auth UX; a failed audit write must
  // not block sign-in. Requires an authenticated session (auth.uid()).
  async function recordEvent(eventType: AuthEventType, success: boolean): Promise<void> {
    try {
      await client.rpc('record_auth_event', {
        p_event_type: eventType,
        p_device_id: deviceId,
        p_success: success,
      });
    } catch {
      // swallow — audit is non-blocking
    }
  }

  return {
    async signUp(email, password) {
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          // platform claim source — lifted to a top-level JWT claim by the hook.
          options: { data: { platform: 'mobile' } },
        });
        if (error) {
          // Generic only: do NOT distinguish "already registered" (existence leak).
          return { ok: false, error: isNetworkError(error) ? 'offline' : 'invalid-credentials' };
        }
        if (data.session) await recordEvent('sign_up', true);
        return {
          ok: true,
          session: { email, verified: Boolean(data.user?.email_confirmed_at) },
        };
      } catch (error) {
        return { ok: false, error: isNetworkError(error) ? 'offline' : 'unknown' };
      }
    },

    async signIn(email, password) {
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          // Same generic code for wrong-password and unknown-email.
          return { ok: false, error: isNetworkError(error) ? 'offline' : 'invalid-credentials' };
        }
        await recordEvent('sign_in', true);
        return {
          ok: true,
          session: { email, verified: Boolean(data.user?.email_confirmed_at) },
        };
      } catch (error) {
        return { ok: false, error: isNetworkError(error) ? 'offline' : 'unknown' };
      }
    },

    async resendVerification() {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        const email = session?.user?.email;
        if (!email) return { ok: false };
        const { error } = await client.auth.resend({ type: 'signup', email });
        return { ok: !error };
      } catch {
        return { ok: false };
      }
    },

    async getVerificationStatus(): Promise<VerificationStatus> {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        return session?.user?.email_confirmed_at ? 'verified' : 'unverified';
      } catch {
        return 'unverified';
      }
    },

    async signOut() {
      await recordEvent('sign_out', true);
      try {
        await client.auth.signOut();
      } catch {
        // session is cleared locally by supabase-js even on network failure
      }
    },
  } satisfies AuthService;
}

// Convenience re-export of the result type for call sites that want it.
export type { AuthResult };
