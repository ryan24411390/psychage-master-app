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
  | { readonly status: 'granted'; readonly coords: Coords }
  | { readonly status: 'denied' }
  | { readonly status: 'unavailable' };

/**
 * Request foreground location permission and read the current position once.
 * Returns 'denied' if the user declines (the directory then stays on text filters)
 * and 'unavailable' on any hardware/lookup failure. Never throws.
 */
export async function requestAndGetCoords(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { status: 'denied' };

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'granted',
      coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
    };
  } catch {
    return { status: 'unavailable' };
  }
}

/** Default radius applied when the user opts into "near me" (mirrors web). */
export const DEFAULT_RADIUS_MILES = 25;
