// ⚠️ CT4 / CLINICAL FIXTURE — NOT SHIPPABLE. ⚠️
//
// A clearly-labeled placeholder KnowledgeBase so the Navigator FLOW + the real shared
// engine run end-to-end on-device. Every symptom name, condition, description, weight,
// and the severity/red-flag mapping is DUMMY content awaiting clinical authoring +
// CT4 copy review. The ENGINE (scoring, cap, red-flag screen) is the frozen shared
// package; this file is only its data input. Replace wholesale when the real KB lands.
//
// Structural (the build): one symptom carries an inherent CRISIS red flag so a selection
// of it drives the engine's `safety.should_halt` (the "severity-flagged selection also
// halts" rule). The 75% cap is the engine's CONFIDENCE_CAP — not set here.

import type {
  ConditionWithMappings,
  KnowledgeBase,
  Symptom,
  SymptomCategory,
  SymptomDomain,
  SymptomRole,
} from '@psychage/shared/navigator';
import { DEFAULT_MATCHING_CONFIG } from '@psychage/shared/navigator';

function sym(
  id: string,
  name: string,
  domain: SymptomDomain,
  category: SymptomCategory,
  display_order: number,
  crisis = false,
): Symptom {
  return {
    id,
    domain,
    category,
    name,
    description: '',
    synonyms: [],
    ask_duration: true,
    ask_severity: true,
    ask_frequency: true,
    is_red_flag: crisis,
    red_flag_level: crisis ? 'CRISIS' : null,
    severity_red_flag_threshold: null,
    severity_red_flag_level: null,
    display_order,
    is_active: true,
    version: '1.0.0',
  };
}

const SYMPTOMS: Symptom[] = [
  // Mind (emotional / cognitive)
  sym('low_mood', 'Low mood', 'emotional', 'mood', 1),
  sym('lost_interest', 'Lost interest in things', 'emotional', 'mood', 2),
  sym('worry', 'Constant worry', 'emotional', 'anxiety_fear', 3),
  sym('poor_focus', 'Hard to concentrate', 'cognitive', 'cognition', 4),
  sym('on_edge', 'Easily irritated or on edge', 'emotional', 'emotional_regulation', 5),
  // CRISIS-flagged selection (drives the engine halt). FIXTURE — clinical review owns
  // whether/how this surfaces as a tappable item.
  sym('unsafe_thoughts', 'Thoughts of harming yourself', 'emotional', 'mood', 99, true),
  // Body (physical, non-sleep)
  sym('low_energy', 'Low energy or tiredness', 'physical', 'energy', 1),
  sym('appetite', 'Appetite has changed', 'physical', 'appetite_weight', 2),
  sym('restless', 'Restless or tense body', 'physical', 'body_sensations', 3),
  // Sleep
  sym('cant_sleep', 'Trouble falling or staying asleep', 'physical', 'sleep', 1),
  sym('oversleep', 'Sleeping much more than usual', 'physical', 'sleep', 2),
];

function map(symptom_id: string, weight: 1 | 2 | 3, role: SymptomRole) {
  return { symptom_id, weight, role };
}

function condition(
  id: string,
  name: string,
  full_name: string,
  category: ConditionWithMappings['category'],
  description_for_user: string,
  symptom_mappings: ConditionWithMappings['symptom_mappings'],
): ConditionWithMappings {
  return {
    id,
    name,
    full_name,
    category,
    description_for_user,
    minimum_duration: '2_weeks',
    minimum_duration_display: 'about two weeks',
    minimum_symptoms_for_relevance: 2,
    always_recommend_professional: false,
    guide_path: '',
    coping_path: '',
    provider_questions: [],
    clinical_notes: '',
    is_active: true,
    version: '1.0.0',
    symptom_mappings,
    red_flags: [],
  };
}

const CONDITIONS: ConditionWithMappings[] = [
  condition(
    'low_mood_pattern',
    'Ongoing low mood',
    'Depression',
    'mood',
    'Long stretches of low mood and lost interest are common. They can ease with support.',
    [
      map('low_mood', 3, 'core'),
      map('lost_interest', 3, 'core'),
      map('low_energy', 2, 'common'),
      map('poor_focus', 2, 'common'),
      map('appetite', 1, 'associated'),
      map('cant_sleep', 1, 'associated'),
    ],
  ),
  condition(
    'worry_pattern',
    'Constant worry',
    'Generalised anxiety',
    'anxiety',
    'Worry that is hard to switch off is common. It often eases with the right support.',
    [
      map('worry', 3, 'core'),
      map('restless', 2, 'common'),
      map('poor_focus', 2, 'common'),
      map('on_edge', 2, 'common'),
      map('cant_sleep', 1, 'associated'),
    ],
  ),
  condition(
    'sleep_pattern',
    'Trouble sleeping',
    'Insomnia',
    'sleep',
    'Nights of broken or missing sleep are common. They often improve over time.',
    [
      map('cant_sleep', 3, 'core'),
      map('low_energy', 2, 'common'),
      map('poor_focus', 1, 'associated'),
    ],
  ),
];

export const NAVIGATOR_KB: KnowledgeBase = {
  version: '1.0.0-fixture',
  symptoms: SYMPTOMS,
  conditions: CONDITIONS,
  matchingConfig: {
    ...DEFAULT_MATCHING_CONFIG,
    // Closed relevance vocabulary (Possible · Likely · Strong match). The cap is the
    // engine's CONFIDENCE_CAP (0.75) — these labels are rendered as TEXT, never numbers.
    relevance_display_tiers: {
      high: { min: 0.45, label: 'Strong match', color: '#1A9B8C' },
      moderate: { min: 0.25, label: 'Likely', color: '#1A9B8C' },
      low: { min: 0.12, label: 'Possible', color: '#1A9B8C' },
      minimal: { min: 0, label: 'Possible', color: '#1A9B8C' },
    },
  },
  // S17 reuses the crisis surface's own components (emergency button + helplines), not
  // the engine's CrisisResource list — so this can stay empty.
  crisisResources: {},
};
