// First-run tour-seen flag — mobile-local, SR-13 versioned migrator (mirrors
// lib/persistence/onboarding). Gates the one-time cross-tab tour shown after product
// onboarding: shown once, then never again. Derived UI affordance (not authored user
// data) → reseed-on-anomaly, never throws. Not symptom data (SR-4).

import type { Storage } from '@/lib/adapters/storage';

export const TOUR_SCHEMA_VERSION = 1 as const;
export const TOUR_STORAGE_KEY = 'mobile:tour-seen';

interface Persisted {
  readonly version: number;
  readonly seen: boolean;
}

function seed(): Persisted {
  return { version: TOUR_SCHEMA_VERSION, seen: false };
}

export function migrateTour(rawJson: string | null): Persisted {
  if (rawJson === null) return seed();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }
  if (typeof parsed !== 'object' || parsed === null) return seed();
  const env = parsed as { version?: unknown; seen?: unknown };
  if (env.version === TOUR_SCHEMA_VERSION) {
    return { version: TOUR_SCHEMA_VERSION, seen: env.seen === true };
  }
  return seed();
}

/** Whether the first-run tour has been shown. Self-heals an anomalous blob. */
export function isTourSeen(storage: Storage): boolean {
  const raw = storage.get(TOUR_STORAGE_KEY);
  const persisted = migrateTour(raw);
  if (raw === null || raw !== JSON.stringify(persisted)) {
    storage.set(TOUR_STORAGE_KEY, JSON.stringify(persisted));
  }
  return persisted.seen;
}

/** Mark the tour seen — one-time, permanent. */
export function markTourSeen(storage: Storage): void {
  storage.set(TOUR_STORAGE_KEY, JSON.stringify({ version: TOUR_SCHEMA_VERSION, seen: true }));
}
