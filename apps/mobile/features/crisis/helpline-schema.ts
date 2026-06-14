// Crisis helpline SCHEMA (Wave A2, PR A — S11/S12).
//
// The `helplineRow` schema is FROZEN by the Wave A2 order prose. No such type
// exists on `main` (the only crisis type there is packages/shared/navigator
// `CrisisResource`, a richer Supabase-shaped record). This file builds the frozen
// five-field schema fresh. The actual verified helpline dataset + the full region
// roster are the CT3 content/infra workstream — this file is the SCHEMA + the
// emergency-number contract only. All concrete rows live in `helplines.fixtures.ts`
// and are flagged CT3.
//
// SR-4: nothing here is symptom data; the crisis surface persists only a region
// override (a country code), never anything about the user's state.

/** ISO 3166-1 alpha-2 region code (e.g. 'US', 'BD', 'GB'). Fixtures use a subset. */
export type RegionCode = string;

/**
 * One helpline row. The five fields ARE the frozen schema — add none, rename none.
 * `textCapable` true → S11 renders a Text button that opens messaging to `callNumber`
 * (the schema carries a single number; texting reuses it).
 */
export interface HelplineRow {
  readonly name: string;
  readonly fiveWordDesc: string;
  readonly callNumber: string;
  readonly textCapable: boolean;
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
