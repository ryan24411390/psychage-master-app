// Cold-start migrator wiring — entry-point-layer regression test.
//
// Slice 8's storage-layer tests (tier-flags-persistence.test.ts,
// tier-flags-composition.test.ts) call loadTierFlags directly with their own
// Storage and never import the production launch path. They cannot catch a
// regression where _layout.tsx's side-effect import points back at the
// declarations-only `@/lib/persistence/tier-flags` module instead of the
// adapter module whose body runs `loadTierFlags(storage)` at module init.
//
// Vitest's `environment: 'node'` cannot resolve the React Native + Expo
// dependency graph that a dynamic import of `_layout.tsx` would pull in, so
// this test asserts the import target via source-text inspection. The exact
// runtime behavior (loadTierFlags fires before any isTierEnabled read) is
// covered by `featureFlags.ts`'s module-init contract, which Slice 8's
// composition test exercises.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

const layoutPath = join(__dirname, '..', 'app', '_layout.tsx');
const source = readFileSync(layoutPath, 'utf8');

describe('cold-start migrator wiring — _layout.tsx side-effect import target', () => {
  it('imports @/lib/adapters/featureFlags as a side effect (fires loadTierFlags at module init)', () => {
    expect(source).toMatch(/import\s+['"]@\/lib\/adapters\/featureFlags['"];/);
  });

  it('does NOT import @/lib/persistence/tier-flags as a side effect (that module is declarations-only — zero top-level execution)', () => {
    expect(source).not.toMatch(/import\s+['"]@\/lib\/persistence\/tier-flags['"];/);
  });
});
