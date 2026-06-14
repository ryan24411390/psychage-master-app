// Reminder settings — mobile-local, forward-only versioned migrator
// (Sacred Rule #13: every persisted shape needs a version field + N→N+1 transform
// from day one or stored state silently rots across schema bumps).
//
// The reminder doctrine (Flow 3 / R2·C7): ONE user-chosen daily reminder,
// evening-default 9:00 PM. "Not now" leaves it off but askable; "Never" sets
// `neverAsked` PERMANENTLY — the app must never re-prompt after Never.
//
// RESEED-ON-ANOMALY (derived preference, never throws) — copies the tier-flags
// policy. ONE honest caveat on `neverAsked`: a corrupt/unknown envelope recovers
// to `neverAsked:false`, which legitimately re-enables asking. We cannot recover
// a user's "Never" intent from garbage JSON. The risk is bounded: `neverAsked`
// flips true only by an explicit tap and is written immediately, so the only way
// to lose it is external storage corruption — the same exposure every local pref
// carries. This is NOT user-authored record data (which the check-in store
// quarantines, never reseeds); it is a UI preference.
//
// NOTE: the scheduling hand-off to push infrastructure (SYS push / expo-
// notifications) is the PLATFORM layer — this file owns the user-facing setting
// only. Wiring the OS notification is flagged, not implemented, in Wave B2.

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:reminder-settings';

/** 24h 'HH:mm'. Evening default per the reminder doctrine. */
export const DEFAULT_REMINDER_TIME = '21:00';

export interface ReminderSettings {
  readonly version: number;
  /** Is the one daily reminder on. */
  readonly enabled: boolean;
  /** 'HH:mm' 24h. */
  readonly time: string;
  /** User chose "Never" — PERMANENT, never re-prompt. */
  readonly neverAsked: boolean;
}

function seed(): ReminderSettings {
  return { version: SCHEMA_VERSION, enabled: false, time: DEFAULT_REMINDER_TIME, neverAsked: false };
}

// 'HH:mm', 00:00–23:59. Anything else falls back to the evening default.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeTime(value: unknown): string {
  return typeof value === 'string' && TIME_RE.test(value) ? value : DEFAULT_REMINDER_TIME;
}

/**
 * Parse + migrate the raw persisted JSON into the current schema.
 * - null → seed.
 * - parse failure / non-object / missing version / future version → seed (reseed-on-anomaly).
 * - matching version → pass-through (fields coerced/normalized).
 */
export function migrate(rawJson: string | null): ReminderSettings {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const e = parsed as {
    version?: unknown;
    enabled?: unknown;
    time?: unknown;
    neverAsked?: unknown;
  };
  if (typeof e.version !== 'number') return seed();
  if (e.version !== SCHEMA_VERSION) return seed(); // future/unmapped older → seed (v1 is first)

  return {
    version: SCHEMA_VERSION,
    enabled: e.enabled === true,
    time: normalizeTime(e.time),
    neverAsked: e.neverAsked === true,
  };
}

/** Read → migrate → write-back-if-needed → return settings. */
export function loadReminderSettings(storage: Storage): ReminderSettings {
  const raw = storage.get(STORAGE_KEY);
  const settings = migrate(raw);
  if (raw === null || raw !== JSON.stringify(settings)) {
    storage.set(STORAGE_KEY, JSON.stringify(settings));
  }
  return settings;
}

/** Persist a full settings shape (writes a clean v1 envelope). */
export function saveReminderSettings(
  storage: Storage,
  next: Omit<ReminderSettings, 'version'>,
): ReminderSettings {
  const settings: ReminderSettings = {
    version: SCHEMA_VERSION,
    enabled: next.enabled,
    time: normalizeTime(next.time),
    neverAsked: next.neverAsked,
  };
  storage.set(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}
