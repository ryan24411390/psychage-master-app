// Reflection-row dismissal flag — mobile-local, forward-only versioned migrator
// (Sacred Rule #13: every persisted shape needs a version field + N→N+1 transform
// from day one or stored state silently rots across schema bumps).
//
// Why local, not RecordStore meta: the row is "one-time — shown until first opened,
// then gone" (Flow 12), so the flag must be SETTABLE when the row is opened. The
// RecordStore's public op contract is frozen for this task (no new ops), and its
// `reminderSightings` meta is read-only/unwired — there is no sanctioned way to flip
// a store-meta flag without expanding the public surface. A tiny local flag is the
// lighter correct mechanism (the order's explicit fallback), and it keeps the
// dismissal concern off the LOCAL-ONLY check-in store entirely.
//
// RESEED-ON-ANOMALY (derived UI state — NOT user data). The opened flag is a UI
// affordance, not something the user authored: corrupt/unknown/future blobs recover
// by reseeding to `opened:false` (the row simply shows once more), never throwing.
// This is the tier-flags policy, correct here for the same reason; it is the OPPOSITE
// of the check-in store's quarantine-don't-lose policy, which guards real user data.

import type { Storage } from '@/lib/adapters/storage';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:reflection-row-opened';

export interface Persisted {
  readonly version: number;
  readonly opened: boolean;
}

function seed(): Persisted {
  return { version: SCHEMA_VERSION, opened: false };
}

/**
 * Parse + migrate the raw persisted JSON into the current schema.
 *
 * - `null` (no data) → seed `{ opened:false }`.
 * - parse failure / non-object / missing version / future version → seed (reseed-on-
 *   anomaly; derived data, never throws).
 * - matching version → pass-through (`opened` coerced to a strict boolean).
 * - older version → no transforms exist yet (v1 is first); a future v2 adds one and
 *   `migrate` already returns the seed for any unmapped older shape.
 */
export function migrate(rawJson: string | null): Persisted {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const envelope = parsed as { version?: unknown; opened?: unknown };
  if (typeof envelope.version !== 'number') return seed();

  if (envelope.version === SCHEMA_VERSION) {
    return { version: SCHEMA_VERSION, opened: envelope.opened === true };
  }

  // Future version (downgraded app) or any older version without a transform path.
  return seed();
}

/**
 * Read → migrate → write-back-if-needed → return whether the row has been opened.
 * Stamps the current SCHEMA_VERSION back when the input was missing/malformed/older,
 * so the next launch reads a clean v1 envelope.
 */
export function isReflectionRowOpened(storage: Storage): boolean {
  const raw = storage.get(STORAGE_KEY);
  const persisted = migrate(raw);

  if (raw === null || raw !== JSON.stringify(persisted)) {
    storage.set(STORAGE_KEY, JSON.stringify(persisted));
  }

  return persisted.opened;
}

/** Mark the row opened — one-time, permanent. Writes a clean v1 envelope. */
export function markReflectionRowOpened(storage: Storage): void {
  storage.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, opened: true }));
}
