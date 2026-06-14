// Pure email/password validators (rules/auth.md §3 method-specific rules).
// No React, no I/O — Vitest-testable. Password min length is 8 (NIST SP 800-63B:
// length over complexity; no complexity requirements beyond length).

export const PASSWORD_MIN_LENGTH = 8;

export type EmailError = 'empty' | 'invalid';
export type PasswordError = 'empty' | 'too-short';

// Deliberately permissive single-@ shape: validation at the boundary is a typo
// guard, not an RFC-5322 parser. The real existence/deliverability check is the
// verification email (rules/auth.md §3), not this regex.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): EmailError | null {
  const email = raw.trim();
  if (email.length === 0) return 'empty';
  if (!EMAIL_RE.test(email)) return 'invalid';
  return null;
}

export function validatePassword(raw: string): PasswordError | null {
  if (raw.length === 0) return 'empty';
  if (raw.length < PASSWORD_MIN_LENGTH) return 'too-short';
  return null;
}
