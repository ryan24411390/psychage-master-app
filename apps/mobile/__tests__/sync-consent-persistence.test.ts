import { afterEach, describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  __resetSyncConsentCacheForTests,
  getCheckInSyncConsent,
  getMomentSyncConsent,
  loadSyncConsent,
  migrate,
  setCheckInSyncConsent,
  setMomentSyncConsent,
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

describe('sync-consent migrate (v2 — adds momentSyncConsent)', () => {
  it('seeds BOTH consents OFF when no data (privacy-safe default)', () => {
    expect(migrate(null)).toEqual({ version: 2, checkInSyncConsent: false, momentSyncConsent: false });
  });

  it('reseeds to OFF on corrupt JSON / non-object / missing version', () => {
    expect(migrate('{')).toEqual(migrate(null));
    expect(migrate('"x"')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ checkInSyncConsent: true }))).toEqual(migrate(null));
  });

  it('reseeds to OFF on a future version (never silently trusts unknown shape)', () => {
    expect(migrate(JSON.stringify({ version: 9, momentSyncConsent: true }))).toEqual(migrate(null));
  });

  it('v1 → v2 forward-migrates: PRESERVES checkInSyncConsent, adds momentSyncConsent=false', () => {
    expect(migrate(JSON.stringify({ version: 1, checkInSyncConsent: true }))).toEqual({
      version: 2,
      checkInSyncConsent: true,
      momentSyncConsent: false,
    });
  });

  it('passes a stored v2 through, and coerces non-true to false', () => {
    const on = migrate(JSON.stringify({ version: 2, checkInSyncConsent: false, momentSyncConsent: true }));
    expect(on.momentSyncConsent).toBe(true);
    const coerced = migrate(JSON.stringify({ version: 2, momentSyncConsent: 'yes' }));
    expect(coerced.momentSyncConsent).toBe(false);
  });
});

describe('sync-consent load round-trip', () => {
  it('persists and reads back an enabled moment consent', () => {
    const storage = memStorage();
    storage.set(
      'mobile:sync-consent',
      JSON.stringify({ version: 2, checkInSyncConsent: false, momentSyncConsent: true }),
    );
    expect(loadSyncConsent(storage).momentSyncConsent).toBe(true);
  });
});

describe('sync-consent reactive values (the sync gates)', () => {
  it('moment consent defaults to false and reflects a setter flip independently', () => {
    expect(getMomentSyncConsent()).toBe(false);
    setMomentSyncConsent(true);
    expect(getMomentSyncConsent()).toBe(true);
    // flipping moment consent does not touch check-in consent
    expect(getCheckInSyncConsent()).toBe(false);
    setMomentSyncConsent(false);
    expect(getMomentSyncConsent()).toBe(false);
  });

  it('check-in consent still flips independently', () => {
    expect(getCheckInSyncConsent()).toBe(false);
    setCheckInSyncConsent(true);
    expect(getCheckInSyncConsent()).toBe(true);
    expect(getMomentSyncConsent()).toBe(false);
  });
});
