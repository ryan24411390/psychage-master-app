// Conditions library — pure selection logic over the reviewed content taxonomy.
//
// NO clinical judgement is made here. "Which categories are conditions?" is read
// straight from the reviewed taxonomy: a category is condition-focused iff it
// maps to one or more Symptom Navigator condition profiles
// (`navigatorConditions.length > 0`). That mapping was authored in
// `packages/shared/peaf/content-architecture.ts` ("Prepared for Dr. Lena
// Dobson"), not invented in this layer. Wellness/skills categories with an empty
// `navigatorConditions` list (emotional-regulation, habits, digital-life,
// cultural-global, therapy-navigation, aging-dementia, technology, creativity,
// applied-life-skills, spirituality) are excluded.
//
// Order is the FIXED taxonomy order (category number 1..N) — never sorted,
// personalized, or ranked. `.filter` preserves source order.

import type { ContentCategory } from '@psychage/shared/peaf';
import { CONTENT_CATEGORIES, getCategoryByNumber, getCategoryBySlug } from '@psychage/shared/peaf';

import { getConditionSubTopics, getConditionSummary } from './data/condition-summaries';
import type { ConditionCategory, ConditionDetail } from './types';

/** True iff the reviewed taxonomy maps this category to ≥1 Navigator condition. */
function isConditionFocused(category: ContentCategory): boolean {
  return category.navigatorConditions.length > 0;
}

/** NAME + slug only — never copies description/researchBasis/platformRole (those
 * are internal architecture notes, not user-facing reviewed copy). */
function toCategory(category: ContentCategory): ConditionCategory {
  return { slug: category.slug, name: category.name };
}

/** The condition-focused topics, in fixed taxonomy order. */
export function selectConditionCategories(
  categories: readonly ContentCategory[] = CONTENT_CATEGORIES,
): ConditionCategory[] {
  return categories.filter(isConditionFocused).map(toCategory);
}

/**
 * Resolve one condition-focused topic by slug, with its related (also
 * condition-focused) topics for cross-navigation. Returns `null` when the slug
 * is unknown OR resolves to a non-condition category — the route then renders a
 * safe "not found" fallback rather than exposing a wellness topic here.
 */
export function selectConditionDetail(slug: string): ConditionDetail | null {
  const category = getCategoryBySlug(slug);
  if (!category || !isConditionFocused(category)) return null;

  const related = category.relatedCategories
    .map((n) => getCategoryByNumber(n))
    .filter((c): c is ContentCategory => c != null && isConditionFocused(c))
    .map(toCategory);

  // Verbatim reviewed summary (or null) + sub-topic outline — never authored here.
  return {
    ...toCategory(category),
    summary: getConditionSummary(slug),
    subTopics: getConditionSubTopics(slug),
    related,
  };
}
