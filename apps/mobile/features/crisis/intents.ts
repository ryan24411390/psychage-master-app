// Pure dialer-intent builders — NO react-native import, so they run under Vitest
// `.test.ts` (the PR gate tests the intent is FORMED, not that it dials). The
// side-effecting `dial` (which needs core `Linking`) lives in `dialer.ts`.

/** Keep only dialable characters: digits, +, *, #. Strips spaces/dashes/parens. */
export function sanitizeNumber(raw: string): string {
  return raw.replace(/[^0-9+*#]/g, '');
}

/** `tel:` intent for a phone number. */
export function telUrl(number: string): string {
  return `tel:${sanitizeNumber(number)}`;
}

/** `sms:` intent for a text-capable number. */
export function smsUrl(number: string): string {
  return `sms:${sanitizeNumber(number)}`;
}
