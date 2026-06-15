import { describe, expect, it } from 'vitest';

import { detectPatterns } from '@/features/relationship-health/patterns';
import type {
  DomainScores,
  FourHorsemenResult,
  SubDimensionScores,
} from '@/features/relationship-health/types';

function ds(partner: number, family: number, friends: number, community: number): DomainScores {
  return { partner, family, friends, community };
}

function fullSub(def = 50, overrides: Partial<Record<string, number>> = {}): SubDimensionScores {
  const base: SubDimensionScores = {
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
  // Shallow override on partner sub-scores (the only ones tests need to tweak).
  return { ...base, partner: { ...base.partner, ...(overrides as Record<string, number>) } };
}

const fhElevated: FourHorsemenResult = {
  criticism: { score: 5, present: true },
  contempt: { score: 5, present: true },
  defensiveness: { score: 5, present: true },
  stonewalling: { score: 5, present: true },
  overallRisk: 'elevated',
  activeCount: 4,
};

const fhLow: FourHorsemenResult = {
  criticism: { score: 1, present: false },
  contempt: { score: 1, present: false },
  defensiveness: { score: 1, present: false },
  stonewalling: { score: 1, present: false },
  overallRisk: 'low',
  activeCount: 0,
};

describe('detectPatterns', () => {
  it('returns no patterns for a uniformly healthy profile', () => {
    const out = detectPatterns(ds(100, 100, 100, 100), fullSub(100), fhLow, {}, false);
    expect(out).toHaveLength(0);
  });

  it('flags broad disconnection (concern) when every domain is below 40', () => {
    const out = detectPatterns(ds(10, 10, 10, 10), fullSub(50), null, {}, false);
    const keys = out.map((p) => p.key);
    expect(keys).toContain('broad_disconnection');
    expect(out[0]?.severity).toBe('concern'); // concern sorts first
  });

  it('flags the pursue-withdraw dynamic from sub-dimension scores', () => {
    const out = detectPatterns(
      ds(60, 60, 60, 60),
      fullSub(50, { emotional_responsiveness: 80, conflict_quality: 10 }),
      fhLow,
      {},
      false,
    );
    expect(out.map((p) => p.key)).toContain('pursue_withdraw');
  });

  it('flags identity masking when ≥2 hiding items are strongly endorsed', () => {
    const out = detectPatterns(ds(50, 50, 50, 50), fullSub(50), null, { f_ab_02: 5, f_ar_02: 5 }, false);
    expect(out.map((p) => p.key)).toContain('hidden_self');
  });

  it('caps output at 4 patterns and sorts concern → warning → info', () => {
    const out = detectPatterns(
      ds(80, 10, 10, 10),
      fullSub(50, { emotional_responsiveness: 80, conflict_quality: 10 }),
      fhElevated,
      {},
      false,
    );
    expect(out.length).toBeLessThanOrEqual(4);
    expect(out[0]?.severity).toBe('concern');
    const order = { concern: 0, warning: 1, info: 2 } as const;
    for (let i = 1; i < out.length; i++) {
      const cur = out[i];
      const prev = out[i - 1];
      if (!cur || !prev) continue;
      expect(order[cur.severity]).toBeGreaterThanOrEqual(order[prev.severity]);
    }
  });

  it('skipPartner suppresses partner-only patterns', () => {
    const out = detectPatterns(
      ds(0, 60, 60, 60),
      fullSub(50, { emotional_responsiveness: 80, conflict_quality: 10 }),
      null,
      {},
      true,
    );
    const keys = out.map((p) => p.key);
    expect(keys).not.toContain('pursue_withdraw');
    expect(keys).not.toContain('intimate_isolation');
  });
});
