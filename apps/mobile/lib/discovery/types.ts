// Discovery resolver — shared reference types.
//
// A *signal* is something the user expressed (an interest tag, a search query, a
// Symptom Navigator result). The resolver (./signal-map.ts) turns a signal into
// plain WAYFINDING targets — categories, conditions, and articles to OPEN. Every
// Ref is the minimal {id/slug, title, href} a UI needs to render a row and route
// on tap. Nothing here is clinical: no scores, no confidence, no symptom data
// (Sacred Rules 1/2/4 — this layer only points at content, never infers).

/** A browse category to open. `slug` is the deep-link id; `href` is its route. */
export interface CategoryRef {
  slug: string;
  title: string;
  href: string;
}

/** A condition reference to open. `id` is the Navigator KB condition id (e.g.
 * 'MDE', 'GAD'); `title` is the KB's own educational label; `href` is its owning
 * content-category page (or the `/conditions` index) — a live native route, NOT
 * the web-shaped KB guide_path. No diagnostic phrasing — labels are used verbatim. */
export interface ConditionRef {
  id: string;
  title: string;
  href: string;
}

/** An article to open. `slug` is the deep-link id -> /article/[slug]. */
export interface ArticleRef {
  slug: string;
  title: string;
  href: string;
}

/** What a resolved signal points at: the three kinds of content targets. Any
 * list may be empty — the resolver degrades to whatever it can reach and never
 * fabricates a target (e.g. a condition with no mapped category resolves to a
 * condition ref alone, with no articles). */
export interface SignalToContent {
  categories: CategoryRef[];
  conditions: ConditionRef[];
  articles: ArticleRef[];
}
