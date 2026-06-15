// Sleep Architect — logic-bearing constants (ported verbatim from psychage-v2
// `src/lib/sleep/constants.ts`). Only the values that DRIVE computation live here;
// pure UI content (breathing configs, PMR scripts, CBT-I prose, hygiene labels)
// stays with the screens that render it.

import type { SleepSettings } from './types';

// ─── Sleep Recommendations by Age ───────────────────────────────────────────
// Source: National Sleep Foundation, 2015 (Hirshkowitz et al.). Minutes.

export const SLEEP_RECOMMENDATIONS: Record<
  string,
  { min: number; max: number; ideal: number; label: string }
> = {
  teen_14_17: { min: 480, max: 600, ideal: 540, label: 'Teen (14–17)' },
  young_18_25: { min: 420, max: 540, ideal: 480, label: 'Young Adult (18–25)' },
  adult_26_64: { min: 420, max: 540, ideal: 480, label: 'Adult (26–64)' },
  older_65_plus: { min: 420, max: 480, ideal: 450, label: 'Older Adult (65+)' },
};

export const DEFAULT_SLEEP_SETTINGS: SleepSettings = {
  target_sleep_minutes: 480,
  age_range: 'adult_26_64',
};

// ─── Crisis Detection Keywords ──────────────────────────────────────────────
// Scanned in free-text inputs (notes, dream notes, brain dump) by detectCrisisContent.
// A local, on-device safety net (SR-2/SR-3) — never sent anywhere.

export const CRISIS_KEYWORDS: readonly string[] = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'better off dead',
  'no reason to live',
  'self-harm',
  'self harm',
  'cut myself',
  'hurt myself',
  'overdose',
  'jump off',
  'hang myself',
  'not worth living',
  "can't go on",
  'end it all',
  'plan to die',
];
