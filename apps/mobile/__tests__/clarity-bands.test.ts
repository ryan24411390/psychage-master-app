import { describe, expect, it } from 'vitest';

import {
  describeChange,
  domainBand,
  groupDomains,
  isSteady,
  recommendations,
  TIER_COPY,
} from '@/features/clarity/bands';
import type { ClarityDomainScores, ClarityTier } from '@/features/clarity/types';

// The presentation vocabulary is the no-number rail: a domain's 0–20 score is shown as
// a closed band WORD, never the number. These guard the breakpoints + the routing.

describe('domainBand — closed-vocabulary breakpoints (16/12/8/4)', () => {
  it.each([
    [20, 'strong'],
    [16, 'strong'],
    [15.9, 'steady'],
    [12, 'steady'],
    [11.9, 'attention'],
    [8, 'attention'],
    [7.9, 'heavy'],
    [4, 'heavy'],
    [3.9, 'care'],
    [0, 'care'],
  ] as const)('score %s → %s', (score, band) => {
    expect(domainBand(score)).toBe(band);
  });

  it('isSteady mirrors the web STRENGTH_FLOOR (≥12/20)', () => {
    expect(isSteady(12)).toBe(true);
    expect(isSteady(11.9)).toBe(false);
  });
});

describe('TIER_COPY — every tier has calm, number-free, non-diagnostic copy', () => {
  it('covers all five tiers and carries no digits or diagnostic verbs', () => {
    const tiers: ClarityTier[] = ['thriving', 'balanced', 'mixed', 'strained', 'reachOut'];
    for (const t of tiers) {
      const copy = TIER_COPY[t];
      expect(copy.label.length).toBeGreaterThan(0);
      const blob = `${copy.label} ${copy.line}`.toLowerCase();
      expect(blob).not.toMatch(/\d/);
      for (const banned of ['you have', 'you are', 'diagnos', 'disorder']) {
        expect(blob).not.toContain(banned);
      }
    }
  });
});

describe('groupDomains — splits into steady vs worth-attention, preserving display order', () => {
  it('routes each domain by its band and keeps DOMAIN_META order', () => {
    const domains: ClarityDomainScores = {
      emotional: 18, // strong → steady
      wellbeing: 12, // steady
      social: 6, // attention
      stress: 2, // care
      functioning: 14, // steady
    };
    const { steady, attention } = groupDomains(domains);
    expect(steady.map((d) => d.key)).toEqual(['emotional', 'wellbeing', 'functioning']);
    expect(attention.map((d) => d.key)).toEqual(['social', 'stress']);
  });
});

describe('recommendations — low-domain routing mirrors the web, de-duplicated', () => {
  it('low emotional + functioning both map to /find but render once', () => {
    const domains: ClarityDomainScores = {
      emotional: 4, wellbeing: 18, social: 18, stress: 18, functioning: 4,
    };
    const recs = recommendations(domains);
    const findRecs = recs.filter((r) => r.route === '/find');
    expect(findRecs).toHaveLength(1);
  });

  it('all-high domains fall back to a single general nudge', () => {
    const domains: ClarityDomainScores = {
      emotional: 20, wellbeing: 20, social: 20, stress: 20, functioning: 20,
    };
    const recs = recommendations(domains);
    expect(recs).toHaveLength(1);
    expect(recs[0]?.domain).toBe('general');
  });

  it('every recommendation routes to a real mobile path, never a web one', () => {
    const domains: ClarityDomainScores = {
      emotional: 4, wellbeing: 4, social: 4, stress: 4, functioning: 4,
    };
    for (const r of recommendations(domains)) {
      expect(r.route.startsWith('/')).toBe(true);
      expect(r.route).not.toContain('sleep-architect'); // web slug
      expect(r.route).not.toBe('/providers'); // web route
    }
  });
});

describe('describeChange — qualitative only (no numeric delta crosses the rail)', () => {
  it('±5 on the composite separates steadier / same / heavier, with no digits', () => {
    expect(describeChange(70, 60)).toMatch(/steadier/i);
    expect(describeChange(60, 70)).toMatch(/heavier/i);
    expect(describeChange(62, 60)).toMatch(/same/i);
    expect(describeChange(70, 60)).not.toMatch(/\d/);
  });
});
