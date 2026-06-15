import type { SurfaceSlug } from '@/features/webview/surfaces';

// The WebView auth handshake — the SR-4 / auth-gated SEAM. B1 (rules/auth.md, S34)
// owns the real flow: POST a Supabase Edge Function /webview-token-issue → a 60s
// JWT (ARCHITECTURE.md §6), which the web side exchanges for a session cookie.
//
// In Wave B2 this is the CALL BOUNDARY only — a stub issuer that throws, plus the
// sign-in route constant the visible-failure path routes to. No network, no token
// is ever written to MMKV or logged.

export interface WvtIssue {
  readonly wvt: string;
  readonly expiresAt: number;
}

export interface WvtIssuer {
  issue(surface: SurfaceSlug): Promise<WvtIssue>;
}

export class WvtUnavailableError extends Error {
  constructor() {
    super('WebView token issuance is gated behind the auth slice (B1 / S34).');
    this.name = 'WvtUnavailableError';
  }
}

// B1's S34 sign-in (now landed). The visible-failure path pushes here when WVT
// issuance is unavailable. `(auth)` is an Expo Router GROUP — its segment is NOT
// part of the URL — so the route resolves at `/sign-in`, NOT `/auth/sign-in`.
// The former dead-ended on the +not-found screen. Matches the canonical ref used
// elsewhere (app/settings/index.tsx → router.push('/sign-in')). Never leak token
// details in any user-facing string (security.md §3 — generic only).
export const AUTH_SIGN_IN_ROUTE = '/sign-in';

export const stubWvtIssuer: WvtIssuer = {
  async issue(_surface: SurfaceSlug): Promise<WvtIssue> {
    // TODO(B1/S34): POST /webview-token-issue → 60s JWT; read the access token from
    // expo-secure-store. Gated — no network in B2.
    throw new WvtUnavailableError();
  },
};
