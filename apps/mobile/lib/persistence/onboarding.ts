// Onboarding-seen flag — mobile-local, SR-13 versioned migrator (mirrors
// lib/persistence/reflection-row). Gates the first-launch redirect to S1: shown once,
// then never again. Derived UI affordance (not authored user data) → reseed-on-anomaly,
// never throws. Not symptom data (SR-4).

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:onboarding-seen';

export interface Persisted {
  readonly version: number;
  readonly seen: boolean;
}

function seed(): Persisted {
  return { version: SCHEMA_VERSION, seen: false };
}

export function migrate(rawJson: string | null): Persisted {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const envelope = parsed as { version?: unknown; seen?: unknown };
  if (typeof envelope.version !== 'number') return seed();

  if (envelope.version === SCHEMA_VERSION) {
    return { version: SCHEMA_VERSION, seen: envelope.seen === true };
  }

  return seed();
}

/** Read → migrate → write-back-if-needed → whether onboarding has been seen. */
export function isOnboardingSeen(storage: Storage): boolean {
  const raw = storage.get(STORAGE_KEY);
  const persisted = migrate(raw);
  if (raw === null || raw !== JSON.stringify(persisted)) {
    storage.set(STORAGE_KEY, JSON.stringify(persisted));
  }
  return persisted.seen;
}

/** Mark onboarding seen — one-time, permanent. */
export function markOnboardingSeen(storage: Storage): void {
  storage.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, seen: true }));
}
