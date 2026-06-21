import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { loadPersonalization, migrate, savePersonalization, setInterests } from '@/lib/persistence/personalization';

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

describe('personalization migrate (v2)', () => {
  it('seeds to anonymous + check-in lead + no interests', () => {
    expect(migrate(null)).toEqual({ version: 2, name: null, homeLead: 'check-in', interests: [] });
  });

  it('reseeds on corrupt / non-object / missing version / future version', () => {
    expect(migrate('nope')).toEqual(migrate(null));
    expect(migrate('7')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ name: 'Sam' }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 3, name: 'Sam' }))).toEqual(migrate(null));
  });

  it('upgrades a v1 envelope in place — PRESERVES name + homeLead, seeds interests empty', () => {
    const out = migrate(JSON.stringify({ version: 1, name: 'Mara', homeLead: 'navigator' }));
    expect(out).toEqual({ version: 2, name: 'Mara', homeLead: 'navigator', interests: [] });
  });

  it('normalizes an empty/whitespace name to null and an unknown lead to check-in', () => {
    const out = migrate(JSON.stringify({ version: 1, name: '   ', homeLead: 'mystery' }));
    expect(out.name).toBeNull();
    expect(out.homeLead).toBe('check-in');
    expect(out.interests).toEqual([]);
  });

  it('keeps + dedupes + trims v2 interests, dropping non-strings/blanks', () => {
    const out = migrate(
      JSON.stringify({ version: 2, name: null, homeLead: 'check-in', interests: [' anxiety-stress ', 'anxiety-stress', '', 7, 'sleep-body-connection'] }),
    );
    expect(out.interests).toEqual(['anxiety-stress', 'sleep-body-connection']);
  });
});

describe('personalization load/save round-trip', () => {
  it('persists name + homeLead and reads them back (name trimmed); omitted interests preserved', () => {
    const storage = memStorage();
    savePersonalization(storage, { name: '  Mara ', homeLead: 'navigator', interests: ['sleep-body-connection'] });
    // A later save that omits interests (e.g. settings) must NOT wipe them.
    savePersonalization(storage, { name: 'Mara', homeLead: 'toolkit' });
    const loaded = loadPersonalization(storage);
    expect(loaded.name).toBe('Mara');
    expect(loaded.homeLead).toBe('toolkit');
    expect(loaded.interests).toEqual(['sleep-body-connection']);
  });

  it('setInterests preserves name + homeLead', () => {
    const storage = memStorage();
    savePersonalization(storage, { name: 'Sky', homeLead: 'navigator' });
    setInterests(storage, ['depression-mood', 'depression-mood']);
    const loaded = loadPersonalization(storage);
    expect(loaded).toMatchObject({ name: 'Sky', homeLead: 'navigator', interests: ['depression-mood'] });
  });
});
