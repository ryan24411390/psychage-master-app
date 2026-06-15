// Pure DB-row → mobile-model mappers (no I/O — unit-tested in isolation).
//
// SR/Rule #7: the article table has NO `description` column — read
// `seo_description`. Byline framing is fixed to the web's display values; the raw
// `author_name` field is never surfaced (the web overrides it to "Psychage Team").

import {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleDetail,
  type ArticleListItem,
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

export type DbArticleDetailRow = DbArticleListRow & {
  subtitle?: string | null;
  content?: string | null;
  content_format?: 'html' | 'markdown' | null;
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

export function mapDetailRow(row: DbArticleDetailRow): ArticleDetail {
  return {
    ...mapListRow(row),
    subtitle: row.subtitle ?? null,
    contentHtml: row.content ?? '',
    contentFormat: row.content_format ?? 'html',
    authorName: ARTICLE_AUTHOR_NAME,
    authorRole: ARTICLE_AUTHOR_ROLE,
  };
}
