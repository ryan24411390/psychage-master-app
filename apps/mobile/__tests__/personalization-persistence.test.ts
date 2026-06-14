import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { loadPersonalization, migrate, savePersonalization } from '@/lib/persistence/personalization';

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

describe('personalization migrate', () => {
  it('seeds to anonymous + check-in lead', () => {
    expect(migrate(null)).toEqual({ version: 1, name: null, homeLead: 'check-in' });
  });

  it('reseeds on corrupt / non-object / missing version / future version', () => {
    expect(migrate('nope')).toEqual(migrate(null));
    expect(migrate('7')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ name: 'Sam' }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 2, name: 'Sam' }))).toEqual(migrate(null));
  });

  it('normalizes an empty/whitespace name to null and an unknown lead to check-in', () => {
    const out = migrate(JSON.stringify({ version: 1, name: '   ', homeLead: 'mystery' }));
    expect(out.name).toBeNull();
    expect(out.homeLead).toBe('check-in');
  });
});

describe('personalization load/save round-trip', () => {
  it('persists name + homeLead and reads them back (name trimmed)', () => {
    const storage = memStorage();
    savePersonalization(storage, { name: '  Mara ', homeLead: 'navigator' });
    const loaded = loadPersonalization(storage);
    expect(loaded.name).toBe('Mara');
    expect(loaded.homeLead).toBe('navigator');
  });
});
