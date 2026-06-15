import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// The ONE linked provider (V1 — multi-provider is premium / V1.1, rules/auth.md §3).
// Provider contact is PII and sensitive (rules/auth.md §1): NEVER to analytics/Sentry
// (Sacred Rule #11). Held in-memory here for the flow — real persistence is
// account-tier (Tier-2) and SERVER-side, gated behind the SR-4/sync layer. Flagged.

export interface Provider {
  readonly name: string;
  /** Optional email/phone. PII — kept local, never logged. */
  readonly contact?: string;
}

interface ProviderContextValue {
  readonly provider: Provider | null;
  setProvider(provider: Provider | null): void;
}

const ProviderContext = createContext<ProviderContextValue>({
  provider: null,
  setProvider: () => {},
});

export function ProviderProvider({
  children,
  initialProvider = null,
}: {
  children: ReactNode;
  initialProvider?: Provider | null;
}) {
  const [provider, setProvider] = useState<Provider | null>(initialProvider);
  const value = useMemo<ProviderContextValue>(() => ({ provider, setProvider }), [provider]);
  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

export function useProvider(): ProviderContextValue {
  return useContext(ProviderContext);
}
