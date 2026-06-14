// Personalization — mobile-local, forward-only versioned migrator
// (Sacred Rule #13). The "Make it yours" surface (S44): a display name and which
// tool leads the home "Right now" group (the v5 pinning behavior).
//
// RESEED-ON-ANOMALY (derived preference, never throws) — the tier-flags policy.
// Not user-authored record data.
//
// CONSUMPTION NOTE: this store PERSISTS name + homeLead and exposes a getter.
// Wiring `name` into the live home greeting (lib/home-model.ts greeting(…, name))
// and re-ordering the home "Right now" group is the HOME owner's edit — HomeView
// is consumed READ-ONLY in Wave B2. The store is ready; the home wiring is a
// separate task handed to the home owner.

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:personalization';

/** Which tool leads the home "Right now" group. */
export type HomeLead = 'check-in' | 'navigator' | 'toolkit';

const HOME_LEADS: readonly HomeLead[] = ['check-in', 'navigator', 'toolkit'];

export interface Personalization {
  readonly version: number;
  /** Display name, or null when anonymous (greeting drops the comma). */
  readonly name: string | null;
  readonly homeLead: HomeLead;
}

function seed(): Personalization {
  return { version: SCHEMA_VERSION, name: null, homeLead: 'check-in' };
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeHomeLead(value: unknown): HomeLead {
  return HOME_LEADS.includes(value as HomeLead) ? (value as HomeLead) : 'check-in';
}

/**
 * Parse + migrate the raw persisted JSON into the current schema.
 * - null → seed.
 * - parse failure / non-object / missing version / future version → seed.
 * - matching version → pass-through (fields normalized).
 */
export function migrate(rawJson: string | null): Personalization {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const e = parsed as { version?: unknown; name?: unknown; homeLead?: unknown };
  if (typeof e.version !== 'number') return seed();
  if (e.version !== SCHEMA_VERSION) return seed();

  return {
    version: SCHEMA_VERSION,
    name: normalizeName(e.name),
    homeLead: normalizeHomeLead(e.homeLead),
  };
}

/** Read → migrate → write-back-if-needed → return personalization. */
export function loadPersonalization(storage: Storage): Personalization {
  const raw = storage.get(STORAGE_KEY);
  const value = migrate(raw);
  if (raw === null || raw !== JSON.stringify(value)) {
    storage.set(STORAGE_KEY, JSON.stringify(value));
  }
  return value;
}

/** Persist a full personalization shape (writes a clean v1 envelope). */
export function savePersonalization(
  storage: Storage,
  next: Omit<Personalization, 'version'>,
): Personalization {
  const value: Personalization = {
    version: SCHEMA_VERSION,
    name: normalizeName(next.name),
    homeLead: normalizeHomeLead(next.homeLead),
  };
  storage.set(STORAGE_KEY, JSON.stringify(value));
  return value;
}
