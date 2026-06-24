import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the native modules so the GPS-backed paths run under Vitest (node). The pure
// mapper (`countryToRegion`) needs no mock.
const getForegroundPermissionsAsync = vi.fn();
const getLastKnownPositionAsync = vi.fn();
const reverseGeocodeAsync = vi.fn();
vi.mock('expo-location', () => ({
  getForegroundPermissionsAsync: () => getForegroundPermissionsAsync(),
  getLastKnownPositionAsync: () => getLastKnownPositionAsync(),
  reverseGeocodeAsync: (loc: unknown) => reverseGeocodeAsync(loc),
}));

const requestAndGetCoords = vi.fn();
vi.mock('@/features/directory/location', () => ({
  requestAndGetCoords: () => requestAndGetCoords(),
}));

import {
  countryToRegion,
  requestPreciseRegion,
  silentGrantedRegionHint,
} from '@/features/crisis/precise-region';

const POS = { coords: { latitude: 1, longitude: 2 } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('countryToRegion (pure mapper)', () => {
  it('normalizes a well-formed code to 2-letter uppercase', () => {
    expect(countryToRegion('US')).toBe('US');
    expect(countryToRegion('gb')).toBe('GB');
    expect(countryToRegion('ca')).toBe('CA');
  });

  it('returns null for missing or malformed codes', () => {
    expect(countryToRegion(null)).toBeNull();
    expect(countryToRegion(undefined)).toBeNull();
    expect(countryToRegion('')).toBeNull();
    expect(countryToRegion('USA')).toBeNull();
    expect(countryToRegion('1')).toBeNull();
  });
});

describe('silentGrantedRegionHint (never prompts)', () => {
  it('returns null without reading position when permission is not granted', async () => {
    getForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    expect(await silentGrantedRegionHint()).toBeNull();
    expect(getLastKnownPositionAsync).not.toHaveBeenCalled();
  });

  it('resolves the country from a cached position when already granted', async () => {
    getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    getLastKnownPositionAsync.mockResolvedValue(POS);
    reverseGeocodeAsync.mockResolvedValue([{ isoCountryCode: 'GB' }]);
    expect(await silentGrantedRegionHint()).toBe('GB');
  });

  it('returns null when granted but no position is cached', async () => {
    getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    getLastKnownPositionAsync.mockResolvedValue(null);
    expect(await silentGrantedRegionHint()).toBeNull();
  });

  it('returns null when reverse-geocode yields nothing or throws', async () => {
    getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    getLastKnownPositionAsync.mockResolvedValue(POS);
    reverseGeocodeAsync.mockResolvedValue([]);
    expect(await silentGrantedRegionHint()).toBeNull();

    reverseGeocodeAsync.mockRejectedValue(new Error('offline'));
    expect(await silentGrantedRegionHint()).toBeNull();
  });
});

describe('requestPreciseRegion (opt-in, prompts on demand)', () => {
  it('returns the resolved region when the user grants', async () => {
    requestAndGetCoords.mockResolvedValue({ status: 'granted', countryCode: 'CA' });
    expect(await requestPreciseRegion()).toBe('CA');
  });

  it('returns null when the user declines or the lookup has no country', async () => {
    requestAndGetCoords.mockResolvedValue({ status: 'denied' });
    expect(await requestPreciseRegion()).toBeNull();

    requestAndGetCoords.mockResolvedValue({ status: 'granted', countryCode: null });
    expect(await requestPreciseRegion()).toBeNull();
  });
});
