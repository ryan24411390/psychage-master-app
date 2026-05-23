/**
 * Symptom Navigator — Engine Tier-Predicate Injection
 *
 * Locks in the DI seam threaded through `runSymptomNavigator` in
 * Phase 6 Slice 6 (resolves Phase 5 Slice 2 carry-over). Per
 * rules/conventions.md #3, the engine must accept a consumer-supplied
 * `isTierEnabled` predicate so feature-flag adapters (expo-constants on
 * mobile, import.meta.env on web) stay in the app, not in
 * packages/shared.
 *
 * Two contracts:
 *   1. Default predicate omitted → all conditions enabled (web parity).
 *   2. Custom predicate excludes tiered conditions when it returns false.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runSymptomNavigator } from '@/lib/navigator/engine';
import type { IsTierEnabledFn } from '@/lib/navigator/featureFlags';
import type {
  KnowledgeBase,
  UserSymptomInput,
} from '@/lib/navigator/types';
import { createTestKnowledgeBase } from './test-helpers';

describe('runSymptomNavigator — isTierEnabled DI seam', () => {
  let kb: KnowledgeBase;

  // Classic NPD presentation (Tier 4). Mirrors expansion-phase4.test.ts.
  const npdInputs: UserSymptomInput[] = [
    { symptom_id: 'IDN_005', severity: 8, duration: 'more_than_1_year', frequency: 'always' },
    { symptom_id: 'IDN_006', severity: 7, duration: 'more_than_1_year', frequency: 'often' },
    { symptom_id: 'IDN_007', severity: 8, duration: 'more_than_1_year', frequency: 'always' },
    { symptom_id: 'EMR_002', severity: 6, duration: 'more_than_1_year', frequency: 'often' },
    { symptom_id: 'MOD_011', severity: 5, duration: 'more_than_1_year', frequency: 'sometimes' },
    { symptom_id: 'SOC_003', severity: 6, duration: 'more_than_1_year', frequency: 'often' },
  ];

  beforeAll(() => {
    kb = createTestKnowledgeBase();
  });

  it('default predicate omitted: NPD (Tier 4) still surfaces — web-parity backward compat', () => {
    const results = runSymptomNavigator(npdInputs, kb);
    const ids = results.results.map((r) => r.condition_id);

    expect(ids).toContain('NPD');
    // Sacred Rule #1 still in force.
    expect(results.results[0].relevance_score).toBeLessThanOrEqual(0.75);
  });

  it('custom predicate excluding Tier 4+: NPD filtered out, lower-tier results still surface', () => {
    const isTierEnabled: IsTierEnabledFn = (tier) => tier < 4;

    const results = runSymptomNavigator(npdInputs, kb, undefined, isTierEnabled);
    const ids = results.results.map((r) => r.condition_id);

    expect(ids).not.toContain('NPD');
    expect(ids).not.toContain('ASPD'); // also Tier 4
    expect(results.results.length).toBeGreaterThan(0); // untiered + Tier 1-3 still flow through
    expect(results.results[0].relevance_score).toBeLessThanOrEqual(0.75);
  });
});
