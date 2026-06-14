// Crisis data store — offline-first resolution over the CT3 bundle.
//
// Resolution order per rules/offline.md §6 + the CT3 work order:
//   1. MMKV-cached latest  (written by refresh() after a successful fetch)
//   2. silent network refresh when online  (refresh(), writes MMKV)
//   3. committed bundle  (the always-present offline floor; ships in the JS binary)
// Reads NEVER require the network. Offline → MMKV/bundle serve fully.
//
// Pure, dependency-injected (storage + fetcher + floor bundle) so logic tests
// run under node with a Map-backed Storage double — matching the
// CheckInRecordStore seam. The real wiring lives in `index.ts`.
//
// SR-13: the MMKV cache is versioned. A cache written by an incompatible
// version (or any corrupt/garbage value) is discarded and removed, and the
// committed bundle floor is served — crisis ALWAYS renders, never throws.
// SR-4: bundle/cache hold only PUBLIC reference data; no symptom/mood state.

import type { CrisisBundle, CrisisBundleHelpline } from '@/data/crisis/crisis-bundle.types';
import type { Storage } from '@/lib/adapters/storage';

import type { CrisisCountrySummary, CrisisResources, HelplineRow } from './types';

const CACHE_KEY = 'mobile:crisis-cache';
const CACHE_VERSION = 1;

interface PersistedCache {
  version: number;
  bundle: CrisisBundle;
}

export interface CrisisStoreDeps {
  /** MMKV-backed (native) or in-memory (test/node) storage adapter. */
  storage: Storage;
  /** The committed offline floor — always present, ships in the binary. */
  bundle: CrisisBundle;
  /**
   * Fetch the freshest verified dataset from the network. Resolves `null` when
   * unavailable (offline, no client, or any error) — the caller keeps existing
   * data. Implementations must never throw.
   */
  fetchVerified: () => Promise<CrisisBundle | null>;
}

function toHelplineRow(h: CrisisBundleHelpline): HelplineRow {
  return {
    name: h.name,
    description: h.description,
    callNumber: h.callNumber ?? null,
    textCapable: h.textCapable,
    textNumber: h.textNumber ?? null,
    region: h.region,
  };
}

export class CrisisStore {
  private readonly storage: Storage;
  private readonly bundle: CrisisBundle;
  private readonly fetchVerified: () => Promise<CrisisBundle | null>;

  constructor(deps: CrisisStoreDeps) {
    this.storage = deps.storage;
    this.bundle = deps.bundle;
    this.fetchVerified = deps.fetchVerified;
  }

  /** The active source: MMKV-cached latest if valid, else the bundle floor. */
  private source(): CrisisBundle {
    const raw = this.storage.get(CACHE_KEY);
    if (!raw) return this.bundle;
    try {
      const parsed = JSON.parse(raw) as PersistedCache;
      if (
        parsed?.version === CACHE_VERSION &&
        parsed.bundle &&
        Array.isArray(parsed.bundle.countries) &&
        Array.isArray(parsed.bundle.helplines)
      ) {
        return parsed.bundle;
      }
    } catch {
      // fall through to poison-clear below
    }
    // Corrupt or version-incompatible cache: discard it, serve the floor.
    this.storage.remove(CACHE_KEY);
    return this.bundle;
  }

  /** Resources for one country (S11). Unknown country → empty gap-state set. */
  getResources(iso2: string): CrisisResources {
    const region = (iso2 || '').toUpperCase();
    const data = this.source();
    const country = data.countries.find((c) => c.iso2 === region);
    if (!country) {
      return { emergencyNumber: '', emergencyNote: null, hasVerifiedHelplines: false, helplines: [] };
    }
    const helplines = data.helplines
      .filter((h) => h.region === region)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(toHelplineRow);
    return {
      emergencyNumber: country.emergencyNumber,
      emergencyNote: country.emergencyNote ?? null,
      hasVerifiedHelplines: country.hasVerifiedHelplines,
      helplines,
    };
  }

  /** Every country (iso2 + name), ordered by name — for the S12 picker. */
  listCountries(): CrisisCountrySummary[] {
    return this.source()
      .countries.map((c) => ({ iso2: c.iso2, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Silent network refresh. On success, writes the fresh verified dataset to
   * MMKV (so subsequent reads serve the latest) and returns true. On failure /
   * offline, keeps the existing cache and returns false. Never throws.
   */
  async refresh(): Promise<boolean> {
    const fresh = await this.fetchVerified();
    if (!fresh) return false;
    const payload: PersistedCache = { version: CACHE_VERSION, bundle: fresh };
    this.storage.set(CACHE_KEY, JSON.stringify(payload));
    return true;
  }
}
