import { describe, expect, it } from 'vitest';

import { DEFAULT_SLEEP_SETTINGS } from '../constants';
import {
  migrate,
  normalizeEntries,
  sanitizeSettings,
  SCHEMA_VERSION,
  serialize,
} from '../migrate';

function persistedEntry(date: string, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `id-${date}`,
    date,
    created_at: '2026-01-01T00:00:00.000Z',
    bedtime: '23:00',
    lights_out: '23:15',
    sleep_onset_minutes: 15,
    wake_time: '07:00',
    out_of_bed_time: '07:15',
    night_wakings: 0,
    night_waking_duration_minutes: 0,
    sleep_quality: 4,
    morning_mood: 4,
    dream_recall: false,
    naps: [],
    substances: { alcohol: false, exercise: false, medication_sleep_aid: false },
    ...over,
  };
}

function envelope(entries: unknown[], settings: unknown = DEFAULT_SLEEP_SETTINGS): string {
  return JSON.stringify({ version: SCHEMA_VERSION, settings, entries });
}

describe('migrate — clean paths', () => {
  it('null → clean empty store with default settings', () => {
    const out = migrate(null);
    expect(out.status).toBe('clean');
    expect(out.value.entries).toEqual([]);
    expect(out.value.settings).toEqual(DEFAULT_SLEEP_SETTINGS);
    expect(out.value.version).toBe(SCHEMA_VERSION);
  });

  it('a well-formed v1 envelope passes through clean', () => {
    const out = migrate(envelope([persistedEntry('2026-06-16')]));
    expect(out.status).toBe('clean');
    expect(out.value.entries).toHaveLength(1);
    expect(out.value.entries[0].id).toBe('id-2026-06-16');
  });
});

describe('migrate — anomalies are quarantined, never silently dropped', () => {
  it('corrupt JSON', () => {
    const out = migrate('{not json');
    expect(out).toMatchObject({ status: 'anomaly', reason: 'corrupt-json', raw: '{not json' });
  });

  it('non-object', () => {
    expect(migrate('42')).toMatchObject({ status: 'anomaly', reason: 'not-an-object' });
  });

  it('missing version', () => {
    expect(migrate(JSON.stringify({ entries: [] }))).toMatchObject({
      status: 'anomaly',
      reason: 'missing-version',
    });
  });

  it('future version is preserved, not discarded', () => {
    const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, settings: {}, entries: [] });
    expect(migrate(raw)).toMatchObject({ status: 'anomaly', reason: 'future-version', raw });
  });

  it('malformed entries → recovered subset + anomaly', () => {
    const out = migrate(
      envelope([persistedEntry('2026-06-16'), { id: 'bad', date: 'xxxx', sleep_quality: 9 }]),
    );
    expect(out.status).toBe('anomaly');
    if (out.status === 'anomaly') expect(out.reason).toBe('malformed-entries');
    expect(out.value.entries.map((e) => e.id)).toEqual(['id-2026-06-16']);
  });
});

describe('normalizeEntries — one entry per day', () => {
  it('collapses duplicate dates (last wins) and flags dropped', () => {
    const a = persistedEntry('2026-06-16', { id: 'first', sleep_quality: 2 });
    const b = persistedEntry('2026-06-16', { id: 'second', sleep_quality: 5 });
    const { entries, dropped } = normalizeEntries([a, b]);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('second');
    expect(dropped).toBe(true);
  });

  it('sorts ascending by date', () => {
    const { entries } = normalizeEntries([
      persistedEntry('2026-06-18'),
      persistedEntry('2026-06-16'),
      persistedEntry('2026-06-17'),
    ]);
    expect(entries.map((e) => e.date)).toEqual(['2026-06-16', '2026-06-17', '2026-06-18']);
  });
});

describe('sanitizeSettings', () => {
  it('falls back to defaults for a non-object or malformed fields', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SLEEP_SETTINGS);
    expect(sanitizeSettings({ target_sleep_minutes: -1, age_range: 5 })).toEqual(
      DEFAULT_SLEEP_SETTINGS,
    );
  });

  it('passes through valid fields including optionals', () => {
    const s = sanitizeSettings({
      target_sleep_minutes: 450,
      age_range: 'teen_14_17',
      chronotype: 'wolf',
      target_bedtime: '23:30',
      target_wake_time: '07:00',
    });
    expect(s).toEqual({
      target_sleep_minutes: 450,
      age_range: 'teen_14_17',
      chronotype: 'wolf',
      target_bedtime: '23:30',
      target_wake_time: '07:00',
    });
  });

  it('drops an invalid chronotype / bad time while keeping valid base fields', () => {
    const s = sanitizeSettings({
      target_sleep_minutes: 480,
      age_range: 'adult_26_64',
      chronotype: 'penguin',
      target_bedtime: '99:99',
    });
    expect(s.chronotype).toBeUndefined();
    expect(s.target_bedtime).toBeUndefined();
    expect(s.target_sleep_minutes).toBe(480);
  });
});

describe('serialize', () => {
  it('round-trips through migrate', () => {
    const raw = serialize({
      version: SCHEMA_VERSION,
      settings: DEFAULT_SLEEP_SETTINGS,
      entries: [],
    });
    expect(migrate(raw).status).toBe('clean');
  });
});
