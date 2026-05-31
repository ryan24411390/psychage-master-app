// TierFlags persistence — mobile-local, forward-only versioned migrator
// (Sacred Rule #13: every persisted shape needs a version field + N→N+1
// transform from day one or stored state silently rots across schema bumps).
//
// Storage-agnostic. The migrator runs synchronously over a JSON string read
// from any conforming Storage impl (in-memory for tests; MMKV on device via
// lib/adapters/storage.native.ts). Default-seeds { all tiers true } when no
// data is present, preserving Slice 7's `() => true` predicate semantics
// before any user toggle UI lands.
//
// Forward-only. There is no down-migration; a future-versioned blob (a
// downgraded app reading newer persisted state) falls back to a default seed.

import type { Storage } from '@/lib/adapters/storage';

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;
export type TierFlags = Record<Tier, boolean>;

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:tier-flags';

const DEFAULT_TIER_FLAGS: TierFlags = {
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
};

const ALL_DISABLED: TierFlags = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
};

export interface Persisted {
  readonly version: number;
  readonly data: TierFlags;
}

interface Transform {
  readonly from: number;
  readonly to: number;
  readonly transform: (raw: unknown) => TierFlags;
}

// Forward-only transform registry. Each entry expands the previous shape into
// the next-version TierFlags. Indexed by `from` — `migrate()` walks upward
// until the target SCHEMA_VERSION is reached.
const TRANSFORMS: readonly Transform[] = [
  {
    from: 0,
    to: 1,
    // v0 was a single global on/off — { enabled: boolean }. v1 expands per-tier:
    // enabled === true → all tiers on; otherwise all tiers off. The legacy
    // semantics map directly onto Slice 7's `() => true` / `() => false`
    // surface so an in-flight upgrade preserves user intent.
    transform: (raw) => {
      if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_TIER_FLAGS };
      const enabled = (raw as { enabled?: unknown }).enabled === true;
      return enabled ? { ...DEFAULT_TIER_FLAGS } : { ...ALL_DISABLED };
    },
  },
];

function isTierFlagsShape(value: unknown): value is TierFlags {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  for (let tier = 1; tier <= 6; tier++) {
    if (typeof v[String(tier)] !== 'boolean') return false;
  }
  return true;
}

/**
 * Parse + migrate raw persisted JSON into the current schema version.
 *
 * - `null` (no data) → default-seed at current SCHEMA_VERSION.
 * - parse failure / malformed envelope → default-seed (defensive; never throws).
 * - matching version → pass-through.
 * - older version → walk TRANSFORMS forward from `raw.version` to SCHEMA_VERSION.
 * - newer version (downgraded app) → default-seed; no down-migration.
 */
export function migrate(rawJson: string | null): Persisted {
  if (rawJson === null) {
    return { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
  }

  const envelope = parsed as { version?: unknown; data?: unknown };
  const version = typeof envelope.version === 'number' ? envelope.version : null;
  if (version === null) {
    return { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
  }

  if (version === SCHEMA_VERSION) {
    return isTierFlagsShape(envelope.data)
      ? { version: SCHEMA_VERSION, data: envelope.data }
      : { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
  }

  if (version > SCHEMA_VERSION) {
    return { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
  }

  let cursor = version;
  let payload: unknown = envelope.data;
  while (cursor < SCHEMA_VERSION) {
    const step = TRANSFORMS.find((t) => t.from === cursor);
    if (!step) {
      return { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
    }
    payload = step.transform(payload);
    cursor = step.to;
  }

  return isTierFlagsShape(payload)
    ? { version: SCHEMA_VERSION, data: payload }
    : { version: SCHEMA_VERSION, data: { ...DEFAULT_TIER_FLAGS } };
}

/**
 * Read → migrate → write-back-if-needed → return TierFlags.
 *
 * Stamps the current SCHEMA_VERSION back to storage whenever the input was
 * missing, malformed, or older — so the next launch reads a v1 envelope and
 * skips the migration walk.
 */
export function loadTierFlags(storage: Storage): TierFlags {
  const raw = storage.get(STORAGE_KEY);
  const persisted = migrate(raw);

  const needsWrite = raw === null || raw !== JSON.stringify(persisted);
  if (needsWrite) {
    storage.set(STORAGE_KEY, JSON.stringify(persisted));
  }

  return persisted.data;
}
