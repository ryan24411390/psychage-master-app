import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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
