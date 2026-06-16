import { describe, expect, it } from 'vitest';

import { scrollProgress } from '@/lib/reading-progress-tracker';
import { readingProgressStore } from '@/lib/reading-progress-store';

describe('scrollProgress', () => {
  it('is the fraction of the scrollable extent covered', () => {
    expect(scrollProgress(0, 1000, 500)).toBe(0);
    expect(scrollProgress(250, 1000, 500)).toBe(0.5);
    expect(scrollProgress(500, 1000, 500)).toBe(1);
  });

  it('clamps to 0..1 for overscroll / negative bounce', () => {
    expect(scrollProgress(9999, 1000, 500)).toBe(1);
    expect(scrollProgress(-5, 1000, 500)).toBe(0);
  });

  it('counts content shorter than the viewport as fully read', () => {
    expect(scrollProgress(0, 400, 500)).toBe(1);
  });
});

describe('readingProgressStore meta', () => {
  it('persists title + readTime and surfaces them in-progress', () => {
    readingProgressStore.setProgress('slug-meta', 0.3, { title: 'Naming feelings', readTime: 5 });
    const found = readingProgressStore.getInProgressReads().find((r) => r.id === 'slug-meta');
    expect(found).toMatchObject({ progress: 0.3, title: 'Naming feelings', readTime: 5 });
  });

  it('preserves prior metadata when a later write omits it', () => {
    readingProgressStore.setProgress('slug-keep', 0.2, { title: 'Kept', readTime: 8 });
    readingProgressStore.setProgress('slug-keep', 0.55);
    const found = readingProgressStore.getInProgressReads().find((r) => r.id === 'slug-keep');
    expect(found).toMatchObject({ progress: 0.55, title: 'Kept', readTime: 8 });
  });

  it('excludes barely-started and finished reads from the rail', () => {
    readingProgressStore.setProgress('slug-zero', 0.01, { title: 'Zero' });
    readingProgressStore.setProgress('slug-done', 0.99, { title: 'Done' });
    const ids = readingProgressStore.getInProgressReads().map((r) => r.id);
    expect(ids).not.toContain('slug-zero');
    expect(ids).not.toContain('slug-done');
  });
});
