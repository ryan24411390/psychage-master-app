// Discovery signal -> content resolver — the ONE place a discovery signal becomes
// navigation targets. Interest-finder, search, Home rails, and Navigator
// wayfinding (all Wave 1) consume these three functions instead of each mapping
// signals to content independently.
//
// WAYFINDING ONLY (Sacred Rules 1/2/4). The resolver returns categories,
// conditions, and articles to OPEN. It performs no diagnosis, assigns no
// confidence, reads no symptom data, and emits nothing to telemetry. Ordering is
// allowed (cheap relevance for the UI); clinical scoring is not. The Navigator's
// 0.75 cap and on-device symptom state are not this module's concern and are
// never read into it — resolveNavigatorResult reads only condition_id + name.
//
// READ-only: composes the anon read-only repo (lib/articles/repo) + bundled
// in-code data (the Navigator KB and the PEAF content architecture). It writes
// nothing to MMKV or Supabase, persists nothing, and imports no React. Article
// reads are network I/O, so the functions are async; condition/category lookups
// are synchronous over bundled data.

import { categoryHref } from '@/features/learn/category-route';
import { NAVIGATOR_KB } from '@/features/navigator/knowledge-base';
import {
  listArticlesByCategorySlug,
  listArticlesByCategorySlugs,
  listPopulatedCategories,
  searchArticles,
} from '@/lib/articles/repo';
import type { ArticleCategory, ArticleListItem } from '@/lib/articles/types';
import { getCategoriesForCondition, getCategoryBySlug } from '@psychage/shared/peaf';
import type { ConditionWithMappings, NavigatorResults } from '@psychage/shared/navigator';

import type { ArticleRef, CategoryRef, ConditionRef, SignalToContent } from './types';

/** Cap on how many article refs any single signal returns — these feed compact
 * rails, not the full browse list. Categories/conditions are naturally small. */
const MAX_ARTICLE_REFS = 8;

/** Minimum query length, mirroring repo.searchArticles (a 1-char query is noise). */
const MIN_QUERY_LENGTH = 2;

/** Last-resort condition route when the KB carries no guide_path (does not occur
 * for live Navigator ids, which always exist in this KB) — the read-only A–Z
 * conditions reference. Never a fabricated deep link. */
const CONDITION_FALLBACK_HREF = '/reference';

/** Active KB conditions keyed by id, built once from the bundled (read-only) KB.
 * Pure data construction — no side effects. */
const KB_BY_ID: ReadonlyMap<string, ConditionWithMappings> = new Map<string, ConditionWithMappings>(
  NAVIGATOR_KB.conditions.filter((c) => c.is_active).map((c) => [c.id, c]),
);

function empty(): SignalToContent {
  return { categories: [], conditions: [], articles: [] };
}

function toArticleRef(a: ArticleListItem): ArticleRef {
  return { slug: a.slug, title: a.title, href: `/article/${a.slug}` };
}

function toConditionRef(c: ConditionWithMappings): ConditionRef {
  return { id: c.id, title: c.name, href: c.guide_path };
}

/** A CategoryRef for a slug + display title. Routes via the shared `categoryHref`
 * when the slug is a known content category; otherwise opens its plain article
 * list at /learn/[slug] (graceful when the live DB slug has no in-code twin). */
function categoryRef(slug: string, title: string): CategoryRef {
  const cc = getCategoryBySlug(slug);
  return { slug, title, href: cc ? categoryHref(cc) : `/learn/${slug}` };
}

/** Stable order: prefix matches before mere substring matches, original order
 * within a tier. Pure ordering — no scoring. Assumes items already filtered. */
function sortByPrefix<T>(items: readonly T[], needle: string, label: (t: T) => string): T[] {
  return items
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const ap = label(a.t).toLowerCase().startsWith(needle) ? 0 : 1;
      const bp = label(b.t).toLowerCase().startsWith(needle) ? 0 : 1;
      return ap !== bp ? ap - bp : a.i - b.i;
    })
    .map((x) => x.t);
}

