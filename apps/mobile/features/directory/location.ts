// "Near me" location for the provider directory.
//
// PRIVACY INVARIANT (do not weaken): the returned coordinates are used ONLY to
// parameterise a one-shot directory search. They are never persisted (no MMKV, no
// secure-store), never written to analytics, and never sent to Sentry. There is no
// store, no cache, and no return path other than the live caller below. Foreground
// (when-in-use) permission only — we never request background location.

import * as Location from 'expo-location';

export interface Coords {
  readonly latitude: number;
  readonly longitude: number;
}

export type LocationResult =
  | {
      readonly status: 'granted';
      readonly coords: Coords;
      /** ISO 3166-1 alpha-2 from reverse-geocode (e.g. 'US'); null if it failed. */
      readonly countryCode: string | null;
      /** State/region name or code from reverse-geocode (e.g. 'California'); null if it failed. */
      readonly region: string | null;
    }
  | { readonly status: 'denied' }
  | { readonly status: 'unavailable' };

/**
 * Request foreground location permission, read the current position once, and
 * reverse-geocode it to a country + region. Returns 'denied' if the user declines
 * (the directory then stays on manual state selection) and 'unavailable' on any
 * hardware/lookup failure. Never throws.
 *
 * Why country + region and not a lat/lng radius search: provider records carry no
 * coordinates (provider_locations.latitude/longitude are null across the table), so
 * a geo-radius query matches nothing. The directory searches by STATE instead, so
 * the caller resolves the device location to a US state (or detects non-US) here.
 */
export async function requestAndGetCoords(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { status: 'denied' };

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };

    // One-shot reverse-geocode (same foreground permission; never persisted/logged).
    let countryCode: string | null = null;
    let region: string | null = null;
    try {
      const places = await Location.reverseGeocodeAsync(coords);
      const place = places[0];
      countryCode = place?.isoCountryCode ?? null;
      region = place?.region ?? null;
    } catch {
      // Reverse-geocode is best-effort; without it the caller falls back to manual.
    }

    return { status: 'granted', coords, countryCode, region };
  } catch {
    return { status: 'unavailable' };
  }
}

/** Default radius applied when the user opts into "near me" (mirrors web). */
export const DEFAULT_RADIUS_MILES = 25;
