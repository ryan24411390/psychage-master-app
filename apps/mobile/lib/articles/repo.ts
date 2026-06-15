// Article repository — read-only queries against the shared Supabase, via the
// existing anon client (`getSupabaseClient`). Mirrors the web query shape
// (psychage-v2 articleService.getAll/getBySlug): published + non-empty content.
//
// Thin network glue, intentionally untested (the crisis layer follows the same
// split — the pure mapper carries the tested logic). Every function swallows
// errors and returns empty/null, so a screen treats "no client / offline /
// query error" as "no content available" and shows a fallback state — it never
// throws and never blocks crisis (SR / rules/offline.md posture).

import { getSupabaseClient } from '@/lib/supabase';

import {
  type DbArticleDetailRow,
  type DbArticleListRow,
  type DbCategoryRow,
  mapCategoryRow,
  mapDetailRow,
  mapListRow,
} from './mapper';
import type { ArticleCategory, ArticleDetail, ArticleListItem } from './types';

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