/**
 * Interest tag -> content. The tag is an `article_categories.slug` (the
 * personalization store's `interests` are DB category slugs). Resolves to that
 * one category, any of its mapped Navigator conditions that exist in the KB, and
 * the newest articles in the category. Conditions whose ids have no KB entry
 * (the content-architecture <-> KB id namespaces only partly overlap) are dropped,
 * never fabricated.
 */
export async function resolveInterest(tag: string): Promise<SignalToContent> {
  const slug = tag.trim();
  if (!slug) return empty();

  const cc = getCategoryBySlug(slug);
  const categories: CategoryRef[] = [categoryRef(slug, cc?.name ?? slug)];

  const conditions: ConditionRef[] = [];
  const seen = new Set<string>();
  for (const id of cc?.navigatorConditions ?? []) {
    if (seen.has(id)) continue;
    const kb = KB_BY_ID.get(id);
    if (!kb) continue; // id namespace gap -> degrade, never fabricate
    seen.add(id);
    conditions.push(toConditionRef(kb));
  }

  const articles = (await listArticlesByCategorySlug(slug, 0))
    .slice(0, MAX_ARTICLE_REFS)
    .map(toArticleRef);

  return { categories, conditions, articles };
}

/**
 * Search query -> content. Matches the LIVE populated-category titles and the
 * bundled KB condition labels first (name / full_name, case-insensitive), then
 * the article corpus via repo.searchArticles. Ordering only — no clinical
 * scoring. Blank / single-char queries resolve to nothing.
 */
export async function resolveQuery(query: string): Promise<SignalToContent> {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return empty();

  const liveCats = await listPopulatedCategories();
  const matchedCats = liveCats.filter((c: ArticleCategory) => c.name.toLowerCase().includes(needle));
  const categories = sortByPrefix(matchedCats, needle, (c) => c.name).map((c) =>
    categoryRef(c.slug, c.name),
  );

  const matchedConds = NAVIGATOR_KB.conditions.filter(
    (c) =>
      c.is_active &&
      (c.name.toLowerCase().includes(needle) || c.full_name.toLowerCase().includes(needle)),
  );
  const conditions = sortByPrefix(matchedConds, needle, (c) => c.name).map(toConditionRef);

  const articles = (await searchArticles(query)).slice(0, MAX_ARTICLE_REFS).map(toArticleRef);

  return { categories, conditions, articles };
}

/**
 * Navigator result -> content. Reads ONLY `condition_id` + `name` off each result
 * item — relevance_score, relevance_level, and matched_symptoms are never read
 * into this layer (Sacred Rules 1/4). Each condition maps to its owning content
 * category/categories (`getCategoriesForCondition`), and articles resolve at
 * CATEGORY level: there is no populated article<->condition edge in native
 * (`linked_condition_ids` is unread and unpopulated), so condition->article
 * degrades to the category's articles by design — no per-condition link is
 * fabricated. Result order is preserved; output carries no score or symptom data.
 */
export async function resolveNavigatorResult(result: NavigatorResults): Promise<SignalToContent> {
  const conditions: ConditionRef[] = [];
  const seenCondition = new Set<string>();
  const categories: CategoryRef[] = [];
  const seenCategory = new Set<string>();

  for (const item of result.results) {
    const conditionId = item.condition_id;
    const owning = getCategoriesForCondition(conditionId);

    if (!seenCondition.has(conditionId)) {
      seenCondition.add(conditionId);
      const kb = KB_BY_ID.get(conditionId);
      const href =
        kb?.guide_path ?? (owning[0] ? categoryHref(owning[0]) : CONDITION_FALLBACK_HREF);
      conditions.push({ id: conditionId, title: item.name, href });
    }

    for (const cc of owning) {
      if (seenCategory.has(cc.slug)) continue;
      seenCategory.add(cc.slug);
      categories.push({ slug: cc.slug, title: cc.name, href: categoryHref(cc) });
    }
  }

  const slugs = categories.map((c) => c.slug);
  const articles = slugs.length
    ? (await listArticlesByCategorySlugs(slugs)).slice(0, MAX_ARTICLE_REFS).map(toArticleRef)
    : [];

  return { categories, conditions, articles };
}
