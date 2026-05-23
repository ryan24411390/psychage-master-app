// ============================================================================
// Symptom Navigator — Public API
// ============================================================================
//
// Mobile (apps/mobile) and web (psychage-v2, future) consume the navigator
// through this barrel. Deep imports into sibling modules are not part of
// the public surface (the package.json `exports` map only declares
// `./navigator`, `./peaf`, `./sensitivity`).
//
// Sacred Rule #1: CONFIDENCE_CAP is the 0.75 absolute ceiling. Sacred Rule
// #4: the engine accepts an `isTierEnabled` predicate so feature-flag
// adapters (expo-constants on mobile, import.meta.env on web) live in
// the consuming app, not here. See rules/conventions.md #3.

// Engine entry point
export { runSymptomNavigator } from './engine';

// Feature-flag DI seam
export {
  filterByFeatureFlags,
  getEnabledTiers,
  type IsTierEnabledFn,
} from './featureFlags';

// Safety screening
export { screenRedFlags } from './safety';

// Scoring primitives (lower-level access for tooling / future consumers)
export {
  calculateConditionScore,
  rankAndDiversify,
  scoreAllConditions,
} from './scoring';

// Utilities + display helpers
export {
  DEFAULT_MATCHING_CONFIG,
  NAVIGATOR_DISCLAIMER,
  PROHIBITED_PHRASES,
  combinedModifier,
  getDurationModifier,
  getFrequencyModifier,
  getRelevanceColor,
  getRelevanceLabel,
  getRelevanceLevel,
  getSeverityModifier,
  normalizeSymptoms,
} from './utils';

// Constants (Sacred Rule #1)
export { CONFIDENCE_CAP } from './constants';

// Defaults
export {
  SYMPTOM_DEFAULTS,
  SYMPTOM_DETAIL_UX_THRESHOLD,
} from './defaults';

// Step config (UI orchestration)
export {
  STEP_CONFIGS,
  getStepConfig,
  getStepNumber,
  getTotalSteps,
  isStepBefore,
  wouldJumpInvalidateData,
  type NavigatorStep,
  type StepConfig,
} from './stepConfig';

// Provider question generator
export { generateProviderQuestions } from './providerQuestions';

// Duration map (value re-export)
export { DURATION_TO_DAYS } from './types';

// Types
export type {
  AnalyticsEvent,
  AnalyticsEventType,
  Condition,
  ConditionCategory,
  ConditionProfile,
  ConditionRedFlag,
  ConditionScore,
  ConditionSymptomMapping,
  ConditionWithMappings,
  CrisisResource,
  CrisisResourceType,
  CrisisResourcesByRegion,
  DurationModifiers,
  FrequencyModifiers,
  KnowledgeBase,
  MatchedSymptomDetail,
  MatchingConfig,
  NavigatorResultItem,
  NavigatorResults,
  NormalizedSymptom,
  RedFlag,
  RedFlagLevel,
  RelevanceDisplayTiers,
  RelevanceLevel,
  ResultsConfig,
  SafetyConfig,
  SafetyResult,
  SavedResult,
  SaveResultsRequest,
  SavedResultsResponse,
  ScoringConfig,
  SeverityModifiers,
  Symptom,
  SymptomCategory,
  SymptomDomain,
  SymptomRole,
  UserDuration,
  UserFrequency,
  UserSymptomInput,
} from './types';
