// Cold-start migrator wiring — behavioral (replaces the prior source-grep, F-12).
//
// The old version read _layout.tsx as text and regex-matched its import line —
// it asserted the wiring existed without proving it does anything. This asserts
// the EFFECT instead: importing the feature-flag adapter (the exact module
// _layout.tsx pulls in as a side effect at cold start) runs loadTierFlags against
// the in-memory Storage seam at module init, hydrating a v1 envelope before any
// consumer reads a flag.
//
// Two halves cover the original intent without the brittle string match:
//   • this test     — the adapter's module-init chain (migrate → write-back → read)
//   • _layout smoke — that _layout.tsx actually imports this adapter (root-layout
//                     render in app-layout-smoke.test.tsx; jest/RNTL side).
//
// Vitest (node) resolves `./storage` to the in-memory storage.ts — the same seam
// the migrator tests use — so this needs no React Native graph.

import { describe, it, expect } from 'vitest';

import { STORAGE_KEY, type Persisted } from '@/lib/persistence/tier-flags';

// Importing the adapter is the cold-start side effect under test. The static
// import below executes its module body — loadTierFlags(storage) — once.
import { isTierEnabled } from '@/lib/adapters/featureFlags';
import { storage } from '@/lib/adapters/storage';

describe('cold-start tier-flags wiring — adapter module-init effect', () => {
  it('hydrates a v1 envelope into storage at module load (migrator ran + stamped)', () => {
    const raw = storage.get(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string) as Persisted;
    expect(persisted.version).toBe(1);
    // Default seed preserves Slice 7's all-tiers-surface semantics.
    expect(persisted.data).toEqual({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
  });

  it('exposes the seam predicate, reading the hydrated flags', () => {
    expect(isTierEnabled(1)).toBe(true);
    expect(isTierEnabled(6)).toBe(true);
  });
});
