import { afterEach, describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  __resetSyncConsentCacheForTests,
  getCheckInSyncConsent,
  loadSyncConsent,
  migrate,
  setCheckInSyncConsent,
} from '@/lib/persistence/sync-consent';

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
  __resetSyncConsentCacheForTests();
});

describe('sync-consent migrate', () => {
  it('seeds to consent OFF when no data (privacy-safe default)', () => {
    expect(migrate(null)).toEqual({ version: 1, checkInSyncConsent: false });
  });

  it('reseeds to OFF on corrupt JSON / non-object / missing version', () => {
    expect(migrate('{')).toEqual(migrate(null));
    expect(migrate('"x"')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ checkInSyncConsent: true }))).toEqual(migrate(null));
  });

  it('reseeds to OFF on a future version (never silently trusts unknown shape)', () => {
    expect(migrate(JSON.stringify({ version: 9, checkInSyncConsent: true }))).toEqual(migrate(null));
  });

  it('passes a stored ON consent through, and coerces non-true to false', () => {
    expect(migrate(JSON.stringify({ version: 1, checkInSyncConsent: true })).checkInSyncConsent).toBe(true);
    expect(migrate(JSON.stringify({ version: 1, checkInSyncConsent: 'yes' })).checkInSyncConsent).toBe(false);
  });
});

describe('sync-consent load round-trip', () => {
  it('persists and reads back an enabled consent', () => {
    const storage = memStorage();
    storage.set('mobile:sync-consent', JSON.stringify({ version: 1, checkInSyncConsent: true }));
    expect(loadSyncConsent(storage).checkInSyncConsent).toBe(true);
  });
});

describe('sync-consent reactive value (the push gate)', () => {
  it('defaults to false and reflects a setter flip', () => {
    expect(getCheckInSyncConsent()).toBe(false);
    setCheckInSyncConsent(true);
    expect(getCheckInSyncConsent()).toBe(true);
    setCheckInSyncConsent(false);
    expect(getCheckInSyncConsent()).toBe(false);
  });
});
