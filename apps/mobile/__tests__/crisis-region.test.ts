import { describe, expect, it } from 'vitest';

import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';
import {
  DEFAULT_REGION,
  getEmergencyNumber,
  getHelplines,
  getRegionName,
  hasHelplines,
  loadRegionOverride,
  migrate,
  resolveRegion,
  saveRegionOverride,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '@/features/crisis/region';
import type { Storage } from '@/lib/adapters/storage';

function makeStorage(initial?: Record<string, string>): Storage {
  const m = new Map<string, string>(Object.entries(initial ?? {}));
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

describe('resolveRegion precedence', () => {
  it('prefers the stored override, then the device hint, then the fallback', () => {
    expect(resolveRegion({ storedOverride: 'GB', deviceHint: 'US' })).toBe('GB');
    expect(resolveRegion({ storedOverride: null, deviceHint: 'US' })).toBe('US');
    expect(resolveRegion({ storedOverride: null, deviceHint: null })).toBe(DEFAULT_REGION);
    expect(resolveRegion({ storedOverride: null, deviceHint: null, fallback: 'BD' })).toBe('BD');
  });

  it('returns an unknown region unchanged (S11 still shows its name + the gap state)', () => {
    expect(resolveRegion({ storedOverride: 'ZZ', deviceHint: null })).toBe('ZZ');
  });
});

describe('dataset lookups + gap detection', () => {
  it('reports helplines where the dataset has them, and the gap otherwise', () => {
    expect(hasHelplines(CRISIS_DATASET, 'US')).toBe(true);
    // IN is in the roster + emergency map but has NO helpline rows → gap state.
    expect(hasHelplines(CRISIS_DATASET, 'IN')).toBe(false);
    expect(getHelplines(CRISIS_DATASET, 'IN')).toEqual([]);
    // Wholly unknown region → gap state, no throw.
    expect(hasHelplines(CRISIS_DATASET, 'ZZ')).toBe(false);
  });

  it('resolves the region-correct emergency number, falling back to the dataset default', () => {
    expect(getEmergencyNumber(CRISIS_DATASET, 'US')).toBe('911');
    expect(getEmergencyNumber(CRISIS_DATASET, 'IN')).toBe('112');
    expect(getEmergencyNumber(CRISIS_DATASET, 'ZZ')).toBe(CRISIS_DATASET.defaultEmergencyNumber);
  });

  it('resolves the region display name, falling back to the raw code', () => {
    expect(getRegionName(CRISIS_DATASET, 'US')).toBe('United States');
    expect(getRegionName(CRISIS_DATASET, 'ZZ')).toBe('ZZ');
  });
});

describe('region override persistence (SR-13 versioned migrator)', () => {
  it('round-trips a saved override', () => {
    const storage = makeStorage();
    expect(loadRegionOverride(storage)).toBeNull();
    saveRegionOverride(storage, 'BD');
    expect(loadRegionOverride(storage)).toBe('BD');
  });

  it('reseeds to null on missing / corrupt / non-object / missing-version / future-version', () => {
    expect(migrate(null).region).toBeNull();
    expect(migrate('not json').region).toBeNull();
    expect(migrate('42').region).toBeNull();
    expect(migrate(JSON.stringify({ region: 'US' })).region).toBeNull();
    expect(migrate(JSON.stringify({ version: 999, region: 'US' })).region).toBeNull();
  });

  it('passes a current-version envelope through', () => {
    const ok = JSON.stringify({ version: SCHEMA_VERSION, region: 'GB' });
    expect(migrate(ok)).toEqual({ version: SCHEMA_VERSION, region: 'GB' });
    const storage = makeStorage({ [STORAGE_KEY]: ok });
    expect(loadRegionOverride(storage)).toBe('GB');
  });
});
