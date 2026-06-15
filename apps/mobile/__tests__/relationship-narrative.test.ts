import { describe, expect, it } from 'vitest';

import { generateBlueprint } from '@/features/relationship-health/narrative';
import { computeResult } from '@/features/relationship-health/scoring';
import { QUESTIONS } from '@/features/relationship-health/questions';
import type { DomainScores, SubDimensionScores } from '@/features/relationship-health/types';

function answersEffective(effective: number): Record<string, number> {
  const a: Record<string, number> = {};
  for (const q of QUESTIONS) a[q.id] = q.reverseScored ? 6 - effective : effective;
  return a;
}

function fullSub(def: number): SubDimensionScores {
  return {
    partner: {
      emotional_responsiveness: def,
      conflict_quality: def,
      trust_safety: def,
      appreciation: def,
      growth_meaning: def,
    },
    family: { emotional_support: def, acceptance_belonging: def, healthy_communication: def, autonomy_respect: def },
    friends: { depth_authenticity: def, reciprocity_balance: def, connection_presence: def, vulnerability_trust: def },
    community: { belonging_identity: def, active_engagement: def, social_integration: def, purpose_contribution: def },
  };
}

describe('blueprint narrative', () => {
  it('is deterministic — identical inputs produce identical text', () => {
    const a = answersEffective(4);
    expect(computeResult(a, false).blueprint).toBe(computeResult(a, false).blueprint);
  });

  it('selects a tier-appropriate opener and is non-empty', () => {
    const ds: DomainScores = { partner: 90, family: 90, friends: 90, community: 90 };
    const text = generateBlueprint(90, 'thriving', ds, fullSub(90), [], null, false);
    expect(text.length).toBeGreaterThan(0);
    // both "thriving" openers speak to strength/connection
    expect(text.toLowerCase()).toMatch(/strength|connection/);
  });

  it('different score profiles produce different blueprints', () => {
    const high = computeResult(answersEffective(5), false).blueprint;
    const low = computeResult(answersEffective(1), false).blueprint;
    expect(high).not.toBe(low);
  });
});
