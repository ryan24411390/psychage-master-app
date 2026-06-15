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

// --- Sign-up "full SaaS" additions (Amendment 2026-06-16 / Q3) --------------
// All pure, Vitest-testable. The strength meter is DISPLAY-ONLY — validatePassword
// (min length 8) remains the only gate. Per NIST SP 800-63B we never *reject* a
// long passphrase for missing a symbol; the meter only informs.

export type NameError = 'empty';
export type ConfirmError = 'empty' | 'mismatch';

/** Full name: a typo guard, not an identity check. Any non-blank string passes. */
export function validateFullName(raw: string): NameError | null {
  if (raw.trim().length === 0) return 'empty';
  return null;
}

/** Confirm-password field: must be non-empty and byte-equal the password. */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ConfirmError | null {
  if (confirmation.length === 0) return 'empty';
  if (confirmation !== password) return 'mismatch';
  return null;
}

export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrength {
  /** 0..4 — drives the meter fill (empty=0 … strong=4). */
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly level: StrengthLevel;
}

/**
 * Heuristic strength for the meter. Combines length with character-class variety
 * (lower / upper / digit / symbol). Returns a level + score; copy.ts maps the level
 * to a user-facing label so this stays string-free and testable.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, level: 'empty' };
  if (password.length < PASSWORD_MIN_LENGTH) return { score: 1, level: 'weak' };

  const classes =
    (/[a-z]/.test(password) ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 1 : 0);

  if (password.length >= 12 && classes >= 3) return { score: 4, level: 'strong' };
  if (password.length >= 10 && classes >= 2) return { score: 3, level: 'good' };
  return { score: 2, level: 'fair' };
}
