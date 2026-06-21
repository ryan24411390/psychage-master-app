import { describe, expect, it, vi } from 'vitest';

// Mock the native module so the locale-backed hint runs under Vitest (node). The
// pure mapper (`regionFromLocales`) needs no mock; the wired hint reads getLocales.
const getLocales = vi.fn();
vi.mock('expo-localization', () => ({ getLocales: () => getLocales() }));

import { localeDeviceRegionHint, regionFromLocales } from '@/features/crisis/device-region';

describe('regionFromLocales (pure mapper)', () => {
  it('returns the first locale region code as a 2-letter uppercase RegionCode', () => {
    expect(regionFromLocales([{ regionCode: 'GB' }])).toBe('GB');
    expect(regionFromLocales([{ regionCode: 'US' }, { regionCode: 'FR' }])).toBe('US');
  });

  it('returns null for missing, null, lowercase, or non-2-letter region codes', () => {
    expect(regionFromLocales([])).toBeNull();
    expect(regionFromLocales([{ regionCode: null }])).toBeNull();
    expect(regionFromLocales([{ regionCode: 'gb' }])).toBeNull();
    expect(regionFromLocales([{ regionCode: 'USA' }])).toBeNull();
    expect(regionFromLocales([{ regionCode: '' }])).toBeNull();
  });

  it('passes a well-formed but dataset-unknown code through (S11 shows the gap state)', () => {
    expect(regionFromLocales([{ regionCode: 'ZZ' }])).toBe('ZZ');
  });
});

describe('localeDeviceRegionHint (wired to expo-localization)', () => {
  it('maps the device locale region code', () => {
    getLocales.mockReturnValue([{ regionCode: 'BD' }]);
    expect(localeDeviceRegionHint()).toBe('BD');
  });

  it('returns null when the device exposes no region code', () => {
    getLocales.mockReturnValue([{ regionCode: null }]);
    expect(localeDeviceRegionHint()).toBeNull();
  });

  it('returns null (never throws) when getLocales throws', () => {
    getLocales.mockImplementation(() => {
      throw new Error('native unavailable');
    });
    expect(localeDeviceRegionHint()).toBeNull();
  });
});
