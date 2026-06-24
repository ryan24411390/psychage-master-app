// Article repository — read-only queries against the shared Supabase, via the
// existing anon client (`getSupabaseClient`). Mirrors the web query shape
// (psychage-v2 articleService.getAll/getBySlug): published + non-empty content.
//
// Thin network glue, intentionally untested (the crisis layer follows the same
// split — the pure mapper carries the tested logic). Every function swallows
// errors and returns empty/null, so a screen treats "no client / offline /
// query error" as "no content available" and shows a fallback state — it never
// throws and never blocks crisis (SR / rules/offline.md posture).

import { getCategoryGroup } from '@psychage/shared/peaf';

import { getSupabaseClient } from '@/lib/supabase';

import {
  type DbArticleDetailRow,
  type DbArticleListRow,
  type DbCategoryRow,
  mapCategoryRow,
  mapDetailRow,
  mapListRow,
} from './mapper';
import { rankBySharedTags } from './ranking';
import type { ArticleCategory, ArticleDetail, ArticleListItem, BrowseCategory } from './types';

// List view needs an INNER join so the embedded category can be filtered by slug.
const LIST_FIELDS =
  'slug, title, seo_description, hero_image_url, read_time, tags, created_at, category:article_categories!category_id!inner(name, slug)';

// Detail embeds the references (reverse relation) so the reader renders them
// without a second round-trip; sorted client-side by sort_order in the mapper.
const DETAIL_FIELDS =
  'slug, title, subtitle, seo_description, hero_image_url, read_time, tags, created_at, content, content_format, category:article_categories!category_id(name, slug), article_citations(title, authors, year, url, doi, journal_name, tier, sort_order)';

// Taxonomy with an embedded PUBLISHED-article count per category. The count is
// scoped by the `articles.status` filter applied in the query below.
const CATEGORY_FIELDS = 'slug, name, icon, color, display_order, articles!category_id(count)';

/** Page size for the category article list — keeps each fetch small (FlashList
 * loads more on scroll), never bulk-fetching toward the full corpus. */
export const CATEGORY_PAGE_SIZE = 20;

/**
 * The browse taxonomy, read live from `article_categories` — only categories
 * that hold published articles, in the DB's `display_order`. One request; the
 * empty taxonomy twins (count 0) are dropped here, never hardcoded.
 */
export async function listPopulatedCategories(): Promise<ArticleCategory[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('article_categories')
      .select(CATEGORY_FIELDS)
      // Filters the embedded `articles(count)` to published rows only.
      .eq('articles.status', 'published')
      .order('display_order', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as DbCategoryRow[]).map(mapCategoryRow).filter((c) => c.articleCount > 0);
  } catch {
    return [];
  }
}

/**
 * The browse taxonomy augmented with a group label for ordering/display. Wraps
 * `listPopulatedCategories()` and maps each result through `getCategoryGroup()`
 * — only categories that hold published articles are returned (count > 0 gate
 * lives in `listPopulatedCategories`). Returns [] on any error.
 */
export async function listBrowseCategories(): Promise<BrowseCategory[]> {
  const cats = await listPopulatedCategories();
  return cats.map((c) => ({ ...c, group: getCategoryGroup(c.slug) }));
}

/**
 * Published, body-bearing articles in ONE category slug, newest first, one
 * page at a time (`page` is 0-based; pageSize defaults to CATEGORY_PAGE_SIZE).
 * Returns fewer than `pageSize` rows on the last page — the hook uses that to
 * stop paginating.
 */
export async function listArticlesByCategorySlug(
  slug: string,
  page: number,
  pageSize: number = CATEGORY_PAGE_SIZE,
): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb || !slug) return [];
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS)
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .eq('category.slug', slug)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}

/**
 * Published, body-bearing articles across an explicit SET of category slugs,
 * newest first (powers the Learn topic rails / browse grid, which group several
 * categories into one rail). Returns [] on empty input or any error.
 */
export async function listArticlesByCategorySlugs(
  slugs: readonly string[],
): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb || slugs.length === 0) return [];
  try {
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS)
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .in('category.slug', slugs as string[])
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}

