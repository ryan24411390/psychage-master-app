// ============================================================================
// Psychage Evidence-Based Article Framework (PEAF) — Public API
// ============================================================================

// Constants
export {
  ARTICLE_TEMPLATES,
  ARTICLE_TYPE_OPTIONS,
  BLOCKED_SOURCE_DOMAINS,
  EXPANDED_SOURCE_TYPES,
  LEGACY_SOURCE_TYPE_MAP,
  QUALITY_GATE,
  SENSITIVITY_TERMS,
  SOURCE_TIERS,
  SOURCE_TYPE_TO_TIER,
} from "./constants";
// Content Architecture (15 Categories × 1,000 Articles)
export type { ClarityInstrument, ContentCategory } from "./content-architecture";
export {
  CONTENT_CATEGORIES,
  FOUNDATION_CATEGORIES,
  GAP_CLOSER_CATEGORIES,
  getCategoriesForCondition,
  getCategoriesForInstrument,
  getCategoryByNumber,
  getCategoryBySlug,
  TOTAL_ARTICLE_TARGET,
} from "./content-architecture";
// Quality Gate Engine
export { runQualityGate } from "./quality-gate";
// Readability
export { analyzeReadability } from "./readability";
// Types
export type {
  ArticleTemplate,
  ArticleType,
  EnhancedCitation,
  ExpandedSourceType,
  QualityCheck,
  QualityGateInput,
  QualityGateResult,
  ReadabilityResult,
  SensitivityFlag,
  SourceTier,
} from "./types";
