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

// B1's S34 sign-in. Does not exist until B1 lands — the visible-failure path pushes
// here and it resolves to route-not-found until then (correct stub). Never leak
// token details in any user-facing string (security.md §3 — generic only).
export const AUTH_SIGN_IN_ROUTE = '/auth/sign-in';

export const stubWvtIssuer: WvtIssuer = {
  async issue(_surface: SurfaceSlug): Promise<WvtIssue> {
    // TODO(B1/S34): POST /webview-token-issue → 60s JWT; read the access token from
    // expo-secure-store. Gated — no network in B2.
    throw new WvtUnavailableError();
  },
};
