// Public contract for the mobile crisis DATA layer.
//
// This is the WEB-parity contract from the CT3 work order: getCrisisResources /
// listCrisisCountries returning a 6-field HelplineRow. It is INTENTIONALLY
// distinct from the frozen presentational schema in
// `features/crisis/helpline-schema.ts` (5 fields, `fiveWordDesc`, no
// `textNumber`). Reconciling the two — and wiring this data layer into the
// existing S11/S12 screens — is owned by the crisis-UI wave. See
// `lib/crisis/HANDOFF.md`.
//
// SR-4: nothing here is symptom data. This is PUBLIC reference data.

/** One verified helpline, shaped to the web design-library binding. */
export interface HelplineRow {
  name: string;
  description: string;
  callNumber: string | null;
  textCapable: boolean;
  textNumber: string | null;
  region: string; // iso2
}

export interface CrisisResources {
  emergencyNumber: string;
  emergencyNote: string | null;
  hasVerifiedHelplines: boolean;
  helplines: HelplineRow[];
}

export interface CrisisCountrySummary {
  iso2: string;
  name: string;
}
