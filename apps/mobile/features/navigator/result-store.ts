// NavigatorResultStore — the local-only history of completed Symptom Navigator runs.
//
// LOCAL-ONLY (SR-4, hard invariant). Writes to the injected Storage seam and
// NOWHERE else: no Supabase, no network, no sync, no analytics, no Sentry.
// Symptom-navigator state is client-side only — this store keeps it that way; it
// merely lets the device remember past runs for the Navigator dashboard and the
// user-initiated therapist export. Crisis-halt runs are NEVER persisted (the
// caller guards on `safety.should_halt`).
//
// WHAT IS PERSISTED: the symptom inputs the person chose, the full computed
// NavigatorResults (already confidence-capped at 0.75 by the engine), a
// device-local calendar date, the engine's ISO timestamp, and a minted id.

import type { NavigatorResults, UserSymptomInput } from '@psychage/shared/navigator';

import type { Storage } from '@/lib/adapters/storage';

export const NAVIGATOR_STORAGE_KEY = 'mobile:navigator-results';
export const NAVIGATOR_QUARANTINE_PREFIX = `${NAVIGATOR_STORAGE_KEY}:quarantine:`;
export const NAVIGATOR_SCHEMA_VERSION = 1 as const;
/** Keep at most this many runs locally (newest retained). */
export const NAVIGATOR_HISTORY_CAP = 50;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One persisted Navigator run. `id` + `date` are minted at save and immutable. */
export interface NavigatorSnapshot {
  readonly id: string;
  /** Device-local calendar day, `YYYY-MM-DD`. */
  readonly date: string;
  /** ISO-8601 instant the engine computed the results. */
  readonly createdAt: string;
  readonly inputs: UserSymptomInput[];
  readonly results: NavigatorResults;
}

interface PersistedNavigator {
  readonly version: number;
  readonly entries: NavigatorSnapshot[];
}

export interface NavigatorStoreDeps {
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

/** Shallow structural validation — enough to defend against hand-edited blobs. */
function isResults(value: unknown): value is NavigatorResults {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.safety === 'object' &&
    v.safety !== null &&
    Array.isArray(v.results) &&
    typeof v.timestamp === 'string'
  );
}

function isSnapshot(value: unknown): value is NavigatorSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.date === 'string' &&
    DATE_RE.test(v.date) &&
    typeof v.createdAt === 'string' &&
    Array.isArray(v.inputs) &&
    isResults(v.results)
  );
}

type LoadOutcome =
  | { status: 'clean'; entries: NavigatorSnapshot[] }
  | { status: 'anomaly'; entries: NavigatorSnapshot[]; raw: string };

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
  if (env.version !== NAVIGATOR_SCHEMA_VERSION || !Array.isArray(env.entries)) {
    return { status: 'anomaly', entries: [], raw };
  }

  const entries: NavigatorSnapshot[] = [];
  let dropped = false;
  for (const candidate of env.entries) {
    if (isSnapshot(candidate)) entries.push(candidate);
    else dropped = true;
  }
  return dropped ? { status: 'anomaly', entries, raw } : { status: 'clean', entries };
}

export class NavigatorResultStore {
  private readonly storage: Storage;
  private readonly now: () => Date;
  private readonly generateId: () => string;
  private entries: NavigatorSnapshot[] = []; // oldest → newest

  constructor(deps: NavigatorStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  /** Persist a completed (non-crisis) run; returns the stored snapshot. */
  save(inputs: UserSymptomInput[], results: NavigatorResults): NavigatorSnapshot {
    const snapshot: NavigatorSnapshot = {
      id: this.generateId(),
      date: toLocalDate(this.now()),
      createdAt: results.timestamp,
      inputs: inputs.map((i) => ({ ...i })),
      results,
    };
    this.entries.push(snapshot);
    if (this.entries.length > NAVIGATOR_HISTORY_CAP) {
      this.entries = this.entries.slice(-NAVIGATOR_HISTORY_CAP);
    }
    this.persist();
    return snapshot;
  }

  /** The `n` most recent runs, newest first. `n <= 0` ⇒ []. */
  getRecent(n: number): NavigatorSnapshot[] {
    if (!Number.isInteger(n) || n <= 0) return [];
    return this.entries.slice(-n).reverse();
  }

  /** Find a run by id, or undefined. */
  getById(id: string): NavigatorSnapshot | undefined {
    return this.entries.find((e) => e.id === id);
  }

  /** Forget one run (P41 — user-initiated "remove this exploration"). Returns true when
   *  a run was removed. Local-only delete; nothing leaves the device. */
  delete(id: string): boolean {
    const next = this.entries.filter((e) => e.id !== id);
    if (next.length === this.entries.length) return false;
    this.entries = next;
    this.persist();
    return true;
  }

  /** Forget every stored run (P41 — clear local history). */
  clear(): void {
    if (this.entries.length === 0) return;
    this.entries = [];
    this.persist();
  }

  /** Total stored runs. */
  get count(): number {
    return this.entries.length;
  }

  private persist(): void {
    const payload: PersistedNavigator = { version: NAVIGATOR_SCHEMA_VERSION, entries: this.entries };
    this.storage.set(NAVIGATOR_STORAGE_KEY, JSON.stringify(payload));
  }

  private load(): void {
    const raw = this.storage.get(NAVIGATOR_STORAGE_KEY);
    const outcome = loadBlob(raw);
    this.entries = outcome.entries;

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data) under a unique key,
      // then rewrite the primary key to the recovered subset.
      const stamp = `${this.now().toISOString()}-${this.generateId()}`;
      this.storage.set(`${NAVIGATOR_QUARANTINE_PREFIX}${stamp}`, outcome.raw);
      this.persist();
    }
  }
}
