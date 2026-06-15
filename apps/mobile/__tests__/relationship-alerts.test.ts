import { describe, expect, it } from 'vitest';

import { checkDVSafety, checkSocialIsolation } from '@/features/relationship-health/alerts';
import type { DomainScores, FourHorsemenResult } from '@/features/relationship-health/types';

const fhElevated: FourHorsemenResult = {
  criticism: { score: 5, present: true },
  contempt: { score: 5, present: true },
  defensiveness: { score: 5, present: true },
  stonewalling: { score: 5, present: true },
  overallRisk: 'elevated',
  activeCount: 4,
};

describe('checkDVSafety', () => {
  it('trigger 1: safety item ≤ 2 is an automatic critical', () => {
    expect(checkDVSafety({ p_ts_02: 1 }, 90, 90, null)).toEqual({ triggered: true, severity: 'critical' });
    expect(checkDVSafety({ p_ts_02: 2 }, 90, 90, null)).toEqual({ triggered: true, severity: 'critical' });
  });

  it('trigger 3: a distress item + low partner domain is a warning', () => {
    // safetyRaw 3 (no trigger 1), contempt high, partner domain < 25
    expect(checkDVSafety({ p_ts_02: 3, p_ap_02: 4 }, 20, 40, null)).toEqual({
      triggered: true,
      severity: 'warning',
    });
  });

  it('trigger 4: contempt present + very low trust/safety sub-score is a warning', () => {
    expect(checkDVSafety({ p_ts_02: 4, p_ap_02: 4 }, 60, 20, null)).toEqual({
      triggered: true,
      severity: 'warning',
    });
  });

  it('trigger 5: elevated Four Horsemen + low partner domain is a warning', () => {
    expect(checkDVSafety({ p_ts_02: 4, p_ap_02: 2 }, 28, 60, fhElevated)).toEqual({
      triggered: true,
      severity: 'warning',
    });
  });

  it('does not trigger when everything is healthy', () => {
    expect(checkDVSafety({ p_ts_02: 5, p_ap_02: 1 }, 90, 90, null)).toEqual({
      triggered: false,
      severity: 'warning',
    });
  });
});

describe('checkSocialIsolation', () => {
  const ds = (partner: number, family: number, friends: number, community: number): DomainScores => ({
    partner,
    family,
    friends,
    community,
  });

  it('severe when composite < 20', () => {
    expect(checkSocialIsolation(10, ds(10, 10, 10, 10), false)).toEqual({ triggered: true, severity: 'severe' });
  });

  it('moderate when friends and community are both < 30', () => {
    expect(checkSocialIsolation(45, ds(80, 70, 25, 20), false)).toEqual({
      triggered: true,
      severity: 'moderate',
    });
  });

  it('moderate when composite < 30 and no domain reaches 50', () => {
    expect(checkSocialIsolation(28, ds(40, 40, 40, 40), false)).toEqual({
      triggered: true,
      severity: 'moderate',
    });
  });

  it('does not trigger when a strong domain buffers a low composite', () => {
    expect(checkSocialIsolation(45, ds(80, 40, 40, 40), false)).toEqual({
      triggered: false,
      severity: 'moderate',
    });
  });
});
