// Public surface for the Relationship Health feature. The pure-logic modules are
// the source of truth ported 1:1 from the web tool; UI imports from here.

export { computeResult } from './scoring';
export type { ComputedRelationshipResult } from './scoring';
export {
  computeAllDomainScores,
  computeAllSubDimensionScores,
  computeCompositeScore,
  computeDomainScore,
  computeFourHorsemen,
  computeSubDimensionScore,
  getTier,
} from './scoring';
export { getActiveQuestions, getDomainQuestions, getSubDimensionQuestions, QUESTIONS } from './questions';
export { detectPatterns } from './patterns';
export { checkDVSafety, checkSocialIsolation } from './alerts';
export { generateBlueprint } from './narrative';
export { getPatternInterventions, getTopInterventions, INTERVENTIONS } from './interventions';
export { FRAMEWORKS, getRelevantFrameworks } from './frameworks';
export { RelationshipResultStore } from './result-store';
export type { RelationshipAnomaly, RelationshipStoreDeps } from './result-store';
export * from './types';
