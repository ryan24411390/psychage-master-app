// Personalization — mobile-local, forward-only versioned migrator
// (Sacred Rule #13). The "Make it yours" surface (S44): a display name, which
// tool leads the home "Right now" group (the v5 pinning behavior), and — v2 — the
// content categories the user chose at first-run, which drive Learn + home recs.
//
// RESEED-ON-ANOMALY (derived preference, never throws) — the tier-flags policy.
// Not user-authored record data.
//
// CONSUMPTION NOTE: this store PERSISTS name + homeLead + interests and exposes a
// getter. `interests` (v2) are content category slugs (article_categories.slug),
// captured by the onboarding interest picker and read by Learn (top recs + all-30
// list) and the home "Most read" rail.

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = 'mobile:personalization';

/** Which tool leads the home "Right now" group. */
export type HomeLead = 'check-in' | 'navigator' | 'toolkit';

const HOME_LEADS: readonly HomeLead[] = ['check-in', 'navigator', 'toolkit'];

export interface Personalization {
  readonly version: number;
  /** Display name, or null when anonymous (greeting drops the comma). */
  readonly name: string | null;
  readonly homeLead: HomeLead;
  /** Chosen content category slugs (article_categories.slug); empty when unset. */
  readonly interests: readonly string[];
}

function seed(): Personalization {
  return { version: SCHEMA_VERSION, name: null, homeLead: 'check-in', interests: [] };
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeHomeLead(value: unknown): HomeLead {
  return HOME_LEADS.includes(value as HomeLead) ? (value as HomeLead) : 'check-in';
}

/** Non-empty string slugs, trimmed + deduped, order preserved. */
function normalizeInterests(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const slug = raw.trim();
    if (slug.length === 0 || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

/**
 * Parse + migrate the raw persisted JSON into the current schema.
 * - null / parse failure / non-object / missing or future version → seed.
 * - version 1 → upgraded to v2 (name + homeLead PRESERVED, interests seeded empty).
 * - version 2 → pass-through (fields normalized).
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

  const e = parsed as { version?: unknown; name?: unknown; homeLead?: unknown; interests?: unknown };
  if (typeof e.version !== 'number') return seed();
  // Forward-only: v1 upgrades in place (no data loss); v2 passes through; anything
  // else (future / unknown) reseeds.
  if (e.version !== 1 && e.version !== SCHEMA_VERSION) return seed();

  return {
    version: SCHEMA_VERSION,
    name: normalizeName(e.name),
    homeLead: normalizeHomeLead(e.homeLead),
    interests: e.version === 1 ? [] : normalizeInterests(e.interests),
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

/**
 * Persist a personalization shape (writes a clean v2 envelope). `interests` is
 * optional: when omitted it is PRESERVED from the stored value, so existing callers
 * (e.g. the settings "Make it yours" screen) that only set name/homeLead never wipe
 * the user's chosen interests.
 */
export function savePersonalization(
  storage: Storage,
  next: Omit<Personalization, 'version' | 'interests'> & { interests?: readonly string[] },
): Personalization {
  const interests = next.interests ?? migrate(storage.get(STORAGE_KEY)).interests;
  const value: Personalization = {
    version: SCHEMA_VERSION,
    name: normalizeName(next.name),
    homeLead: normalizeHomeLead(next.homeLead),
    interests: normalizeInterests(interests),
  };
  storage.set(STORAGE_KEY, JSON.stringify(value));
  return value;
}

/** Convenience: update only the chosen interests, preserving name + homeLead. */
export function setInterests(storage: Storage, interests: readonly string[]): Personalization {
  const current = loadPersonalization(storage);
  return savePersonalization(storage, {
    name: current.name,
    homeLead: current.homeLead,
    interests,
  });
}
