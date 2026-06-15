// Conditions library — view-model types.
//
// SCOPE (bucket-a, structure-only): this feature is a BROWSE layer over the
// already-reviewed content taxonomy (`@psychage/shared/peaf` CONTENT_CATEGORIES,
// "Prepared for Dr. Lena Dobson"). It surfaces category NAMES + slugs and routes
// into the existing real-content surfaces (the Library WebView, the article
// reader). It authors NO condition descriptions, symptom lists, or clinical copy
// — per-condition user-facing summaries are a separate, clinical-review-gated
// scope (see docs/feature-discovery.md, bucket b). It is NOT a diagnostic flow
// (SR-3); symptom checking lives only in the Symptom Navigator.

/** A condition-focused topic, projected from the reviewed taxonomy. NAME + slug
 * only — no authored clinical text rides on this shape. */
export type ConditionCategory = {
  /** Reviewed taxonomy slug (matches the web `article_categories.slug`). */
  slug: string;
  /** Reviewed, user-facing category name, verbatim from the taxonomy. */
  name: string;
};

/** Detail view-model: a condition category, the verbatim reviewed topic summary
 * (sourced from the web — see data/condition-summaries.ts; `null` when none is
 * ported), and the names of its related, also-condition-focused topics. */
export type ConditionDetail = ConditionCategory & {
  summary: string | null;
  /** Verbatim reviewed sub-topic outline ("what this covers"); `[]` if none ported. */
  subTopics: readonly string[];
  related: ConditionCategory[];
};
