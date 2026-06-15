// Article data-layer types — the mobile-side shape of the shared Supabase
// `public.articles` corpus (read-only; ARCHITECTURE.md §1 unidirectional read).
//
// Education content only — never personal/assessment data, so it is fetched live
// (no MMKV persistence; offline reading is a deferred scope per CLAUDE.md §5).

/** Author byline — FIXED display values, mirroring exactly what the web shows for
 * Supabase-sourced articles (psychage-v2 ArticlePage defaults; the raw DB
 * `author_name` is deliberately NOT surfaced — the web overrides it). */
export const ARTICLE_AUTHOR_NAME = 'Psychage Team';
export const ARTICLE_AUTHOR_ROLE = 'Editor';

/** List-row projection — the fields the browse list needs (no body). */
export type ArticleListItem = {
  slug: string;
  title: string;
  seoDescription: string;
  heroImageUrl: string | null;
  readTime: number | null;
  tags: readonly string[];
  categoryName: string;
  categorySlug: string;
  createdAt: string;
};

/** Full article — adds the verbatim body + byline for the native reader. */
export type ArticleDetail = ArticleListItem & {
  subtitle: string | null;
  /** Verbatim clinician-reviewed body, as stored on the web (never altered). */
  contentHtml: string;
  contentFormat: 'html' | 'markdown';
  /** Author display name (see ARTICLE_AUTHOR_NAME). */
  authorName: string;
  authorRole: string;
};
