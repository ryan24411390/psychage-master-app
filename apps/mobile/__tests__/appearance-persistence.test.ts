import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { loadAppearance, migrate } from '@/lib/persistence/appearance';

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

describe('appearance migrate', () => {
  it('seeds to system + motion-on when no data', () => {
    expect(migrate(null)).toEqual({ version: 1, mode: 'system', reducedMotion: false });
  });

  it('reseeds on corrupt JSON / non-object / missing version', () => {
    expect(migrate('{')).toEqual(migrate(null));
    expect(migrate('"x"')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ mode: 'night' }))).toEqual(migrate(null));
  });

  it('reseeds on a future version', () => {
    expect(migrate(JSON.stringify({ version: 5, mode: 'light' }))).toEqual(migrate(null));
  });

  it('normalizes an unknown mode to system', () => {
    expect(migrate(JSON.stringify({ version: 1, mode: 'sepia' })).mode).toBe('system');
  });
});

describe('appearance load round-trip', () => {
  it('persists mode + reducedMotion and reads them back', () => {
    const storage = memStorage();
    storage.set('mobile:appearance', JSON.stringify({ version: 1, mode: 'night', reducedMotion: true }));
    const loaded = loadAppearance(storage);
    expect(loaded.mode).toBe('night');
    expect(loaded.reducedMotion).toBe(true);
  });
});
