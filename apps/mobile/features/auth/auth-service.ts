// THE AUTH BACKEND SEAM.
//
// This wave builds the SCREENS + the flow. The real auth backend is OUT OF SCOPE
// here: there is no @supabase/supabase-js client or packages/api yet, and session
// tokens (rules/auth.md §6 — expo-secure-store, Keychain/Keystore, NEVER MMKV/
// AsyncStorage) land with it. The in-memory stub below drives the screens in
// isolation. When the real backend arrives, only this file changes — the screens
// consume the AuthService interface.
//
// SECURITY (Procedure-B checklist, item 3): error codes are GENERIC. Sign-in failure
// is 'invalid-credentials' — it never reveals whether an email is registered.

export type AuthErrorCode = 'invalid-credentials' | 'offline' | 'unknown';

export type VerificationStatus = 'unverified' | 'verified';

export interface AuthSession {
  readonly email: string;
  /** rules/auth.md §3: Tier-2 features unlock only after email verification. */
  readonly verified: boolean;
}

export interface AuthResult {
  readonly ok: boolean;
  readonly error?: AuthErrorCode;
  readonly session?: AuthSession;
}

export interface AuthService {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  resendVerification(): Promise<{ ok: boolean }>;
  getVerificationStatus(): Promise<VerificationStatus>;
  signOut(): Promise<void>;
}

export interface StubAuthOptions {
  /** Simulate no network — every call returns the honest offline outcome. */
  readonly offline?: boolean;
}

// In-memory stub. No network, no token storage, no real credential check.
// signUp opens an UNVERIFIED session (verification gates Tier-2 per rules/auth.md §3).
export function createStubAuthService(options: StubAuthOptions = {}): AuthService {
  const offline = options.offline ?? false;
  let session: AuthSession | null = null;

  return {
    async signUp(email: string) {
      if (offline) return { ok: false, error: 'offline' };
      session = { email, verified: false };
      return { ok: true, session };
    },
    async signIn(email: string) {
      if (offline) return { ok: false, error: 'offline' };
      // Stub has no credential store, so it admits the sign-in. The REAL impl verifies
      // against Supabase and returns { ok: false, error: 'invalid-credentials' } on
      // any failure — the same generic code for wrong-password and unknown-email.
      session = { email, verified: true };
      return { ok: true, session };
    },
    async resendVerification() {
      return { ok: !offline };
    },
    async getVerificationStatus() {
      return session?.verified ? 'verified' : 'unverified';
    },
    async signOut() {
      session = null;
    },
  };
}
