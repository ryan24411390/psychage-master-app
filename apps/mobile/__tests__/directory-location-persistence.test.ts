import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import { loadDirectoryLocation, migrate } from '@/lib/persistence/directory-location';

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

describe('directory-location migrate (SR-13)', () => {
  it('seeds to unconfigured + no scope', () => {
    expect(migrate(null)).toEqual({
      version: 1,
      configured: false,
      stateName: null,
      stateAbbr: null,
      city: null,
    });
  });

  it('reseeds on corrupt / non-object / missing version / future version', () => {
    expect(migrate('nope')).toEqual(migrate(null));
    expect(migrate('7')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ stateAbbr: 'CA' }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 2, configured: true }))).toEqual(migrate(null));
  });

  it('normalizes whitespace scope fields to null and keeps configured', () => {
    const out = migrate(
      JSON.stringify({ version: 1, configured: true, stateName: '  ', stateAbbr: '', city: '   ' }),
    );
    expect(out.configured).toBe(true);
    expect(out.stateName).toBeNull();
    expect(out.stateAbbr).toBeNull();
    expect(out.city).toBeNull();
  });

  it('passes a configured California/SF scope through', () => {
    const out = migrate(
      JSON.stringify({
        version: 1,
        configured: true,
        stateName: 'California',
        stateAbbr: 'CA',
        city: 'San Francisco',
      }),
    );
    expect(out).toEqual({
      version: 1,
      configured: true,
      stateName: 'California',
      stateAbbr: 'CA',
      city: 'San Francisco',
    });
  });
});

describe('directory-location load write-back', () => {
  it('writes a clean seed envelope on first read', () => {
    const storage = memStorage();
    const loaded = loadDirectoryLocation(storage);
    expect(loaded.configured).toBe(false);
    expect(storage.get('mobile:directory-location')).toBe(JSON.stringify(loaded));
  });
});
