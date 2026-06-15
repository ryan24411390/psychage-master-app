import { describe, expect, it } from 'vitest';

import {
  PASSWORD_MIN_LENGTH,
  passwordStrength,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirmation,
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

// --- Amendment 2026-06-16 (auth-experience pass) additions --------------------

describe('validateFullName', () => {
  it('flags an empty or whitespace-only name', () => {
    expect(validateFullName('')).toBe('empty');
    expect(validateFullName('   ')).toBe('empty');
  });

  it('accepts any non-blank name', () => {
    expect(validateFullName('John Doe')).toBeNull();
    expect(validateFullName('  A ')).toBeNull();
  });
});

describe('validatePasswordConfirmation', () => {
  it('flags an empty confirmation', () => {
    expect(validatePasswordConfirmation('secret123', '')).toBe('empty');
  });

  it('flags a mismatch (byte-exact, no trimming)', () => {
    expect(validatePasswordConfirmation('secret123', 'secret124')).toBe('mismatch');
    expect(validatePasswordConfirmation('secret123', 'secret123 ')).toBe('mismatch');
  });

  it('passes when both match exactly', () => {
    expect(validatePasswordConfirmation('secret123', 'secret123')).toBeNull();
  });
});

describe('passwordStrength (display-only meter)', () => {
  it('is empty for an empty password', () => {
    expect(passwordStrength('')).toEqual({ score: 0, level: 'empty' });
  });

  it('is weak below the min length (never gates — informs only)', () => {
    expect(passwordStrength('abc')).toEqual({ score: 1, level: 'weak' });
  });

  it('is fair for a plain at-length password', () => {
    expect(passwordStrength('abcdefgh')).toEqual({ score: 2, level: 'fair' });
  });

  it('is good for a longer multi-class password', () => {
    expect(passwordStrength('abcde12345')).toEqual({ score: 3, level: 'good' });
  });

  it('is strong for a long, varied password', () => {
    expect(passwordStrength('Abcdef12345!')).toEqual({ score: 4, level: 'strong' });
  });
});
