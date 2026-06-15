// RelationshipResultStore — on-device history for completed assessments.
//
// LOCAL-ONLY (SR-4). Writes to the injected Storage seam and nowhere else — no
// Supabase, no network, no sync, no analytics, no Sentry. The full result
// (including raw `answers`) lives only in MMKV on the device.
//
// Modeled on packages/shared/check-in/record-store.ts: storage + clock + id
// factory are injected (apps/mobile CLAUDE.md convention #3) so the pure scoring
// module stays free of `crypto`/`Date`. `saveResult` is where the persistence
// stamps land — the IdFactory mints `id`, the Clock stamps `createdAt`. Tests
// inject an in-memory Map + fixed clock + counter; the app injects MMKV +
// generateId (apps/mobile/lib/relationship-store.ts).

import {
  type AnomalyReason,
  compareByCreatedAtDesc,
  migrate,
  type PersistedResults,
  QUARANTINE_KEY_PREFIX,
  SCHEMA_VERSION,
  serialize,
  STORAGE_KEY,
} from './migrate';
import type { ComputedRelationshipResult } from './scoring';
import type { RelationshipHealthResult } from './types';

/** Minimal key-value seam — structurally matches apps/mobile/lib/adapters/storage. */
export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export type Clock = () => Date;
export type IdFactory = () => string;

export interface RelationshipStoreDeps {
  readonly storage: Storage;
  readonly now: Clock;
  readonly generateId: IdFactory;
}

/**
 * A surfaced load anomaly. The raw blob is preserved verbatim at `quarantineKey`;
 * the store continued on a best-effort recovered subset of `recoveredCount`
 * results. Surfaced (not swallowed) so a later recovery UI / telemetry can act.
 */
export interface RelationshipAnomaly {
  readonly reason: AnomalyReason;
  readonly quarantineKey: string;
  readonly recoveredCount: number;
  readonly detectedAtIso: string;
}

function cloneResult(result: RelationshipHealthResult): RelationshipHealthResult {
  // Structured copy keeps history reads immutable against external mutation.
  return JSON.parse(JSON.stringify(result)) as RelationshipHealthResult;
}

export class RelationshipResultStore {
  private readonly storage: Storage;
  private readonly now: Clock;
  private readonly generateId: IdFactory;

  /** Newest first. */
  private results: RelationshipHealthResult[] = [];
  private anomaly: RelationshipAnomaly | null = null;

  constructor(deps: RelationshipStoreDeps) {
    this.storage = deps.storage;
    this.now = deps.now;
    this.generateId = deps.generateId;
    this.load();
  }

  // ── reads ──────────────────────────────────────────────────────────────────

  /** All saved results, newest first. Returns clones. */
  loadHistory(): RelationshipHealthResult[] {
    return this.results.map(cloneResult);
  }

  /** The result with `id`, or undefined. Returns a clone. */
  getResult(id: string): RelationshipHealthResult | undefined {
    const found = this.results.find((r) => r.id === id);
    return found ? cloneResult(found) : undefined;
  }

  /** The most recent surfaced load anomaly, or null when the last load was clean. */
  get lastAnomaly(): RelationshipAnomaly | null {
    return this.anomaly;
  }

  // ── writes ─────────────────────────────────────────────────────────────────

  /**
   * Stamp a freshly computed result with `id` (IdFactory) + `createdAt` (Clock)
   * and prepend it to history. Returns the stored result.
   */
  saveResult(computed: ComputedRelationshipResult): RelationshipHealthResult {
    const result: RelationshipHealthResult = {
      ...computed,
      id: this.generateId(),
      createdAt: this.now().toISOString(),
    };
    this.results.unshift(result);
    this.results.sort(compareByCreatedAtDesc);
    this.persist();
    return cloneResult(result);
  }

  /** Remove the result with `id`; returns the remaining history (newest first, clones). */
  deleteResult(id: string): RelationshipHealthResult[] {
    this.results = this.results.filter((r) => r.id !== id);
    this.persist();
    return this.loadHistory();
  }

  /** Wipe all saved results. */
  clearHistory(): void {
    this.results = [];
    this.persist();
  }

  // ── internals ────────────────────────────────────────────────────────────────

  private snapshot(): PersistedResults {
    return { version: SCHEMA_VERSION, results: [...this.results].sort(compareByCreatedAtDesc) };
  }

  private persist(): void {
    this.storage.set(STORAGE_KEY, serialize(this.snapshot()));
  }

  private hydrate(value: PersistedResults): void {
    this.results = [...value.results].sort(compareByCreatedAtDesc);
  }

  /** Read → migrate → quarantine-if-anomalous → hydrate → restamp-if-needed. */
  private load(): void {
    const raw = this.storage.get(STORAGE_KEY);
    const outcome = migrate(raw);

    if (outcome.status === 'anomaly') {
      // Preserve the raw blob (never silently lose user data), continue on the
      // best-effort recovered subset, and surface the anomaly. The key carries a
      // unique suffix so two anomalies at the same instant can't clobber.
      const detectedAtIso = this.now().toISOString();
      const quarantineKey = `${QUARANTINE_KEY_PREFIX}${detectedAtIso}-${this.generateId()}`;
      this.storage.set(quarantineKey, outcome.raw);
      this.hydrate(outcome.value);
      this.anomaly = {
        reason: outcome.reason,
        quarantineKey,
        recoveredCount: outcome.value.results.length,
        detectedAtIso,
      };
      // Reset the primary key to the clean recovered shape so the next launch reads
      // a valid envelope and does not re-quarantine the same blob.
      this.persist();
      return;
    }

    this.hydrate(outcome.value);
    // Restamp when the stored form is missing or non-canonical so subsequent loads
    // are pass-through.
    const canonical = serialize(outcome.value);
    if (raw !== canonical) this.storage.set(STORAGE_KEY, canonical);
  }
}
