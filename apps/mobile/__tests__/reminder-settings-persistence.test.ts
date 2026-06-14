import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  DEFAULT_REMINDER_TIME,
  loadReminderSettings,
  migrate,
  saveReminderSettings,
} from '@/lib/persistence/reminder-settings';

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

describe('reminder-settings migrate', () => {
  it('seeds when no data (evening default, off, askable)', () => {
    expect(migrate(null)).toEqual({
      version: 1,
      enabled: false,
      time: DEFAULT_REMINDER_TIME,
      neverAsked: false,
    });
  });

  it('reseeds on corrupt JSON, non-object, and missing version', () => {
    expect(migrate('not json')).toEqual(migrate(null));
    expect(migrate('42')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ enabled: true }))).toEqual(migrate(null));
  });

  it('reseeds on a future version (downgraded app)', () => {
    expect(migrate(JSON.stringify({ version: 99, enabled: true, neverAsked: true }))).toEqual(
      migrate(null),
    );
  });

  it('falls back to the evening default on an invalid time', () => {
    const out = migrate(JSON.stringify({ version: 1, enabled: true, time: '25:99' }));
    expect(out.time).toBe(DEFAULT_REMINDER_TIME);
  });
});

describe('reminder-settings load/save round-trip', () => {
  it('persists enabled + time and reads them back', () => {
    const storage = memStorage();
    saveReminderSettings(storage, { enabled: true, time: '07:30', neverAsked: false });
    const loaded = loadReminderSettings(storage);
    expect(loaded.enabled).toBe(true);
    expect(loaded.time).toBe('07:30');
    expect(loaded.neverAsked).toBe(false);
  });

  it('round-trips neverAsked:true (Never is permanent)', () => {
    const storage = memStorage();
    saveReminderSettings(storage, { enabled: false, time: '21:00', neverAsked: true });
    expect(loadReminderSettings(storage).neverAsked).toBe(true);
    // and a second load still reads it (no reseed on a clean envelope)
    expect(loadReminderSettings(storage).neverAsked).toBe(true);
  });
});
