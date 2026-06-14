import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { createStubAuthService, type AuthService, type AuthSession } from './auth-service';

// useAuth() — the React context wrapper rules/auth.md §10 requires for all auth calls.
//
// Tier-1 SAFETY (rules/auth.md §5/§10): a Tier-1 feature may read this with NO provider
// mounted and MUST get `session: null` — never a throw — so anonymous features keep
// working. The default context value below guarantees that.

interface AuthContextValue {
  readonly session: AuthSession | null;
  readonly service: AuthService;
  setSession(session: AuthSession | null): void;
}

// Module-singleton stub so the default context (no provider) and the provider default
// share one service instance. Swapped for the real Supabase-backed service later.
const defaultService = createStubAuthService();

const AuthContext = createContext<AuthContextValue>({
  session: null,
  service: defaultService,
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
  const value = useMemo<AuthContextValue>(
    () => ({ session, service, setSession }),
    [session, service],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
