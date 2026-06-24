import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ONLY the anon read-only article repo (the network seam). The Navigator KB
// and the PEAF content architecture run REAL (bundled, synchronous) so the
// signal→content edges are exercised against the shipping data.
vi.mock('@/lib/articles/repo', () => ({
  listArticlesByCategorySlug: vi.fn(),
  listArticlesByCategorySlugs: vi.fn(),
  listPopulatedCategories: vi.fn(),
  searchArticles: vi.fn(),
}));

import {
  listArticlesByCategorySlug,
  listArticlesByCategorySlugs,
  listPopulatedCategories,
  searchArticles,
} from '@/lib/articles/repo';
import { resolveInterest, resolveNavigatorResult, resolveQuery } from '@/lib/discovery/signal-map';
import type { ArticleCategory, ArticleListItem } from '@/lib/articles/types';
import type { NavigatorResults } from '@psychage/shared/navigator';

const mockByCat = vi.mocked(listArticlesByCategorySlug);
const mockByCats = vi.mocked(listArticlesByCategorySlugs);
const mockCats = vi.mocked(listPopulatedCategories);
const mockSearch = vi.mocked(searchArticles);

/** Minimal published-article projection for the resolver to map. */
function article(slug: string): ArticleListItem {
  return {
    slug,
    title: `Title ${slug}`,
    seoDescription: '',
    heroImageUrl: null,
    readTime: null,
    tags: [],
    categoryName: '',
    categorySlug: '',
    createdAt: '2026-01-01',
  };
}

function category(slug: string, name: string): ArticleCategory {
  return { slug, name, icon: null, color: null, displayOrder: 0, articleCount: 1 };
}

/** A Navigator result carrying clinical fields the resolver must IGNORE. Cast —
 * the resolver reads only `results[].condition_id` + `.name`. */
function navResult(items: Array<{ condition_id: string; name: string }>): NavigatorResults {
  return {
    results: items.map((i) => ({
      ...i,
      relevance_score: 0.71,
      relevance_level: 'high',
      matched_symptoms: [{ name: 'Persistent sadness', role: 'core' }],
    })),
  } as unknown as NavigatorResults;
}

beforeEach(() => {
  mockByCat.mockReset().mockResolvedValue([]);
  mockByCats.mockReset().mockResolvedValue([]);
  mockCats.mockReset().mockResolvedValue([]);
  mockSearch.mockReset().mockResolvedValue([]);
});

