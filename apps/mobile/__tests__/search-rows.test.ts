import { describe, expect, it } from 'vitest';

import { buildSearchRows, chipQuery, isEmptySections } from '@/features/learn/search-rows';
import type { ArticleListItem } from '@/lib/articles';
import type { CategoryRef, ConditionRef } from '@/lib/discovery/types';

const LABELS = { categories: 'Categories', conditions: 'Conditions', articles: 'Guides' };

const cat = (slug: string): CategoryRef => ({ slug, title: `Cat ${slug}`, href: `/conditions/${slug}` });
const cond = (id: string): ConditionRef => ({ id, title: `Cond ${id}`, href: `/learn/conditions/${id}` });
const art = (slug: string): ArticleListItem => ({
  slug,
  title: `Art ${slug}`,
  seoDescription: '',
  heroImageUrl: null,
  readTime: null,
  tags: [],
  categoryName: '',
  categorySlug: '',
  createdAt: '2026-01-01',
});

describe('buildSearchRows', () => {
  it('emits sections in priority order categories → conditions → articles, each headed', () => {
    const rows = buildSearchRows(
      { categories: [cat('a')], conditions: [cond('GAD')], articles: [art('x')] },
      LABELS,
    );
    expect(rows.map((r) => r.kind)).toEqual([
      'header',
      'category',
      'header',
      'condition',
      'header',
      'article',
    ]);
    const headers = rows.flatMap((r) => (r.kind === 'header' ? [r.title] : []));
    expect(headers).toEqual(['Categories', 'Conditions', 'Guides']);
  });

  it('omits a section (and its header) when empty — condition-only renders only Conditions', () => {
    const rows = buildSearchRows({ categories: [], conditions: [cond('SAD')], articles: [] }, LABELS);
    expect(rows.map((r) => r.kind)).toEqual(['header', 'condition']);
    const header = rows[0];
    expect(header?.kind === 'header' && header.title).toBe('Conditions');
    const row = rows[1];
    expect(row?.kind === 'condition' && row.ref.id).toBe('SAD');
    // No category rows, no category header — i.e. no parent-category chip.
    expect(rows.some((r) => r.kind === 'category')).toBe(false);
  });

  it('namespaces keys by kind so a slug shared across kinds never collides', () => {
    const rows = buildSearchRows({ categories: [cat('anxiety')], conditions: [], articles: [art('anxiety')] }, LABELS);
    const keys = rows.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('lifts every article into a row — no count ceiling at 40', () => {
    const many = Array.from({ length: 75 }, (_, i) => art(`a${i}`));
    const rows = buildSearchRows({ categories: [], conditions: [], articles: many }, LABELS);
    expect(rows.filter((r) => r.kind === 'article')).toHaveLength(75);
  });
});

describe('isEmptySections', () => {
  it('is true only when all three kinds are empty', () => {
    expect(isEmptySections({ categories: [], conditions: [], articles: [] })).toBe(true);
    expect(isEmptySections({ categories: [cat('a')], conditions: [], articles: [] })).toBe(false);
    expect(isEmptySections({ categories: [], conditions: [cond('GAD')], articles: [] })).toBe(false);
    expect(isEmptySections({ categories: [], conditions: [], articles: [art('x')] })).toBe(false);
  });
});

describe('chipQuery', () => {
  it('reduces a multi-part category name to its salient head word', () => {
    expect(chipQuery('Anxiety, Stress & Overwhelm')).toBe('Anxiety');
    expect(chipQuery('Depression, Grief & Loss')).toBe('Depression');
    expect(chipQuery('Focus and Attention')).toBe('Focus');
  });

  it('passes a single-word name straight through', () => {
    expect(chipQuery('Sleep')).toBe('Sleep');
    expect(chipQuery('  Relationships  ')).toBe('Relationships');
  });
});
