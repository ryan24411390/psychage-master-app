// Toolkit-progress cloud-backup CONSENT — mobile-local, forward-only versioned
// migrator (SR-13) + a reactive layer so the detail-screen toggle drives the live
// sync gate immediately.
//
// THIS IS THE USER-CONSENT GATE for toolkit-progress sync. The push-only backup
// (sync.ts pushToolkitProgress) is allowed to leave the device ONLY when this is
// true. Default is OFF (opt-in): nothing syncs until the person turns it on
// (App Store Guideline 5.1.1 — data-collection consent).
//
// Deliberately a SEPARATE key from the check-in consent (lib/persistence/
// sync-consent.ts): toolkit progress is its own opt-in surface, and a separate key
// avoids bumping the shared check-in consent schema. RESEED-ON-ANOMALY (a derived
// preference, never throws). `migrate()` is pure and is the SR-13 unit;
// `loadToolkitSyncConsent(storage)` is the DI-style read; the pure
// `getToolkitSyncConsent()` is the non-React gate consumed by the push path.

import { useSyncExternalStore } from 'react';

import { storage } from '@/lib/adapters/storage';
import type { Storage } from '@/lib/adapters/storage';

export const TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION = 1 as const;
export const TOOLKIT_SYNC_CONSENT_STORAGE_KEY = 'mobile:toolkit-sync-consent';

export interface ToolkitSyncConsentState {
  readonly version: number;
  readonly toolkitProgressSyncConsent: boolean;
}

function seed(): ToolkitSyncConsentState {
  // Default OFF — explicit opt-in. No progress leaves the device until consented.
  return { version: TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION, toolkitProgressSyncConsent: false };
}

/**
 * Parse + migrate the raw persisted JSON into the current schema.
 * - null / parse failure / non-object / missing version / future version → seed (OFF).
 * - matching version → pass-through (consent normalized to a strict boolean).
 */
export function migrate(rawJson: string | null): ToolkitSyncConsentState {
  if (rawJson === null) return seed();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return seed();
  }

  if (typeof parsed !== 'object' || parsed === null) return seed();

  const e = parsed as { version?: unknown; toolkitProgressSyncConsent?: unknown };
  if (typeof e.version !== 'number') return seed();
  if (e.version !== TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION) return seed();

  return {
    version: TOOLKIT_SYNC_CONSENT_SCHEMA_VERSION,
    toolkitProgressSyncConsent: e.toolkitProgressSyncConsent === true,
  };
}

/** DI-style read → migrate → write-back-if-needed. */
export function loadToolkitSyncConsent(s: Storage): ToolkitSyncConsentState {
  const raw = s.get(TOOLKIT_SYNC_CONSENT_STORAGE_KEY);
  const state = migrate(raw);
  if (raw === null || raw !== JSON.stringify(state)) {
    s.set(TOOLKIT_SYNC_CONSENT_STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

// ── reactive singleton layer (useSyncExternalStore-compatible) ───────────────

let cache: ToolkitSyncConsentState | null = null;
const listeners = new Set<() => void>();

function ensureLoaded(): ToolkitSyncConsentState {
  if (cache === null) cache = loadToolkitSyncConsent(storage);
  return cache;
}

function write(next: ToolkitSyncConsentState): void {
  cache = next;
  storage.set(TOOLKIT_SYNC_CONSENT_STORAGE_KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

/** Current snapshot (stable identity until a setter runs — safe for useSyncExternalStore). */
export function getToolkitSyncConsentSnapshot(): ToolkitSyncConsentState {
  return ensureLoaded();
}

export function subscribeToolkitSyncConsent(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function setToolkitSyncConsent(on: boolean): void {
  write({ ...ensureLoaded(), toolkitProgressSyncConsent: on });
}

/** Pure read for the push gate (no React) — the user's toolkit-progress backup consent. */
export function getToolkitSyncConsent(): boolean {
  return ensureLoaded().toolkitProgressSyncConsent;
}

/** Reactive hook for the detail-screen toggle. */
export interface UseToolkitSyncConsent extends ToolkitSyncConsentState {
  setToolkitSyncConsent: (on: boolean) => void;
}

export function useToolkitSyncConsent(): UseToolkitSyncConsent {
  const state = useSyncExternalStore(
    subscribeToolkitSyncConsent,
    getToolkitSyncConsentSnapshot,
    getToolkitSyncConsentSnapshot,
  );
  return { ...state, setToolkitSyncConsent };
}

/** Test seam: drop the in-memory cache + listeners so a fresh-storage test re-hydrates. */
export function __resetToolkitSyncConsentCacheForTests(): void {
  cache = null;
  listeners.clear();
}
