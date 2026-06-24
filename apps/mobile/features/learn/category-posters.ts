// Category pictogram poster URLs (Supabase public storage).
//
// Each content category has a "wayfinding clay" pictogram poster — the category
// name baked in — stored at `article-images/category-covers/{canonical-slug}.jpeg`.
// The web app already wires these (src/config/categoryPosters.ts →
// categoryService.getGrouped()); this mirrors the same manifest for the mobile
// category cards (TopicTile, BrowseView). ArtPanel renders the poster as the card
// visual and falls back to its token gradient when a poster is genuinely missing.
//
// Only the slugs below have a generated poster today. Orphan categories (no poster
// yet) resolve to `null` here → ArtPanel keeps its gradient → no broken image, no
// wasted 400 fetch. Keep this set in sync with the web manifest when posters are
// (re)generated.

/** Canonical taxonomy slugs that have a poster in storage. Mirrors web `CATEGORY_POSTERS`. */
const CATEGORY_POSTER_SLUGS: ReadonlySet<string> = new Set([
  'anxiety-stress',
  'depression-grief',
  'trauma-healing',
  'mental-health-conditions',
  'psychosis-schizophrenia',
  'neurodivergence-adhd-autism',
  'eating-body',
  'chronic-illness-pain',
  'aging-dementia-late-life',
  'emotional-regulation',
  'habits-behavior-change',
  'sleep-body-connection',
  'self-worth-identity',
  'therapy-navigation',
  'creativity-therapeutic-arts',
  'life-skills-practical-psychology',
  'sports-exercise-psychology',
  'relationships-communication',
  'work-productivity',
  'loneliness-connection',
  'digital-life',
  'technology-digital-life',
  'cultural-global',
  'womens-mental-health',
  'mens-mental-health',
  'environmental-eco-psychology',
  'spirituality-meaning',
  'financial-wellness',
]);

/**
 * Public URL for a category's pictogram poster, or `null` when the slug has no
 * poster (orphan category) or Supabase is unconfigured. A `null` return tells
 * ArtPanel to keep its gradient. The base is read inline so Expo can statically
 * inline `EXPO_PUBLIC_SUPABASE_URL` at build (mirrors lib/supabase.ts).
 */
export function categoryPosterUrl(slug: string | null | undefined): string | null {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!slug || !base || !CATEGORY_POSTER_SLUGS.has(slug)) return null;
  return `${base}/storage/v1/object/public/article-images/category-covers/${slug}.jpeg`;
}

// Curated Learn-card id → the canonical poster slug whose pictogram represents it.
// LEARN_CATEGORIES ids are editorial groupings; their `slugs[]` are partly legacy
// (`relationships-social` / `depression-mood` / `workplace-academic`) and carry no
// poster, so the representative canonical slug is named explicitly here. `more` is
// the catch-all with no single poster → gradient.
const TOPIC_POSTER_SLUG: Readonly<Record<string, string>> = {
  anxiety: 'anxiety-stress',
  sleep: 'sleep-body-connection',
  relationships: 'relationships-communication',
  mood: 'depression-grief',
  focus: 'work-productivity',
};

/** Canonical poster slug for a curated Learn-card id, or `undefined` (→ gradient). */
export function posterSlugForTopic(topicId: string): string | undefined {
  return TOPIC_POSTER_SLUG[topicId];
}
