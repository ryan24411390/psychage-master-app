import type { ContentCategory } from '@psychage/shared/peaf';

// Where a content category (from @psychage/shared/peaf) opens when browsed from the
// "all categories" list. Condition-focused categories (≥1 Navigator condition) have a
// reviewed overview at /conditions/[slug] (ConditionDetailView). Wellness-only
// categories have NO condition overview — selectConditionDetail returns null for them,
// so /conditions/[slug] would dead-end — they open their plain article list at
// /learn/[slug] instead (CategoryArticlesView's raw-slug branch). Both keep all 30
// categories reachable (P19).
export function categoryHref(cat: ContentCategory): string {
  return cat.navigatorConditions.length > 0 ? `/conditions/${cat.slug}` : `/learn/${cat.slug}`;
}

// Slug-keyed routing for a Browse topic card. Every topic opens its article list
// at /learn/[slug] (CategoryArticlesView), matching web — a topic tap lands
// directly on the category's articles with no intermediate overview. The "What
// this covers" overview still lives at /conditions/[slug] (ConditionDetailView),
// reached from Navigator results wayfinding (categoryHref) and the Conditions
// library — just not from a topic card.
export function categoryHrefBySlug(slug: string): string {
  return `/learn/${slug}`;
}
