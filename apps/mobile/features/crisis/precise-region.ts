// Precise (GPS-backed) region detection for the crisis surface — the opportunistic
// sharpening on top of the locale hint (device-region.ts). Kept OUT of the pure
// `region.ts` so that file stays native-module-free and unit-tests under Vitest;
// only the crisis route imports this.
//
// PRIVACY INVARIANT (do not weaken — Sacred Rule #11, and mirrors
// features/directory/location.ts): coordinates are read one-shot, used ONLY to derive
// a country code, and are NEVER persisted (no MMKV, no secure-store), never written to
// analytics, never sent to Sentry. Only a 2-letter region code ever leaves this module.
//
// SR-2 INVARIANT: nothing here may block or gate crisis content. The silent hint runs
// only when permission is ALREADY granted (it never prompts); the opt-in path prompts
// only on an explicit user tap. Crisis renders instantly from the locale hint either way.

import * as Location from 'expo-location';

import { requestAndGetCoords } from '@/features/directory/location';

import type { RegionCode } from './helpline-schema';

/**
 * Normalize a reverse-geocoded ISO 3166-1 country code to a 2-letter uppercase
 * RegionCode, or null when absent/malformed. Pure — unit-tested without the native
 * module. An unknown-but-well-formed code passes through (S11 shows the dataset gap).
 */
export function countryToRegion(code: string | null | undefined): RegionCode | null {
  const up = code?.toUpperCase() ?? null;
  return up && /^[A-Z]{2}$/.test(up) ? up : null;
}

/**
 * Region from GPS, but ONLY when foreground permission is already granted — this never
 * prompts. Uses the cached last-known position (cheap, no active fix) and reverse-geocodes
 * it to a country. Returns null when not granted, no fix is cached, or any step fails, so
 * the caller silently keeps the locale-derived region. Never persists coordinates.
 */
export async function silentGrantedRegionHint(): Promise<RegionCode | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getLastKnownPositionAsync();
    if (!pos) return null;
    const places = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    return countryToRegion(places[0]?.isoCountryCode ?? null);
  } catch {
    return null;
  }
}

/**
 * Opt-in precise region — prompts for permission on demand (an explicit user tap drives
 * this). Reuses the directory's one-shot reader, which carries the same foreground-only,
 * never-persisted invariant. Returns the resolved region, or null when the user declines
 * or the lookup fails (the caller keeps the current region).
 */
export async function requestPreciseRegion(): Promise<RegionCode | null> {
  const result = await requestAndGetCoords();
  if (result.status !== 'granted') return null;
  return countryToRegion(result.countryCode);
}
