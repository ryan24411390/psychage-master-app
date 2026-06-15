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
  /**
   * Resend the signup confirmation email. `email` is the address from the verify
   * screen's route param. When email confirmation is ON, signUp returns NO session
   * (the user must confirm first), so the impl CANNOT rely on getSession() for the
   * address — it must use this param. Falls back to the session email when omitted.
   */
  resendVerification(email?: string): Promise<{ ok: boolean }>;
  getVerificationStatus(): Promise<VerificationStatus>;
  signOut(): Promise<void>;
  /**
   * The current persisted session, or null when signed out. The boot-hydration
   * source: supabase-js restores the token from secure-store, but the React
   * context must read it back to reflect "still signed in" after a relaunch.
   */
  getSession(): Promise<AuthSession | null>;
  /**
   * Subscribe to auth-state changes (sign-in, sign-out, token refresh, expiry).
   * Listener fires with the new session or null; returns an unsubscribe fn.
   * Mirrors web AuthContext's onAuthStateChange (the runtime state updater).
   */
  onAuthChange(listener: (session: AuthSession | null) => void): () => void;
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
  const listeners = new Set<(session: AuthSession | null) => void>();
  const emit = () => {
    for (const listener of listeners) listener(session);
  };

  return {
    async signUp(email: string) {
      if (offline) return { ok: false, error: 'offline' };
      session = { email, verified: false };
      emit();
      return { ok: true, session };
    },
    async signIn(email: string) {
      if (offline) return { ok: false, error: 'offline' };
      // Stub has no credential store, so it admits the sign-in. The REAL impl verifies
      // against Supabase and returns { ok: false, error: 'invalid-credentials' } on
      // any failure — the same generic code for wrong-password and unknown-email.
      session = { email, verified: true };
      emit();
      return { ok: true, session };
    },
    async resendVerification(_email?: string) {
      return { ok: !offline };
    },
    async getVerificationStatus() {
      return session?.verified ? 'verified' : 'unverified';
    },
    async signOut() {
      session = null;
      emit();
    },
    async getSession() {
      return session;
    },
    onAuthChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
