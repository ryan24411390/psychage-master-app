import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION,
  TOOLKIT_SYNC_CONSENT_STORAGE_KEY,
  loadToolkitSyncConsent,
  migrate,
} from '@/features/toolkits/sync-consent';

function makeStorage(seed?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  const storage: Storage = {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
  };
  return { storage, map };
}

describe('toolkit sync-consent migrate', () => {
  it('defaults OFF on null (opt-in)', () => {
    expect(migrate(null).toolkitProgressSyncConsent).toBe(false);
  });

  it('passes a valid ON state through', () => {
    const raw = JSON.stringify({
      version: TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION,
      toolkitProgressSyncConsent: true,
    });
    expect(migrate(raw).toolkitProgressSyncConsent).toBe(true);
  });

  it('falls back to OFF on garbage, non-object, future version', () => {
    expect(migrate('{bad').toolkitProgressSyncConsent).toBe(false);
    expect(migrate('42').toolkitProgressSyncConsent).toBe(false);
    expect(
      migrate(
        JSON.stringify({ version: TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION + 1, toolkitProgressSyncConsent: true }),
      ).toolkitProgressSyncConsent,
    ).toBe(false);
  });

  it('coerces consent to a strict boolean', () => {
    const raw = JSON.stringify({
      version: TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION,
      toolkitProgressSyncConsent: 'yes',
    });
    expect(migrate(raw).toolkitProgressSyncConsent).toBe(false);
  });
});

describe('loadToolkitSyncConsent', () => {
  it('seeds OFF and writes it back when storage is empty', () => {
    const { storage, map } = makeStorage();
    const state = loadToolkitSyncConsent(storage);
    expect(state.toolkitProgressSyncConsent).toBe(false);
    expect(map.get(TOOLKIT_SYNC_CONSENT_STORAGE_KEY)).toBe(JSON.stringify(state));
  });
});
