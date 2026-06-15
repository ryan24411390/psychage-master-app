import { describe, expect, it } from 'vitest';

import {
  type DbArticleDetailRow,
  type DbArticleListRow,
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
});
