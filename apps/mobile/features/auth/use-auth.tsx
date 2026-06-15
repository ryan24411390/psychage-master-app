import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase/client';

import { createStubAuthService, type AuthService, type AuthSession } from './auth-service';
import { createSupabaseAuthService } from './supabase-auth-service';

// useAuth() — the React context wrapper rules/auth.md §10 requires for all auth calls.
//
// Tier-1 SAFETY (rules/auth.md §5/§10): a Tier-1 feature may read this with NO provider
// mounted and MUST get `session: null` — never a throw — so anonymous features keep
// working. The default context value below guarantees that.

interface AuthContextValue {
  readonly session: AuthSession | null;
  readonly service: AuthService;
  /**
   * True once the initial getSession() has resolved (boot hydration complete). The
   * splash screen holds until this flips so the app never paints signed-out then
   * snaps to signed-in. Defaults true with no provider mounted (nothing to hydrate).
   */
  readonly hydrated: boolean;
  setSession(session: AuthSession | null): void;
}

// Module-singleton service shared by the default context (no provider) and the
// provider default. Env-gated (Slice 2): the real Supabase-backed service is used
// when EXPO_PUBLIC_SUPABASE_* is configured; otherwise the in-memory stub keeps
// screens (and tests) working with no backend.
const defaultService: AuthService = isSupabaseConfigured()
  ? createSupabaseAuthService()
  : createStubAuthService();

const AuthContext = createContext<AuthContextValue>({
  session: null,
  service: defaultService,
  hydrated: true,
  setSession: () => {},
});

export function AuthProvider({
  children,
  service = defaultService,
}: {
  children: ReactNode;
  service?: AuthService;
}) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Boot hydration + reactivity (web parity: AuthContext getSession + onAuthStateChange).
  // Without this the context boots null forever — the token persists in secure-store,
  // but the UI would falsely read "signed out" after a relaunch (and Settings, mounted
  // outside the old (auth)-local provider, never saw a session at all). The listener
  // keeps state in sync with token refresh, expiry-logout, and sign-out from anywhere.
  useEffect(() => {
    let active = true;
    void service.getSession().then((restored) => {
      if (!active) return;
      setSession(restored);
      setHydrated(true);
    });
    const unsubscribe = service.onAuthChange((next) => {
      if (active) setSession(next);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, service, hydrated, setSession }),
    [session, service, hydrated],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
