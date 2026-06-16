// Appearance + accessibility preferences — mobile-local, forward-only versioned
// migrator (Sacred Rule #13) PLUS a tiny reactive layer so an S45 toggle drives
// the app immediately:
//   - `reducedMotion` → OR-ed into lib/motion.ts useReducedMotion() app-wide, so
//                       EVERY screen (A1 home/terrain included) calms its motion.
//                       FULLY FUNCTIONAL — no tailwind dependency.
//   - `mode`          → light / night / system. FULLY FUNCTIONAL since the #81
//                       wiring: tailwind.config.js uses `darkMode: 'class'`, and
//                       app/_layout.tsx's AppearanceSync applies the persisted mode
//                       imperatively via NativeWind's `colorScheme.set()`
//                       (lib/theme.ts maps mode → scheme). 'system' defers to the
//                       OS, which requires app.json `userInterfaceStyle: automatic`
//                       so the OS reports its real appearance to the app.
//
// RESEED-ON-ANOMALY (derived preference, never throws) — the tier-flags policy.
// Not user-authored record data.
//
// The reactive layer is backed by the storage SINGLETON (in-memory under tests
// via the jest/vitest seam, MMKV on device). `migrate()` is pure and is the unit
// of the SR-13 persistence test; `loadAppearance(storage)` is the DI-style read
// for a caller that wants to pass its own storage.

import { storage } from '@/lib/adapters/storage';
import type { Storage } from '@/lib/adapters/storage';

export type AppearanceMode = 'light' | 'night' | 'system';

export const SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'mobile:appearance';

const MODES: readonly AppearanceMode[] = ['light', 'night', 'system'];

export interface AppearanceState {
  readonly version: number;
  readonly mode: AppearanceMode;
  readonly reducedMotion: boolean;
}

function seed(): AppearanceState {
  return { version: SCHEMA_VERSION, mode: 'system', reducedMotion: false };
}

function normalizeMode(value: unknown): AppearanceMode {
  return MODES.includes(value as AppearanceMode) ? (value as AppearanceMode) : 'system';
}

/**
 * Parse + migrate the raw persisted JSON into the current schema.
 * - null → seed.
 * - parse failure / non-object / missing version / future version → seed.
 * - matching version → pass-through (fields normalized).
 */
export function migrate(rawJson: string | null): AppearanceState {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const e = parsed as { version?: unknown; mode?: unknown; reducedMotion?: unknown };
  if (typeof e.version !== 'number') return seed();
  if (e.version !== SCHEMA_VERSION) return seed();

  return {
    version: SCHEMA_VERSION,
    mode: normalizeMode(e.mode),
    reducedMotion: e.reducedMotion === true,
  };
}

/** DI-style read → migrate → write-back-if-needed (mirrors loadTierFlags). */
export function loadAppearance(s: Storage): AppearanceState {
  const raw = s.get(STORAGE_KEY);
  const state = migrate(raw);
  if (raw === null || raw !== JSON.stringify(state)) {
    s.set(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

// ── reactive singleton layer (useSyncExternalStore-compatible) ───────────────

let cache: AppearanceState | null = null;
const listeners = new Set<() => void>();

function ensureLoaded(): AppearanceState {
  if (cache === null) cache = loadAppearance(storage);
  return cache;
}

function write(next: AppearanceState): void {
  cache = next;
  storage.set(STORAGE_KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

/** Current snapshot (stable identity until a setter runs — safe for useSyncExternalStore). */
export function getAppearanceSnapshot(): AppearanceState {
  return ensureLoaded();
}

export function subscribeAppearance(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function setAppearanceMode(mode: AppearanceMode): void {
  write({ ...ensureLoaded(), mode });
}

export function setReducedMotionOverride(on: boolean): void {
  write({ ...ensureLoaded(), reducedMotion: on });
}

/** Pure read for lib/motion.ts (no React) — the in-app reduced-motion override. */
export function getReducedMotionOverride(): boolean {
  return ensureLoaded().reducedMotion;
}

/** Test seam: drop the in-memory cache + listeners so a fresh-storage test re-hydrates. */
export function __resetAppearanceCacheForTests(): void {
  cache = null;
  listeners.clear();
}
