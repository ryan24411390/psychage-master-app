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

import { type DbArticleDetailRow, type DbArticleListRow, mapDetailRow, mapListRow } from './mapper';
import type { ArticleDetail, ArticleListItem } from './types';

// List view needs an INNER join so the embedded category can be filtered by slug.
const LIST_FIELDS =
  'slug, title, seo_description, hero_image_url, read_time, tags, created_at, category:article_categories!category_id!inner(name, slug)';

const DETAIL_FIELDS =
  'slug, title, subtitle, seo_description, hero_image_url, read_time, tags, created_at, content, content_format, category:article_categories!category_id(name, slug)';

/**
 * Published, body-bearing articles across one or more category slugs, newest
 * first. Supabase caps one response at 1000 rows; the largest curated card spans
 * ~600 articles, so a single page is sufficient (no pagination needed here).
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

/** One published article by slug, with its verbatim body. `null` if absent. */
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
