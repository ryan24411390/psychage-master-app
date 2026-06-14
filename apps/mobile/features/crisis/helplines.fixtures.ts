// The bundled crisis dataset S11/S12/S17 consume — DERIVED from the CT3 verified seed.
//
// `CRISIS_DATASET` is computed from `helplines.seed.ts` at module load:
//   - emergencyByRegion ← every seeded country's emergency number.
//   - regions          ← every seeded country (code + name), sorted by name for S12.
//   - helplinesByRegion ← ONLY `verified` helplines, grouped by country, ordered by the
//                          seed's displayOrder. `needs_verification` and `do_not_publish`
//                          rows are filtered OUT here and never reach the UI — this is the
//                          single gating boundary the seed's notes require.
// A country with no verified rows is simply absent from `helplinesByRegion` → the S11
// dataset-gap state (its `hasVerifiedHelplines` flag is false). Descriptions are DRAFT →
// CT4. 112 is the GSM-standard last-resort default.
//
// SR-4: reference data only; nothing user-specific.

import type { CrisisDataset, HelplineRow, RegionOption } from './helpline-schema';
import { CRISIS_SEED, type SeedHelpline } from './helplines.seed';

/** Project a verified seed helpline onto the shipped five-field row. */
function toHelplineRow(h: SeedHelpline): HelplineRow {
  return {
    name: h.name,
    fiveWordDesc: h.description,
    callNumber: h.callNumber,
    // textCapable is now derived from a real text number; a row is text-capable only
    // when both the flag is set AND a number exists to text.
    textNumber: h.textCapable ? h.textNumber : null,
    region: h.countryIso2,
  };
}

const emergencyByRegion: Record<string, string> = {};
for (const country of CRISIS_SEED.countries) {
  emergencyByRegion[country.iso2] = country.emergencyNumber;
}

// Group verified, reachable helplines by country, ordered by the seed's displayOrder.
const verified = CRISIS_SEED.helplines
  .filter((h) => h.verificationStatus === 'verified') // gating boundary
  // Defensive: a row with no way to reach help cannot render usefully — skip it.
  .filter((h) => h.callNumber !== null || (h.textCapable && h.textNumber !== null))
  .sort((a, b) => a.displayOrder - b.displayOrder);

const helplinesByRegion: Record<string, HelplineRow[]> = {};
for (const h of verified) {
  const bucket = helplinesByRegion[h.countryIso2] ?? [];
  bucket.push(toHelplineRow(h));
  helplinesByRegion[h.countryIso2] = bucket;
}

const regions: RegionOption[] = CRISIS_SEED.countries
  .map((c) => ({ code: c.iso2, name: c.countryName }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const CRISIS_DATASET: CrisisDataset = {
  emergencyByRegion,
  helplinesByRegion,
  regions,
  defaultEmergencyNumber: '112',
};
