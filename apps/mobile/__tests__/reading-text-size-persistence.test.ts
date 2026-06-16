import { afterEach, describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  __resetReadingTextSizeCacheForTests,
  getReadingTextSizeValue,
  loadReadingTextSize,
  migrate,
  readingBodySizeClass,
  setReadingTextSize,
} from '@/lib/persistence/reading-text-size';

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

afterEach(() => {
  __resetReadingTextSizeCacheForTests();
});

describe('reading-text-size migrate', () => {
  it('seeds to default when no data', () => {
    expect(migrate(null)).toEqual({ version: 1, size: 'default' });
  });

  it('reseeds on corrupt JSON / non-object / missing version', () => {
    expect(migrate('{')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ size: 'large' }))).toEqual(migrate(null));
  });

  it('reseeds on a future version', () => {
    expect(migrate(JSON.stringify({ version: 7, size: 'large' }))).toEqual(migrate(null));
  });

  it('normalizes an unknown size to default', () => {
    expect(migrate(JSON.stringify({ version: 1, size: 'huge' })).size).toBe('default');
  });
});

describe('reading-text-size load round-trip', () => {
  it('persists and reads back a large size', () => {
    const storage = memStorage();
    storage.set('mobile:reading-text-size', JSON.stringify({ version: 1, size: 'large' }));
    expect(loadReadingTextSize(storage).size).toBe('large');
  });
});

describe('reading-text-size reactive value', () => {
  it('defaults to default and reflects a setter change', () => {
    expect(getReadingTextSizeValue()).toBe('default');
    setReadingTextSize('large');
    expect(getReadingTextSizeValue()).toBe('large');
  });
});

describe('readingBodySizeClass — the scaling map', () => {
  it('reproduces the prior fixed sizes at the default size (no visual change)', () => {
    expect(readingBodySizeClass('bodyLarge', 'default')).toBe('text-lg');
    expect(readingBodySizeClass('body', 'default')).toBe('text-base');
    expect(readingBodySizeClass('bodySmall', 'default')).toBe('text-sm');
  });

  it('respects small size', () => {
    expect(readingBodySizeClass('body', 'small')).toBe('text-sm');
    expect(readingBodySizeClass('bodySmall', 'small')).toBe('text-xs');
  });

  it('scales body up at large', () => {
    expect(readingBodySizeClass('body', 'large')).toBe('text-lg');
    expect(readingBodySizeClass('bodySmall', 'large')).toBe('text-base');
  });
});
