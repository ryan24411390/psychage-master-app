// Unit tests for the MindMate conversation-persistence consent migrator (SR-13).
// Pure parse/migrate — the default is OFF (opt-in) and every anomaly reseeds to OFF
// so a corrupt/stale envelope can NEVER silently flip persistence on.

import { describe, expect, it } from 'vitest';

import { SCHEMA_VERSION, migrate } from '@/features/mindmate/persistence/chat-consent';

describe('chat-consent migrate()', () => {
  it('defaults to OFF when nothing is stored', () => {
    expect(migrate(null)).toEqual({ version: SCHEMA_VERSION, chatPersistConsent: false });
  });

  it('reseeds to OFF on unparseable JSON', () => {
    expect(migrate('{not json')).toEqual({ version: SCHEMA_VERSION, chatPersistConsent: false });
  });

  it('reseeds to OFF on a non-object payload', () => {
    expect(migrate('42').chatPersistConsent).toBe(false);
    expect(migrate('null').chatPersistConsent).toBe(false);
  });

  it('reseeds to OFF when the version is missing or non-numeric', () => {
    expect(migrate(JSON.stringify({ chatPersistConsent: true })).chatPersistConsent).toBe(false);
    expect(
      migrate(JSON.stringify({ version: '1', chatPersistConsent: true })).chatPersistConsent,
    ).toBe(false);
  });

  it('reseeds to OFF on a future/unknown version (no forward guesses)', () => {
    expect(
      migrate(JSON.stringify({ version: 99, chatPersistConsent: true })).chatPersistConsent,
    ).toBe(false);
  });

  it('passes through a matching-version consent, normalized to a strict boolean', () => {
    expect(migrate(JSON.stringify({ version: SCHEMA_VERSION, chatPersistConsent: true }))).toEqual({
      version: SCHEMA_VERSION,
      chatPersistConsent: true,
    });
    // Truthy-but-not-true never reads as consent.
    expect(
      migrate(JSON.stringify({ version: SCHEMA_VERSION, chatPersistConsent: 1 })).chatPersistConsent,
    ).toBe(false);
    expect(
      migrate(JSON.stringify({ version: SCHEMA_VERSION, chatPersistConsent: false }))
        .chatPersistConsent,
    ).toBe(false);
  });
});
