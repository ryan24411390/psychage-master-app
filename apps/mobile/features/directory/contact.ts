// Pure contact-intent builders for the provider detail screen. NO react-native
// import — they run under Vitest (`.test.ts`) and assert the intent is FORMED, not
// that it opens. The side-effecting open reuses the crisis `dial` (core `Linking`)
// in the screen. Every URL is built from a provider's REAL stored value — never a
// typed-in or inferred one (directory fidelity rule).

import { sanitizeNumber, smsUrl, telUrl } from '@/features/crisis/intents';

import type { ProviderLocation } from './types';

// Re-export the crisis builders so the directory has one contact surface.
export { sanitizeNumber, smsUrl, telUrl };

/** `mailto:` intent for a provider's stored email. */
export function mailtoUrl(email: string): string {
  return `mailto:${email.trim()}`;
}

/**
 * Normalise a stored website/appointment URL into an openable https link.
 * NPI-sourced values often omit the scheme ("drsmith.com"). We only add a scheme
 * — we never alter the host/path. Returns null for empty input.
 */
export function webUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Universal maps link for directions to a real provider location. Prefers exact
 * coordinates; falls back to the address string. Returns null when neither is
 * present (we never synthesise a location). The universal google.com/maps form
 * opens the platform maps app on both iOS and Android.
 */
export function directionsUrl(loc: ProviderLocation | null | undefined): string | null {
  if (!loc) return null;
  if (loc.latitude != null && loc.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  const parts = [loc.address_line1, loc.address_line2, loc.city, loc.state_province, loc.postal_code]
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(', ');
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

/** Human-readable single-line address for display (verbatim fields). */
export function formatAddress(loc: ProviderLocation | null | undefined): string {
  if (!loc) return '';
  return [loc.address_line1, loc.address_line2, loc.city, loc.state_province, loc.postal_code]
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(', ');
}
