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
import { rankBySharedTags } from './ranking';
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