/**
 * The newest published, body-bearing articles across the whole corpus, newest
 * first. Powers the Learn "Editor's pick" (limit 1) and "Most read" rail.
 *
 * STUB RANKING: there is no popularity/view-count signal in the corpus yet, so
 * "featured" and "most read" both rank by recency. Real ranking lands when an
 * analytics signal exists (CLAUDE.md §5 — analytics is an open decision). The
 * rows themselves are always real published articles — never fabricated.
 */
export async function listRecentArticles(limit: number): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb || limit <= 0) return [];
  try {
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS.replace('!inner', ''))
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}

/** One published article by slug, with its verbatim body + citations. `null` if absent. */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const sb = getSupabaseClient();
  if (!sb || !slug) return null;
  try {
    const { data, error } = await sb
      .from('articles')
      .select(DETAIL_FIELDS)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error || !data) return null;
    return mapDetailRow(data as unknown as DbArticleDetailRow);
  } catch {
    return null;
  }
}

/**
 * Editorially featured published articles, newest first (`featured` is a DB flag,
 * ~6 rows today). For a hub "Featured" rail. Empty on no-client/offline/error.
 */
export async function getFeatured(limit = 6): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS)
      .eq('status', 'published')
      .eq('featured', true)
      .not('content', 'is', null)
      .neq('content', '')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}

/**
 * Full-text-ish search over published articles: case-insensitive match on title
 * OR seo_description. Newest-first, capped. Empty/blank query returns []. The
 * term is escaped for the PostgREST `or` grammar (commas and parens would break
 * the filter string) and `%`/`_` are neutralised so a literal search can't turn
 * into a wildcard. Returns [] on any error — never throws (rules/offline posture).
 */
export async function searchArticles(query: string, limit = 40): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  const term = query.trim();
  if (!sb || term.length < 2) return [];
  // Neutralise PostgREST/LIKE metacharacters: %,_ become literals; ()/, would
  // break the or() filter string, so strip them.
  const safe = term.replace(/[%_]/g, '\\$&').replace(/[(),*]/g, ' ').trim();
  if (!safe) return [];
  try {
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS.replace('!inner', ''))
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .or(`title.ilike.%${safe}%,seo_description.ilike.%${safe}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}

/**
 * Up to `limit` articles to surface after a reader (web-parity heuristic): same
 * category first, ranked by tags shared with the source article, then a
 * newest-first backfill from other categories so small categories still fill the
 * rail. Excludes the current slug. Empty on no-client/offline/error.
 */
export async function getRelatedArticles(
  slug: string,
  categorySlug: string,
  tags: readonly string[] = [],
  limit = 3,
): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb || !slug || !categorySlug || limit <= 0) return [];
  try {
    // Same-category candidate window (newest first) for the tag ranker.
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS)
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .eq('category.slug', categorySlug)
      .neq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 4, 12));
    if (error) return [];
    const pool = (data ?? []).map((r) => mapListRow(r as unknown as DbArticleListRow));
    const sameCategory = rankBySharedTags(pool, tags).slice(0, limit);
    if (sameCategory.length >= limit) return sameCategory;

    // Backfill from other categories, excluding the current article and anything
    // already chosen (slugs are URL-safe — no escaping needed for the `in` list).
    const exclude = [slug, ...sameCategory.map((a) => a.slug)];
    const { data: more, error: moreError } = await sb
      .from('articles')
      .select(LIST_FIELDS)
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .neq('category.slug', categorySlug)
      .not('slug', 'in', `(${exclude.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(limit - sameCategory.length);
    if (moreError || !more) return sameCategory;
    const backfill = (more as unknown as DbArticleListRow[]).map(mapListRow);
    return [...sameCategory, ...backfill];
  } catch {
    return [];
  }
}

/**
 * Published articles for an explicit set of slugs (the saved/bookmarked set).
 * Order is NOT guaranteed by the DB — the caller re-sorts to its own order
 * (e.g. newest-saved-first). Returns [] on empty input or any error.
 */
export async function listArticlesBySlugs(slugs: readonly string[]): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb || slugs.length === 0) return [];
  try {
    const { data, error } = await sb
      .from('articles')
      .select(LIST_FIELDS.replace('!inner', ''))
      .eq('status', 'published')
      .in('slug', slugs as string[])
      .limit(1000);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}
