// ⚠️ CT3 FIXTURE DATA — NOT SHIPPABLE. ⚠️
//
// Every helpline NAME, DESCRIPTION, and NUMBER below is DUMMY placeholder content,
// invented to exercise the frozen `helplineRow` schema and the S11/S12 UI. They are
// NOT real services and MUST NOT ship. The CT3 workstream owns the verified,
// region-correct helpline dataset (and the full country roster). Replace this whole
// module wholesale when CT3 lands.
//
// The ONLY real values here are the emergency numbers (999/911/112) — the order
// explicitly permits the well-known ones as OBVIOUS placeholders. CT3 still verifies
// the per-region map.
//
// The region roster is a deliberately SMALL subset (≤20) so S12 stays on core
// FlatList; the full ISO-3166 list (>20) + FlashList virtualization is CT3/infra.

import type { CrisisDataset, HelplineRow } from './helpline-schema';

// --- FIXTURE helpline rows (dummy names/numbers → CT3) -----------------------------
const US_FIXTURES: readonly HelplineRow[] = [
  {
    name: 'Sample Support Line',
    fiveWordDesc: 'Free confidential support, all hours',
    callNumber: '0-000-000-0001',
    textCapable: true,
    region: 'US',
  },
  {
    name: 'Sample Warmline',
    fiveWordDesc: 'Non-crisis listening and gentle company',
    callNumber: '0-000-000-0002',
    textCapable: false,
    region: 'US',
  },
];

const GB_FIXTURES: readonly HelplineRow[] = [
  {
    name: 'Sample Helpline UK',
    fiveWordDesc: 'Someone to talk to, anytime',
    callNumber: '0-000-000-0003',
    textCapable: true,
    region: 'GB',
  },
];

const BD_FIXTURES: readonly HelplineRow[] = [
  {
    name: 'Sample Helpline BD',
    fiveWordDesc: 'Free emotional support, every day',
    callNumber: '0-000-000-0004',
    textCapable: false,
    region: 'BD',
  },
];

// --- The bundled dataset (fixture) -------------------------------------------------
// IN (no helpline rows) is intentionally present in the roster + emergency map but
// ABSENT from helplinesByRegion, so resolving to IN exercises the dataset-gap state.
export const CRISIS_DATASET: CrisisDataset = {
  emergencyByRegion: {
    US: '911',
    GB: '999',
    BD: '999',
    IN: '112',
    AU: '000',
    CA: '911',
    DE: '112',
    FR: '112',
    ES: '112',
    SE: '112',
    BR: '188',
    NZ: '111',
    IE: '112',
    ZA: '112',
    NG: '112',
    JP: '110',
  },
  helplinesByRegion: {
    US: US_FIXTURES,
    GB: GB_FIXTURES,
    BD: BD_FIXTURES,
  },
  regions: [
    { code: 'AU', name: 'Australia' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IN', name: 'India' },
    { code: 'IE', name: 'Ireland' },
    { code: 'JP', name: 'Japan' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
  ],
  defaultEmergencyNumber: '112',
};
