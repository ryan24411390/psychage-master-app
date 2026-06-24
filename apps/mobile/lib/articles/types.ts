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

/** A populated browse category, read live from the `article_categories` taxonomy
 * (never hardcoded). `articleCount` is the count of PUBLISHED articles — the hub
 * lists only categories with count > 0. */
export type ArticleCategory = {
  slug: string;
  name: string;
  /** lucide icon name from the DB (e.g. "BookOpen"); may be absent. */
  icon: string | null;
  /** Accent hex from the DB; may be absent. */
  color: string | null;
  displayOrder: number;
  articleCount: number;
};

/** `ArticleCategory` augmented with a browse-presentation group label derived
 * from the clinical taxonomy. One of 'Conditions & Disorders', 'Behavior &
 * Wellness', or 'Life & Society'. Covers all DB categories, including the 18
 * that are not in the 30-entry reviewed-taxonomy constant. */
export type BrowseCategory = ArticleCategory & { group: string };

/** One reference backing an article (from `article_citations`), shown in the
 * reader's References section. Rendered verbatim — never paraphrased. */
export type Citation = {
  title: string;
  authors: readonly string[];
  year: number | null;
  url: string | null;
  doi: string | null;
  journalName: string | null;
  tier: number | null;
  sortOrder: number;
};

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

/** Full article — adds the verbatim body + byline + citations for the reader. */
export type ArticleDetail = ArticleListItem & {
  subtitle: string | null;
  /** Verbatim clinician-reviewed body, as stored on the web (never altered). */
  contentHtml: string;
  contentFormat: 'html' | 'markdown';
  /** Author display name (see ARTICLE_AUTHOR_NAME). */
  authorName: string;
  authorRole: string;
  /** References, sorted by sort_order. Empty when the article cites nothing. */
  citations: readonly Citation[];
};
