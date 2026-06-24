import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { categoryPosterUrl, posterSlugForTopic } from '@/features/learn/category-posters';

const BASE = 'https://proj.supabase.co';
const PREFIX = `${BASE}/storage/v1/object/public/article-images/category-covers`;

describe('categoryPosterUrl', () => {
  const prev = process.env.EXPO_PUBLIC_SUPABASE_URL;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = BASE;
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = prev;
  });

  it('builds the public storage URL for a known poster slug', () => {
    expect(categoryPosterUrl('anxiety-stress')).toBe(`${PREFIX}/anxiety-stress.jpeg`);
    expect(categoryPosterUrl('depression-grief')).toBe(`${PREFIX}/depression-grief.jpeg`);
  });

  it('returns null for an orphan slug with no poster', () => {
    // trauma-ptsd is not a real slug; family-parenting is canonical but has no poster yet.
    expect(categoryPosterUrl('trauma-ptsd')).toBeNull();
    expect(categoryPosterUrl('family-parenting')).toBeNull();
  });

  it('returns null for empty / nullish input', () => {
    expect(categoryPosterUrl(null)).toBeNull();
    expect(categoryPosterUrl(undefined)).toBeNull();
    expect(categoryPosterUrl('')).toBeNull();
  });

  it('returns null when Supabase is unconfigured (even for a known slug)', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(categoryPosterUrl('anxiety-stress')).toBeNull();
  });
});

describe('posterSlugForTopic', () => {
  const prev = process.env.EXPO_PUBLIC_SUPABASE_URL;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = BASE;
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = prev;
  });

  it('maps each curated Learn-card id to a canonical poster slug', () => {
    expect(posterSlugForTopic('anxiety')).toBe('anxiety-stress');
    expect(posterSlugForTopic('sleep')).toBe('sleep-body-connection');
    expect(posterSlugForTopic('relationships')).toBe('relationships-communication');
    expect(posterSlugForTopic('mood')).toBe('depression-grief');
    expect(posterSlugForTopic('focus')).toBe('work-productivity');
  });

  it('returns undefined for the "more" catch-all and unknown ids (→ gradient)', () => {
    expect(posterSlugForTopic('more')).toBeUndefined();
    expect(posterSlugForTopic('not-a-topic')).toBeUndefined();
  });

  it('every mapped topic slug actually resolves to a poster URL', () => {
    for (const id of ['anxiety', 'sleep', 'relationships', 'mood', 'focus']) {
      expect(categoryPosterUrl(posterSlugForTopic(id))).not.toBeNull();
    }
  });
});
