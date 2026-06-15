// Clarity Score — presentation vocabulary. The mobile rails forbid a raw 0–100
// number or a progress bar that reads as a verdict, so the composite and each
// domain are rendered as CLOSED-VOCABULARY BAND LABELS instead (the same stance the
// native Symptom Navigator takes — text only, no meter). This module is the single
// place that copy lives. PURE → Vitest.
//
// All user-facing strings here are PROVISIONAL and require Dr. Dobson clinical
// review before ship (workspace rules §7). Breakpoints mirror the web's tiers.

import type {
  ClarityDomainKey,
  ClarityDomainScores,
  ClarityRecommendation,
  ClarityTier,
} from './types';

/** Overall tier → calm label + one-liner. No numbers, no diagnosis. */
export const TIER_COPY: Record<ClarityTier, { readonly label: string; readonly line: string }> = {
  thriving: { label: 'Thriving', line: 'Strong wellbeing across most areas right now.' },
  balanced: { label: 'Balanced', line: 'A solid foundation, with room to grow.' },
  mixed: { label: 'Mixed', line: 'Some areas are asking for a little attention.' },
  strained: { label: 'Strained', line: 'Several areas feel heavy right now — support can help.' },
  reachOut: { label: 'A lot to carry', line: "This looks like a lot right now. You don't have to carry it alone." },
};

/** A domain's 0–20 score → its band word. Breakpoints match the web (16/12/8/4). */
export type DomainBand = 'strong' | 'steady' | 'attention' | 'heavy' | 'care';

export function domainBand(score: number): DomainBand {
  if (score >= 16) return 'strong';
  if (score >= 12) return 'steady';
  if (score >= 8) return 'attention';
  if (score >= 4) return 'heavy';
  return 'care';
}

export const DOMAIN_BAND_WORD: Record<DomainBand, string> = {
  strong: 'strong',
  steady: 'steady',
  attention: 'worth attention',
  heavy: 'feels heavy',
  care: 'needs care',
};

/** True when a domain clears the "steady/strong" floor (≥12/20, the web's STRENGTH_FLOOR). */
export function isSteady(score: number): boolean {
  return score >= 12;
}

/** Display order + label for the five domains. */
export const DOMAIN_META: ReadonlyArray<{ readonly key: ClarityDomainKey; readonly label: string }> = [
  { key: 'emotional', label: 'Emotional wellness' },
  { key: 'wellbeing', label: 'Overall wellbeing' },
  { key: 'social', label: 'Social connection' },
  { key: 'stress', label: 'Stress load' },
  { key: 'functioning', label: 'Daily functioning' },
];

/** Split domains into the "steady" group and the "worth attention" group, in order. */
export function groupDomains(domains: ClarityDomainScores): {
  steady: ReadonlyArray<{ key: ClarityDomainKey; label: string; band: DomainBand }>;
  attention: ReadonlyArray<{ key: ClarityDomainKey; label: string; band: DomainBand }>;
} {
  const steady: Array<{ key: ClarityDomainKey; label: string; band: DomainBand }> = [];
  const attention: Array<{ key: ClarityDomainKey; label: string; band: DomainBand }> = [];
  for (const { key, label } of DOMAIN_META) {
    const score = domains[key];
    const entry = { key, label, band: domainBand(score) };
    if (isSteady(score)) steady.push(entry);
    else attention.push(entry);
  }
  return { steady, attention };
}

/**
 * Recommendations surfaced when a domain is low (≤10/20). Routes target real mobile
 * screens. Threshold + selection mirror the web's getRecommendations; copy is
 * reframed person-first and the links are remapped from web routes to mobile ones.
 */
export function recommendations(domains: ClarityDomainScores): ClarityRecommendation[] {
  const recs: ClarityRecommendation[] = [];

  if (domains.emotional <= 10) {
    recs.push({
      domain: 'emotional',
      text: 'Talking with someone trained can help when emotions feel heavy.',
      route: '/find',
      actionLabel: 'Find professional care',
    });
  }
  if (domains.wellbeing <= 10) {
    recs.push({
      domain: 'wellbeing',
      text: 'Small restoring routines and grounding can help rebuild energy.',
      route: '/toolkit',
      actionLabel: 'Try a steadying exercise',
    });
  }
  if (domains.social <= 10) {
    recs.push({
      domain: 'social',
      text: 'Reaching for small connections can make a real difference.',
      route: '/learn',
      actionLabel: 'Read about connection',
    });
  }
  if (domains.stress <= 10) {
    recs.push({
      domain: 'stress',
      text: 'Sleep and stress tools can ease a heavy load.',
      route: '/tools/sleep',
      actionLabel: 'Open the sleep tools',
    });
  }
  if (domains.functioning <= 10) {
    recs.push({
      domain: 'functioning',
      text: 'When daily life feels hard to manage, support is worth considering.',
      route: '/find',
      actionLabel: 'Find professional care',
    });
  }

  if (recs.length === 0) {
    recs.push({
      domain: 'general',
      text: 'Keep up your check-ins — small, regular ones help most.',
      route: '/toolkit',
      actionLabel: 'Explore the toolkit',
    });
  }

  // 'emotional' and 'functioning' can both map to /find; collapse the duplicate so
  // the same action does not render twice.
  const seen = new Set<string>();
  return recs.filter((r) => {
    const k = `${r.route}|${r.actionLabel}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Qualitative change vs the previous snapshot — kept qualitative (no numeric delta)
 * to stay consistent with the no-raw-number rail. A 5-point band on the 0–100
 * composite separates "steadier" / "about the same" / "heavier".
 */
export function describeChange(latest: number, previous: number): string {
  const delta = latest - previous;
  if (delta >= 5) return 'A little steadier than last time.';
  if (delta <= -5) return 'A bit heavier than last time.';
  return 'About the same as last time.';
}
