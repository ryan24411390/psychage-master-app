// ClarityResultStore — the local-only history of completed Clarity snapshots.
//
// LOCAL-ONLY (SR-4). Writes to the injected Storage seam and nowhere else: no
// Supabase, no network, no sync, no analytics, no Sentry. Unlike the Check-In store
// there is NO push-backup carve-out — the SR-4 ADR covers consented mood
// self-tracking only; assessment tools stay on the device, full stop.
//
// WHAT IS PERSISTED: composite (0–100), tier, the five domain scores, a device-local
// calendar date, and an id. The raw item-level `answers` are NEVER persisted — they
// live only in the flow reducer's in-memory state and vanish when the flow unmounts.
//
// Versioned + forward-only migrator (SR-13): a corrupt/foreign blob is quarantined
// (preserved verbatim under a unique key) rather than silently lost, then the store
// continues on a best-effort recovered subset. Pure (no React, no RN) → Vitest; the
// DI seam (storage / clock / id) keeps the date rule and migration deterministic.

import type { Storage } from '@/lib/adapters/storage';

import type { ClarityDomainScores, ClarityResult, ClarityTier } from './types';

export const CLARITY_STORAGE_KEY = 'mobile:clarity-results';
export const CLARITY_QUARANTINE_PREFIX = `${CLARITY_STORAGE_KEY}:quarantine:`;
export const CLARITY_SCHEMA_VERSION = 1 as const;
/** Keep at most this many snapshots locally (newest retained). */
export const CLARITY_HISTORY_CAP = 100;

const TIERS: ReadonlySet<string> = new Set<ClarityTier>([
  'thriving',
  'balanced',
  'mixed',
  'strained',
  'reachOut',
]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One persisted assessment result. `id` + `date` are minted at save and immutable. */
export interface ClaritySnapshot {
  readonly id: string;
  /** Device-local calendar day, `YYYY-MM-DD`. */
  readonly date: string;
  readonly composite: number;
  readonly tier: ClarityTier;
  readonly domains: ClarityDomainScores;
}

interface PersistedClarity {
  readonly version: number;
  readonly entries: ClaritySnapshot[];
}

export interface ClarityStoreDeps {
  readonly storage: Storage;
  readonly now: () => Date;
  readonly generateId: () => string;
}

/** Local-calendar day (`YYYY-MM-DD`) from a Date, using LOCAL accessors (not UTC). */
function toLocalDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isDomainScores(value: unknown): value is ClarityDomainScores {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (['emotional', 'wellbeing', 'social', 'stress', 'functioning'] as const).every(
    (k) => typeof v[k] === 'number' && Number.isFinite(v[k] as number),
  );
}

function isSnapshot(value: unknown): value is ClaritySnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.date === 'string' &&
    DATE_RE.test(v.date) &&
    typeof v.composite === 'number' &&
    Number.isFinite(v.composite) &&
    typeof v.tier === 'string' &&
    TIERS.has(v.tier) &&
    isDomainScores(v.domains)
  );
}

/** Strip unknown keys from a validated snapshot (defends against hand-edited blobs). */
function canonical(s: ClaritySnapshot): ClaritySnapshot {
  return {
    id: s.id,
    date: s.date,
    composite: s.composite,
    tier: s.tier,
    domains: {
      emotional: s.domains.emotional,
      wellbeing: s.domains.wellbeing,
      social: s.domains.social,
      stress: s.domains.stress,
      functioning: s.domains.functioning,
    },
  };
}

type LoadOutcome =
  | { status: 'clean'; entries: ClaritySnapshot[] }
  | { status: 'anomaly'; entries: ClaritySnapshot[]; raw: string };

/** Parse + validate the persisted blob. Forward-only; v1 is the first schema. */
function loadBlob(raw: string | null): LoadOutcome {
  if (raw === null) return { status: 'clean', entries: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'anomaly', entries: [], raw };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { status: 'anomaly', entries: [], raw };
  }

  const env = parsed as { version?: unknown; entries?: unknown };
  if (env.version !== CLARITY_SCHEMA_VERSION) {
    // Missing / older / newer version: no migration path yet — preserve, recover none.
    return { status: 'anomaly', entries: [], raw };
  }
  if (!Array.isArray(env.entries)) {
    return { status: 'anomaly', entries: [], raw };
  }

  const entries: ClaritySnapshot[] = [];
  let dropped = false;
  for (const candidate of env.entries) {
    if (isSnapshot(candidate)) entries.push(canonical(candidate));
    else dropped = true;
  }
  return dropped ? { status: 'anomaly', entries, raw } : { status: 'clean', entries };
}

export class ClarityResultStore {
  private readonly storage: Storage;
  private readonly now: () => Date;
  private readonly generateId: () => string;
  private entries: ClaritySnapshot[] = []; // oldest → newest

  constructor(deps: ClarityStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  /** Persist a completed result as a new snapshot; returns the stored snapshot. */
  save(result: ClarityResult): ClaritySnapshot {
    const snapshot: ClaritySnapshot = {
      id: this.generateId(),
      date: toLocalDate(this.now()),
      composite: result.composite,
      tier: result.tier,
      domains: result.domains,
    };
    this.entries.push(snapshot);
    if (this.entries.length > CLARITY_HISTORY_CAP) {
      this.entries = this.entries.slice(-CLARITY_HISTORY_CAP);
    }
    this.persist();
    return { ...snapshot };
  }

  /** The `n` most recent snapshots, newest first. `n <= 0` ⇒ []. */
  getRecent(n: number): ClaritySnapshot[] {
    if (!Number.isInteger(n) || n <= 0) return [];
    return this.entries.slice(-n).reverse().map((s) => ({ ...s }));
  }

  /** Total stored snapshots. */
  get count(): number {
    return this.entries.length;
  }

  private persist(): void {
    const payload: PersistedClarity = { version: CLARITY_SCHEMA_VERSION, entries: this.entries };
    this.storage.set(CLARITY_STORAGE_KEY, JSON.stringify(payload));
  }

  private load(): void {
    const raw = this.storage.get(CLARITY_STORAGE_KEY);
    const outcome = loadBlob(raw);
    this.entries = outcome.entries;

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data) under a unique key,
      // then rewrite the primary key to the recovered subset so the next launch is clean.
      const stamp = `${this.now().toISOString()}-${this.generateId()}`;
      this.storage.set(`${CLARITY_QUARANTINE_PREFIX}${stamp}`, outcome.raw);
      this.persist();
    }
  }
}
