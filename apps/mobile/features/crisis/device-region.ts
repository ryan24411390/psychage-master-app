// Locale-backed device-region hint for the crisis surface (P25). Reads the OS
// locale's ISO 3166-1 alpha-2 region via expo-localization — synchronous, and NOT
// a location read: no GPS, no permission prompt (SR-2). This lives OUTSIDE the pure
// `region.ts` so that file stays native-module-free and keeps unit-testing under
// Vitest; only the route layer imports this.
//
// `regionFromLocales` is the pure mapper (testable without the native module);
// `localeDeviceRegionHint` is the wired hint the routes pass to `resolveRegion`.

import * as Localization from 'expo-localization';

import type { RegionCode } from './helpline-schema';
import type { DeviceRegionHint } from './region';

/**
 * First locale's region code, normalized to a 2-letter uppercase RegionCode (e.g.
 * 'US', 'GB') or null when absent/malformed. An unknown-but-well-formed code is
 * returned as-is — `resolveRegion` tolerates it and S11 shows the dataset-gap state.
 */
export function regionFromLocales(
  locales: ReadonlyArray<{ readonly regionCode: string | null }>,
): RegionCode | null {
  const code = locales[0]?.regionCode ?? null;
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Device-region hint from the OS locale. Returns null on any failure so resolution
 * falls through to the Intl hint / fallback. PLACEHOLDER-free: this is the real
 * detection (the Intl parse in `region.ts` is now only a secondary fallback).
 */
export const localeDeviceRegionHint: DeviceRegionHint = () => {
  try {
    return regionFromLocales(Localization.getLocales());
  } catch {
    return null;
  }
};
