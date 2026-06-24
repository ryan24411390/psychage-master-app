// Search result model — pure, no React, no I/O, so the section logic is unit-
// testable directly and the FlashList can recycle by `kind` via getItemType.
//
// A resolved query produces three kinds of wayfinding target in a FIXED priority:
// categories → conditions → articles. They are flattened into one ordered row
// array where each section is preceded by a header row that exists ONLY when the
// section is non-empty (so a condition-only result renders just the Conditions
// header + its rows — no empty Categories/Guides scaffolding).
//
// Categories + conditions come from the discovery resolver (lib/discovery —
// the one blessed signal→content mapping); articles are fetched separately with
// a raised cap, so this module is the seam where the two meet.

import type { ArticleListItem } from '@/lib/articles';
import type { CategoryRef, ConditionRef } from '@/lib/discovery/types';

export type SearchRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'category'; key: string; ref: CategoryRef }
  | { kind: 'condition'; key: string; ref: ConditionRef }
  | { kind: 'article'; key: string; item: ArticleListItem };

export type SearchSections = {
  categories: readonly CategoryRef[];
  conditions: readonly ConditionRef[];
  articles: readonly ArticleListItem[];
};

export type SectionLabels = {
  categories: string;
  conditions: string;
  articles: string;
};

/**
 * Flatten resolved categories/conditions and the (separately fetched, cap-lifted)
 * article list into one ordered row array. Sections render in fixed priority —
 * categories, then conditions, then articles — and a section's header is present
 * iff that section has at least one item. Keys are namespaced per kind so a slug
 * shared across kinds (e.g. an 'anxiety' category and an 'anxiety' article) never
 * collides. No cap is applied here: every article passed in becomes a row.
 */
export function buildSearchRows(sections: SearchSections, labels: SectionLabels): SearchRow[] {
  const rows: SearchRow[] = [];

  if (sections.categories.length > 0) {
    rows.push({ kind: 'header', key: 'h-categories', title: labels.categories });
    for (const ref of sections.categories) {
      rows.push({ kind: 'category', key: `category:${ref.slug}`, ref });
    }
  }

  if (sections.conditions.length > 0) {
    rows.push({ kind: 'header', key: 'h-conditions', title: labels.conditions });
    for (const ref of sections.conditions) {
      rows.push({ kind: 'condition', key: `condition:${ref.id}`, ref });
    }
  }

  if (sections.articles.length > 0) {
    rows.push({ kind: 'header', key: 'h-articles', title: labels.articles });
    for (const item of sections.articles) {
      rows.push({ kind: 'article', key: `article:${item.slug}`, item });
    }
  }

  return rows;
}

/** True only when nothing resolved across all three kinds — drives the honest
 * "no results" state (distinct from loading/error). */
export function isEmptySections(sections: SearchSections): boolean {
  return (
    sections.categories.length === 0 &&
    sections.conditions.length === 0 &&
    sections.articles.length === 0
  );
}

/** The query a topic chip pre-fills. Live category names read like
 * "Anxiety, Stress & Overwhelm" — pre-filling the whole string would only
 * substring-match the category itself, so we take the salient head word
 * ("Anxiety"). That surfaces the category AND article-title matches AND the KB
 * condition. Falls back to the full trimmed name if no head word survives. */
export function chipQuery(categoryName: string): string {
  const trimmed = categoryName.trim();
  const head = trimmed.split(/\s*(?:,|&|\band\b)\s*/i)[0]?.trim() ?? '';
  return head.length >= 2 ? head : trimmed;
}
