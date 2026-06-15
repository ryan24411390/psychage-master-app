// Region resolution + persistence for the crisis surface (S11/S12). Pure logic +
// a versioned local-storage migrator — no React, so it runs under Vitest `.test.ts`.
//
// Resolution order: explicit user override (S12) → best-effort device hint → fallback.
// The override persists locally and survives relaunch. NONE of this is symptom data
// (SR-4) — only a country code is stored.
//
// DEVICE-REGION DETECTION IS A SEAM (flagged). `expo-localization` is NOT installed
// (adding it mid-wave would touch the shared lockfile while B1/B2 run concurrently —
// exactly the cross-wave collision the order guards against). `defaultDeviceRegionHint`
// is a best-effort `Intl` parse that returns null when unavailable; the real
// device-region detection (expo-localization `getLocales().regionCode`) is deferred
// infra. The S12 picker is the always-available, reliable path.

import type { Storage } from '@/lib/adapters/storage';

import type { CrisisDataset, HelplineRow, RegionCode } from './helpline-schema';

/** Fixture fallback region — CT3 owns the real default policy. */
export const DEFAULT_REGION: RegionCode = 'US';

// --- persistence: SR-13 versioned migrator (mirrors lib/persistence/reflection-row) ---
export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:crisis-region';

interface Persisted {
  readonly version: number;
  readonly region: RegionCode | null;
}

function seed(): Persisted {
  return { version: SCHEMA_VERSION, region: null };
}

/**
 * Parse + migrate the persisted override. Derived UI preference (not authored user
 * data) → reseed-on-anomaly, never throws: corrupt/non-object/missing-version/future
 * version all fall back to `{ region: null }` (no override → resolution uses the
 * device hint / fallback).
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

  const envelope = parsed as { version?: unknown; region?: unknown };
  if (typeof envelope.version !== 'number') return seed();

  if (envelope.version === SCHEMA_VERSION) {
    const region = typeof envelope.region === 'string' ? envelope.region : null;
    return { version: SCHEMA_VERSION, region };
  }

  return seed();
}

/** Read the persisted region override (or null if none / anomalous). */
export function loadRegionOverride(storage: Storage): RegionCode | null {
  const persisted = migrate(storage.get(STORAGE_KEY));
  return persisted.region;
}

/** Persist the user's S12 region choice. Writes a clean v1 envelope. */
export function saveRegionOverride(storage: Storage, region: RegionCode): void {
  storage.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, region }));
}

// --- device hint seam --------------------------------------------------------------
export type DeviceRegionHint = () => RegionCode | null;

/**
 * Best-effort device region from the resolved Intl locale (e.g. 'en-US' → 'US').
 * Returns null when the runtime exposes no region subtag. PLACEHOLDER — real
 * detection is deferred infra (see file header).
 */
export const defaultDeviceRegionHint: DeviceRegionHint = () => {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    const subtag = locale.split('-')[1];
    return subtag && /^[A-Z]{2}$/.test(subtag) ? subtag : null;
  } catch {
    return null;
  }
};

// --- resolution + dataset lookups (pure) -------------------------------------------

/**
 * Resolve the active region: override → device hint → fallback. The result is NOT
 * required to be in the dataset — an unknown region still resolves so S11 can show
 * its name + the dataset-gap state. `hasHelplines` drives the gap branch.
 */
export function resolveRegion(opts: {
  storedOverride: RegionCode | null;
  deviceHint: RegionCode | null;
  fallback?: RegionCode;
}): RegionCode {
  return opts.storedOverride ?? opts.deviceHint ?? opts.fallback ?? DEFAULT_REGION;
}

/** Helpline rows for a region (empty when the dataset has none → gap state). */
export function getHelplines(dataset: CrisisDataset, region: RegionCode): readonly HelplineRow[] {
  return dataset.helplinesByRegion[region] ?? [];
}

/** True when the region has at least one verified helpline row. */
export function hasHelplines(dataset: CrisisDataset, region: RegionCode): boolean {
  return getHelplines(dataset, region).length > 0;
}

/** Region-correct emergency number, falling back to the dataset default. */
export function getEmergencyNumber(dataset: CrisisDataset, region: RegionCode): string {
  return dataset.emergencyByRegion[region] ?? dataset.defaultEmergencyNumber;
}

/** Human-readable region name (falls back to the raw code if unlisted). */
export function getRegionName(dataset: CrisisDataset, region: RegionCode): string {
  return dataset.regions.find((r) => r.code === region)?.name ?? region;
}
