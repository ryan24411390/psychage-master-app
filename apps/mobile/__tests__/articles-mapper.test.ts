import { describe, expect, it } from 'vitest';

import {
  type DbArticleDetailRow,
  type DbArticleListRow,
  type DbCategoryRow,
  mapCategoryRow,
  mapCitation,
  mapDetailRow,
  mapListRow,
} from '@/lib/articles/mapper';
import { ARTICLE_AUTHOR_NAME, ARTICLE_AUTHOR_ROLE } from '@/lib/articles/types';

const listRow: DbArticleListRow = {
  slug: 'why-worry-gets-louder-at-night',
  title: 'Why worry gets louder at night',
  seo_description: 'A short summary.',
  hero_image_url: 'https://cdn.example/covers/CAT07-001.jpeg',
  read_time: 6,
  tags: ['Sleep', 'Worry'],
  created_at: '2026-03-20T07:56:38.539416+00:00',
  category: { name: 'Sleep, Body & Mind-Body Connection', slug: 'sleep-body-connection' },
};

describe('mapListRow', () => {
  it('maps all list fields including the joined category', () => {
    const item = mapListRow(listRow);
    expect(item).toEqual({
      slug: 'why-worry-gets-louder-at-night',
      title: 'Why worry gets louder at night',
      seoDescription: 'A short summary.',
      heroImageUrl: 'https://cdn.example/covers/CAT07-001.jpeg',
      readTime: 6,
      tags: ['Sleep', 'Worry'],
      categoryName: 'Sleep, Body & Mind-Body Connection',
      categorySlug: 'sleep-body-connection',
      createdAt: '2026-03-20T07:56:38.539416+00:00',
    });
  });

  it('defaults missing seo_description / tags / hero / read_time', () => {
    const item = mapListRow({
      slug: 's',
      title: 't',
      created_at: 'c',
      category: { name: 'X', slug: 'x' },
    });
    expect(item.seoDescription).toBe('');
    expect(item.tags).toEqual([]);
    expect(item.heroImageUrl).toBeNull();
    expect(item.readTime).toBeNull();
  });

  it('accepts the array form of the embedded category', () => {
    const item = mapListRow({ ...listRow, category: [{ name: 'Sleep', slug: 'sleep' }] });
    expect(item.categorySlug).toBe('sleep');
  });

  it('falls back to Uncategorized when the category is null', () => {
    const item = mapListRow({ ...listRow, category: null });
    expect(item.categoryName).toBe('Uncategorized');
    expect(item.categorySlug).toBe('');
  });
});

describe('mapDetailRow', () => {
  const detailRow: DbArticleDetailRow = {
    ...listRow,
    subtitle: 'A practical guide',
    content: '<div><p>Verbatim clinician-reviewed body.</p></div>',
    content_format: 'html',
  };

  it('carries the verbatim body and content format', () => {
    const a = mapDetailRow(detailRow);
    expect(a.contentHtml).toBe('<div><p>Verbatim clinician-reviewed body.</p></div>');
    expect(a.contentFormat).toBe('html');
    expect(a.subtitle).toBe('A practical guide');
  });

  it('defaults content_format to html and empty content to empty string', () => {
    const a = mapDetailRow({ ...detailRow, content: null, content_format: null });
    expect(a.contentHtml).toBe('');
    expect(a.contentFormat).toBe('html');
  });

  it('uses the fixed web byline, never the raw author_name', () => {
    const a = mapDetailRow(detailRow);
    expect(a.authorName).toBe(ARTICLE_AUTHOR_NAME);
    expect(a.authorName).toBe('Psychage Team');
    expect(a.authorRole).toBe(ARTICLE_AUTHOR_ROLE);
  });

  it('defaults to no citations when none are embedded', () => {
    expect(mapDetailRow(detailRow).citations).toEqual([]);
  });

  it('maps embedded citations and sorts them by sort_order', () => {
    const a = mapDetailRow({
      ...detailRow,
      article_citations: [
        { title: 'Second', sort_order: 2, authors: ['Y'], year: 2022, journal_name: 'J2' },
        { title: 'First', sort_order: 1, authors: [], year: null, url: 'https://a.example' },
      ],
    });
    expect(a.citations.map((c) => c.title)).toEqual(['First', 'Second']);
    expect(a.citations[0]?.url).toBe('https://a.example');
  });
});

describe('mapCitation', () => {
  it('maps fields, defaulting authors and nullables', () => {
    expect(mapCitation({ title: 'T' })).toEqual({
      title: 'T',
      authors: [],
      year: null,
      url: null,
      doi: null,
      journalName: null,
      tier: null,
      sortOrder: 0,
    });
  });
});

describe('mapCategoryRow', () => {
  const row: DbCategoryRow = {
    slug: 'anxiety-stress',
    name: 'Anxiety, Stress & Overwhelm',
    icon: 'Brain',
    color: '#14B8A6',
    display_order: 2,
    articles: [{ count: 82 }],
  };

  it('maps the taxonomy fields and reads the embedded published count', () => {
    expect(mapCategoryRow(row)).toEqual({
      slug: 'anxiety-stress',
      name: 'Anxiety, Stress & Overwhelm',
      icon: 'Brain',
      color: '#14B8A6',
      displayOrder: 2,
      articleCount: 82,
    });
  });

  it('defaults count to 0 and nullable fields when absent (empty taxonomy twin)', () => {
    const c = mapCategoryRow({ slug: 's', name: 'n' });
    expect(c.articleCount).toBe(0);
    expect(c.icon).toBeNull();
    expect(c.color).toBeNull();
    expect(c.displayOrder).toBe(0);
  });
});
