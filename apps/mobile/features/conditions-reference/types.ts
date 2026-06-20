// Conditions reference — ICD-11 Chapter 6 standalone entity (the A–Z reference).
//
// VENDORED from psychage-v2 `src/types/condition.ts` — the web owns this contract;
// keep this file byte-faithful to it (do not hand-edit the shape). Mobile reads the
// SAME shared Supabase `conditions` table the web reads (read-only). This is NOT the
// Symptom Navigator and is NOT the 30 article categories — a flat, A–Z + ICD-11-family
// reference. Plain-language copy is authored on the web for clinical review and stored
// as `verification_status = 'unverified'`; the public surface renders verified rows
// only (gate mirrored in queries.ts → applyGate, exactly as the web service does).

export type VerificationStatus = 'unverified' | 'verified';

/**
 * A condition row as fetched. snake_case mirrors the Supabase columns so rows can be
 * used directly without remapping.
 */
export interface Condition {
  id?: string;
  slug: string;
  name: string;
  icd11_code: string;
  icd11_grouping: string;
  /** "What it is" — one or two plain sentences. */
  short_definition: string | null;
  /** "What it feels like" — lived, third-person, non-diagnostic. */
  what_it_feels_like: string | null;
  /** "How it differs" — distinguishes from its closest siblings. */
  how_it_differs: string | null;
  /** "When it's more than the everyday" — the threshold, framed as common-not-normal. */
  when_more_than_everyday: string | null;
  /** Clinical decision left for review. Surfaces crisis support prominently when true. */
  crisis_flag: boolean;
  /** Source basis, e.g. "ICD-11 6B00 / DSM-5-TR GAD". */
  provenance: string | null;
  verification_status: VerificationStatus;
  reading_level: string;
}

/** The four authored definition fields, in display order. */
export const DEFINITION_FIELDS = [
  'short_definition',
  'what_it_feels_like',
  'how_it_differs',
  'when_more_than_everyday',
] as const;

export type DefinitionField = (typeof DEFINITION_FIELDS)[number];

/** Human labels for the four definition fields (from the web contract's field docs). */
export const DEFINITION_FIELD_LABELS: Record<DefinitionField, string> = {
  short_definition: 'What it is',
  what_it_feels_like: 'What it feels like',
  how_it_differs: 'How it differs',
  when_more_than_everyday: "When it's more than the everyday",
};

/** True when at least one of the four authored definition fields has content. */
export function hasDefinition(condition: Pick<Condition, DefinitionField>): boolean {
  return DEFINITION_FIELDS.some((field) => {
    const value = condition[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

/** The fixed educational disclaimer, shown verbatim on every condition page. */
export const CONDITION_DISCLAIMER =
  'Educational, not a diagnosis or a substitute for professional care.';
