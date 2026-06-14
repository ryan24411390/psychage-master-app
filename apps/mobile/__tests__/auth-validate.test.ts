import { describe, expect, it } from 'vitest';

import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validatePassword,
} from '@/features/auth/validate';

// Pure email/password validators (rules/auth.md §3). Length-only password rule
// (NIST SP 800-63B), permissive single-@ email typo guard.
describe('validateEmail', () => {
  it('flags an empty (or whitespace-only) email', () => {
    expect(validateEmail('')).toBe('empty');
    expect(validateEmail('   ')).toBe('empty');
  });

  it('flags a malformed email', () => {
    expect(validateEmail('not-an-email')).toBe('invalid');
    expect(validateEmail('a@b')).toBe('invalid');
    expect(validateEmail('a@@b.com')).toBe('invalid');
  });

  it('accepts a well-formed email (trimmed)', () => {
    expect(validateEmail('person@example.com')).toBeNull();
    expect(validateEmail('  person@example.com  ')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('flags an empty password', () => {
    expect(validatePassword('')).toBe('empty');
  });

  it(`flags a password shorter than ${PASSWORD_MIN_LENGTH}`, () => {
    expect(validatePassword('short')).toBe('too-short');
    expect(validatePassword('1234567')).toBe('too-short');
  });

  it('accepts a password at or above the minimum length', () => {
    expect(validatePassword('12345678')).toBeNull();
    expect(validatePassword('a-long-enough-passphrase')).toBeNull();
  });
});