describe('resolveInterest — interest tag → category + mapped conditions + articles', () => {
  it('resolves a category slug to its category, KB-known conditions, and articles', async () => {
    mockByCat.mockResolvedValue([article('a1'), article('a2')]);

    const out = await resolveInterest('anxiety-stress');

    // Category: in-code title + condition-route href.
    expect(out.categories).toEqual([
      { slug: 'anxiety-stress', title: 'Anxiety, Stress & Overwhelm', href: '/conditions/anxiety-stress' },
    ]);
    // Conditions: only ids that exist in the KB (GAD, ADJ). The content-architecture
    // ids SOC_ANX / PAN_DIS / PHO have no KB entry and are dropped, NOT fabricated.
    const ids = out.conditions.map((c) => c.id);
    expect(ids).toContain('GAD');
    expect(ids).not.toContain('SOC_ANX');
    expect(ids).not.toContain('PAN_DIS');
    expect(out.conditions.find((c) => c.id === 'GAD')).toEqual({
      id: 'GAD',
      title: 'Generalized Anxiety',
      href: expect.stringMatching(/^\//),
    });
    // Articles: mapped to /article/[slug], fetched for the tag (page 0).
    expect(out.articles.map((a) => a.href)).toEqual(['/article/a1', '/article/a2']);
    expect(mockByCat).toHaveBeenCalledWith('anxiety-stress', 0);
  });

  it('degrades for an unknown DB slug — category still routes, no conditions, no throw', async () => {
    mockByCat.mockResolvedValue([article('x1')]);

    const out = await resolveInterest('some-db-only-slug');

    expect(out.categories).toEqual([
      { slug: 'some-db-only-slug', title: 'some-db-only-slug', href: '/learn/some-db-only-slug' },
    ]);
    expect(out.conditions).toEqual([]);
    expect(out.articles).toEqual([{ slug: 'x1', title: 'Title x1', href: '/article/x1' }]);
  });
});

describe('resolveQuery — query → matching categories + conditions + articles', () => {
  it('"anxiety" matches the anxiety category, GAD/SAD conditions, and search results', async () => {
    mockCats.mockResolvedValue([
      category('anxiety-stress', 'Anxiety, Stress & Overwhelm'),
      category('depression-grief', 'Depression, Grief & Loss'),
    ]);
    mockSearch.mockResolvedValue([article('q1')]);

    const out = await resolveQuery('anxiety');

    // Only the category whose title contains the term.
    expect(out.categories.map((c) => c.slug)).toEqual(['anxiety-stress']);
    // KB conditions whose name/full_name contains "anxiety".
    const ids = out.conditions.map((c) => c.id);
    expect(ids).toContain('GAD'); // Generalized Anxiety
    expect(ids).toContain('SAD'); // Social Anxiety
    // Articles via the real search seam.
    expect(out.articles).toEqual([{ slug: 'q1', title: 'Title q1', href: '/article/q1' }]);
    expect(mockSearch).toHaveBeenCalledWith('anxiety');
  });

  it('returns nothing and touches no repo for a sub-2-char query', async () => {
    const out = await resolveQuery('a');
    expect(out).toEqual({ categories: [], conditions: [], articles: [] });
    expect(mockCats).not.toHaveBeenCalled();
    expect(mockSearch).not.toHaveBeenCalled();
  });
});

describe('resolveNavigatorResult — conditions → categories → category-level articles', () => {
  it('maps a mapped condition (MDE) to its categories + articles, leaking no clinical data', async () => {
    mockByCats.mockResolvedValue([article('n1')]);

    const out = await resolveNavigatorResult(navResult([{ condition_id: 'MDE', name: 'Depression' }]));

    expect(out.conditions).toEqual([
      { id: 'MDE', title: 'Depression', href: '/learn/conditions/depression' },
    ]);
    // MDE belongs to depression-grief (among others) via getCategoriesForCondition.
    expect(out.categories.map((c) => c.slug)).toContain('depression-grief');
    // Articles resolve at CATEGORY level over the owning category slugs.
    expect(out.articles).toEqual([{ slug: 'n1', title: 'Title n1', href: '/article/n1' }]);
    expect(mockByCats).toHaveBeenCalledTimes(1);
    expect(mockByCats.mock.calls[0]?.[0]).toContain('depression-grief');

    // No clinical fields anywhere in the output (SR-1/SR-4).
    const serialized = JSON.stringify(out);
    expect(serialized).not.toContain('relevance_score');
    expect(serialized).not.toContain('relevance_level');
    expect(serialized).not.toContain('matched_symptoms');
    expect(serialized).not.toContain('0.71');
    expect(serialized).not.toContain('Persistent sadness');
  });

  it('degrades to condition-only when the condition maps to no category (no fabricated links)', async () => {
    // SAD exists in the KB but no content category lists it (id namespace gap).
    const out = await resolveNavigatorResult(navResult([{ condition_id: 'SAD', name: 'Social Anxiety' }]));

    expect(out.conditions.map((c) => c.id)).toEqual(['SAD']);
    expect(out.conditions.find((c) => c.id === 'SAD')?.href).toMatch(/^\//);
    expect(out.categories).toEqual([]);
    expect(out.articles).toEqual([]);
    // No category slugs → the article seam is never queried.
    expect(mockByCats).not.toHaveBeenCalled();
  });

  it('preserves order and dedupes repeated conditions/categories', async () => {
    mockByCats.mockResolvedValue([]);
    const out = await resolveNavigatorResult(
      navResult([
        { condition_id: 'MDE', name: 'Depression' },
        { condition_id: 'MDE', name: 'Depression' },
        { condition_id: 'GAD', name: 'Generalized Anxiety' },
      ]),
    );
    expect(out.conditions.map((c) => c.id)).toEqual(['MDE', 'GAD']);
    // Category list is deduped by slug.
    const slugs = out.categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
