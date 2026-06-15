// Pure DB-row → mobile-model mappers (no I/O — unit-tested in isolation).
//
// SR/Rule #7: the article table has NO `description` column — read
// `seo_description`. Byline framing is fixed to the web's display values; the raw
// `author_name` field is never surfaced (the web overrides it to "Psychage Team").

import {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleCategory,
  type ArticleDetail,
  type ArticleListItem,
  type Citation,
} from './types';

type DbCategory = { name?: string | null; slug?: string | null } | null;

export type DbArticleListRow = {
  slug: string;
  title: string;
  seo_description?: string | null;
  hero_image_url?: string | null;
  read_time?: number | null;
  tags?: string[] | null;
  created_at: string;
  // Supabase embeds a to-one relation as an object, but defend against the
  // array form some PostgREST shapes return.
  category?: DbCategory | DbCategory[];
};

export type DbCitationRow = {
  title: string;
  authors?: string[] | null;
  year?: number | null;
  url?: string | null;
  doi?: string | null;
  journal_name?: string | null;
  tier?: number | null;
  sort_order?: number | null;
};

export type DbArticleDetailRow = DbArticleListRow & {
  subtitle?: string | null;
  content?: string | null;
  content_format?: 'html' | 'markdown' | null;
  // Embedded reverse relation (article_citations.article_id → articles.id).
  article_citations?: DbCitationRow[] | null;
};

export type DbCategoryRow = {
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  display_order?: number | null;
  // Embedded aggregate: published-article count for this category.
  articles?: { count: number }[] | null;
};

function pickCategory(category: DbArticleListRow['category']): {
  name: string;
  slug: string;
} {
  const c = Array.isArray(category) ? category[0] : category;
  return { name: c?.name ?? 'Uncategorized', slug: c?.slug ?? '' };
}

export function mapListRow(row: DbArticleListRow): ArticleListItem {
  const cat = pickCategory(row.category);
  return {
    slug: row.slug,
    title: row.title,
    seoDescription: row.seo_description ?? '',
    heroImageUrl: row.hero_image_url ?? null,
    readTime: row.read_time ?? null,
    tags: row.tags ?? [],
    categoryName: cat.name,
    categorySlug: cat.slug,
    createdAt: row.created_at,
  };
}

export function mapCitation(row: DbCitationRow): Citation {
  return {
    title: row.title,
    authors: row.authors ?? [],
    year: row.year ?? null,
    url: row.url ?? null,
    doi: row.doi ?? null,
    journalName: row.journal_name ?? null,
    tier: row.tier ?? null,
    sortOrder: row.sort_order ?? 0,
  };
}

export function mapDetailRow(row: DbArticleDetailRow): ArticleDetail {
  const citations = (row.article_citations ?? [])
    .map(mapCitation)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    ...mapListRow(row),
    subtitle: row.subtitle ?? null,
    contentHtml: row.content ?? '',
    contentFormat: row.content_format ?? 'html',
    authorName: ARTICLE_AUTHOR_NAME,
    authorRole: ARTICLE_AUTHOR_ROLE,
    citations,
  };
}

/** Populated-only mapping is the caller's job; this maps one taxonomy row. The
 * embedded `articles(count)` reflects the PUBLISHED filter applied in the query. */
export function mapCategoryRow(row: DbCategoryRow): ArticleCategory {
  return {
    slug: row.slug,
    name: row.name,
    icon: row.icon ?? null,
    color: row.color ?? null,
    displayOrder: row.display_order ?? 0,
    articleCount: row.articles?.[0]?.count ?? 0,
  };
}
