// Crisis helpline SCHEMA (Wave A2, PR A — S11/S12; extended for CT3).
//
// The Wave A2 order froze a five-field `helplineRow` (name, fiveWordDesc, callNumber,
// textCapable, region) when no verified dataset existed. CT3 then delivered the real
// verified dataset (see `helplines.seed.ts`), which carries call-only lines, text-only
// lines (shortcodes with no voice number), and lines whose TEXT number differs from
// their CALL number. The frozen single-number shape could not represent those without
// dialing/texting the wrong number — a crisis-safety failure. Per founder decision
// (2026-06-15) the schema is extended, still five fields: `callNumber` and `textNumber`
// are each independently nullable (texting no longer reuses the call number), replacing
// the `textCapable` boolean. `textCapable` is now derived: a row is text-capable iff
// `textNumber !== null`. Invariant: at least one of the two is non-null.
//
// SR-4: nothing here is symptom data; the crisis surface persists only a region
// override (a country code), never anything about the user's state.

/** ISO 3166-1 alpha-2 region code (e.g. 'US', 'BD', 'GB'). */
export type RegionCode = string;

/**
 * One helpline row. Five fields, all carried verbatim into S11/S17.
 * - `callNumber` — voice number, or `null` for a text-only line (no Call pill renders).
 * - `textNumber` — SMS number (may differ from `callNumber`), or `null` when the line
 *   is not text-capable (no Text pill renders).
 * Invariant (enforced at the fixture boundary): `callNumber` and `textNumber` are not
 * both null — every shipped row offers at least one way to reach help.
 */
export interface HelplineRow {
  readonly name: string;
  readonly fiveWordDesc: string;
  readonly callNumber: string | null;
  readonly textNumber: string | null;
  readonly region: RegionCode;
}

/** A country/region option for the S12 picker — name + code only (C-SEARCH-LIST). */
export interface RegionOption {
  readonly code: RegionCode;
  readonly name: string;
}

/**
 * The bundled crisis dataset S11 consumes. Ships in the binary (offline-complete);
 * the silent-when-online refresh is CT3/infra, not built here.
 *
 * - `emergencyByRegion` — the region-correct emergency number. The well-known
 *   numbers (999/911/112) are used as OBVIOUS placeholders per the order; CT3 owns
 *   the verified per-region map.
 * - `helplinesByRegion` — CT3 FIXTURE rows. A region absent here (or mapped to an
 *   empty list) is the dataset-gap state on S11.
 * - `regions` — the S12 picker roster (fixture subset; full ISO list is CT3).
 * - `defaultEmergencyNumber` — last-resort when the resolved region has no mapped
 *   number. 112 is the GSM-standard emergency number (routes to local emergency on
 *   most networks); flagged for CT3 verification.
 */
export interface CrisisDataset {
  readonly emergencyByRegion: Readonly<Record<RegionCode, string>>;
  readonly helplinesByRegion: Readonly<Record<RegionCode, readonly HelplineRow[]>>;
  readonly regions: readonly RegionOption[];
  readonly defaultEmergencyNumber: string;
}
