// Clarity Score — enriched dimension metadata for the results dashboard. Ported from
// psychage-v2 src/components/tools/ClarityScore/data/dimensions.ts. Two RN adaptations:
// icons come from lucide-react-native (not lucide-react), and the web's Tailwind class
// strings are dropped — mobile Tailwind has no rose/indigo/pink/amber/emerald palette,
// so every dimension color is applied from `hexColor` via SVG/style props downstream.
//
// Domain key mapping preserved from the scoring engine:
//   'vitality'  → "Overall Wellbeing" (WHO-5)
//   'cognitive' → "Stress Load" (PSS-4)

import { Activity, Brain, Heart, Users, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { DomainKey, ScoreTier } from './types';

export interface DimensionMeta {
  readonly key: DomainKey;
  readonly name: string;
  readonly shortName: string;
  readonly icon: LucideIcon;
  readonly hexColor: string;
  readonly instrument: string;
  readonly instrumentFull: string;
  readonly description: string;
}

export const DIMENSION_META: Record<DomainKey, DimensionMeta> = {
  emotional: {
    key: 'emotional',
    name: 'Emotional Wellness',
    shortName: 'Emotional',
    icon: Heart,
    hexColor: '#F43F5E',
    instrument: 'PHQ-4',
    instrumentFull: 'Patient Health Questionnaire-4 (Depression & Anxiety)',
    description:
      'Measures mood stability, emotional regulation, capacity for joy, and levels of hope and optimism. Based on the PHQ-4, a validated screener for depression and anxiety symptoms.',
  },
  vitality: {
    key: 'vitality',
    name: 'Overall Wellbeing',
    shortName: 'Wellbeing',
    icon: Brain,
    hexColor: '#6366f1',
    instrument: 'WHO-5',
    instrumentFull: 'World Health Organization Well-Being Index (WHO-5)',
    description:
      'Assesses general psychological well-being, including cheerfulness, calm, energy, restfulness, and daily interest. The WHO-5 is one of the most widely used measures of subjective well-being.',
  },
  social: {
    key: 'social',
    name: 'Social Connection',
    shortName: 'Social',
    icon: Users,
    hexColor: '#ec4899',
    instrument: 'UCLA-3',
    instrumentFull: 'UCLA 3-Item Loneliness Scale',
    description:
      'Measures perceived social isolation, feelings of being left out, and lack of companionship. The UCLA Loneliness Scale is the gold standard for assessing loneliness in research and clinical settings.',
  },
  cognitive: {
    key: 'cognitive',
    name: 'Stress Load',
    shortName: 'Stress',
    icon: Zap,
    hexColor: '#f59e0b',
    instrument: 'PSS-4',
    instrumentFull: 'Perceived Stress Scale (PSS-4)',
    description:
      'Evaluates perceived stress levels, sense of control, confidence in handling problems, and whether difficulties feel manageable. The PSS-4 captures how stressful life feels rather than counting stressors.',
  },
  functioning: {
    key: 'functioning',
    name: 'Daily Functioning',
    shortName: 'Functioning',
    icon: Activity,
    hexColor: '#10b981',
    instrument: 'Custom',
    instrumentFull: 'WHODAS-adapted Daily Functioning Items',
    description:
      'Assesses how much symptoms interfere with daily life, relationships, responsibilities, and physical health. Adapted from the WHO Disability Assessment Schedule to capture functional impact.',
  },
};

/** Consistent iteration order for dimensions. */
export const DIMENSION_ORDER: readonly DomainKey[] = [
  'emotional',
  'vitality',
  'social',
  'cognitive',
  'functioning',
];

/** Tier for a per-dimension score (0–20). Boundaries mirror the composite proportionally. */
export function getDimensionTier(score: number): ScoreTier {
  if (score >= 16) return 'thriving';
  if (score >= 12) return 'balanced';
  if (score >= 8) return 'struggling';
  if (score >= 4) return 'distressed';
  return 'crisis';
}

const TIER_DISPLAY: Record<ScoreTier, string> = {
  thriving: 'Thriving',
  balanced: 'Balanced',
  struggling: 'Concerning',
  distressed: 'Distressed',
  crisis: 'Crisis',
};

/** Human-readable label for a dimension tier. */
export function getDimensionTierLabel(score: number): string {
  return TIER_DISPLAY[getDimensionTier(score)];
}
