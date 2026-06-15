// Onboarding-seen flag — mobile-local, SR-13 versioned migrator (mirrors
// lib/persistence/reflection-row). Gates the first-launch redirect to S1: shown once,
// then never again. Derived UI affordance (not authored user data) → reseed-on-anomaly,
// never throws. Not symptom data (SR-4).

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:onboarding-seen';
// Front-door Welcome gate (Amendment 2026-06-16). Same shape/migrator as onboarding-seen
// but a distinct flag: the Welcome auth gate is the step BEFORE product onboarding. Marked
// the moment the user engages the gate (Continue / Log in / Sign up) so a later sign-out
// lands in the (Tier-1) app, never re-walls them (anonymous-first invariant).
export const WELCOME_STORAGE_KEY = 'mobile:welcome-seen';

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

/** Read → migrate → write-back-if-needed → whether the flag at `key` is set. */
function readSeen(storage: Storage, key: string): boolean {
  const raw = storage.get(key);
  const persisted = migrate(raw);
  if (raw === null || raw !== JSON.stringify(persisted)) {
    storage.set(key, JSON.stringify(persisted));
  }
  return persisted.seen;
}

function markSeen(storage: Storage, key: string): void {
  storage.set(key, JSON.stringify({ version: SCHEMA_VERSION, seen: true }));
}

/** Whether product onboarding (S1/S2) has been seen. */
export function isOnboardingSeen(storage: Storage): boolean {
  return readSeen(storage, STORAGE_KEY);
}

/** Mark onboarding seen — one-time, permanent. */
export function markOnboardingSeen(storage: Storage): void {
  markSeen(storage, STORAGE_KEY);
}

/** Whether the front-door Welcome gate has been engaged. */
export function isWelcomeSeen(storage: Storage): boolean {
  return readSeen(storage, WELCOME_STORAGE_KEY);
}

/** Mark the Welcome gate engaged — set on any of Continue / Log in / Sign up. */
export function markWelcomeSeen(storage: Storage): void {
  markSeen(storage, WELCOME_STORAGE_KEY);
}
