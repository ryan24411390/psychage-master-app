// Conditions reference — view-model types.
//
// SCOPE: a BROWSE layer over the live, clinically-reviewed `conditions_reference`
// table (the same source the web /conditions page reads). It surfaces the ICD-11
// taxonomy (family → conditions) and each condition's reviewed plain-language
// definition + the articles linked to it. It authors NO clinical text — every
// user-facing definition string rides verbatim from the verified DB row. It is
// NOT a diagnostic flow (SR-3); symptom checking lives only in the Navigator.

/** One verified condition row, list shape (family accordion). */
export type ConditionRef = {
  slug: string;
  name: string;
  /** ICD-11 code, e.g. "6B01" — shown muted next to the name. */
  icd11Code: string;
  /** ICD-11 family/grouping label — the accordion bucket. */
  family: string;
  /** Reviewed crisis flag — gates the crisis banner on the guide (SR-2). */
  crisisFlag: boolean;
};

/** One condition with its reviewed definition sections (guide screen). All
 * definition text is verbatim from the verified DB row — never authored here. */
export type ConditionDetailRef = ConditionRef & {
  /** Row UUID — keys the `articles.linked_condition_ids` related-articles join. */
  id: string;
  shortDefinition: string | null;
  whatItFeelsLike: string | null;
  howItDiffers: string | null;
  whenMoreThanEveryday: string | null;
};

/** A family bucket for the accordion: the family label + its member conditions
 * (alphabetical by name). `count` is the member count (matches the web). */
export type ConditionFamilyGroup = {
  family: string;
  members: ConditionRef[];
  count: number;
};
