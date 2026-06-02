// Mobile DI seam proof — `runSymptomNavigator` consumed through the
// `@psychage/shared/navigator` barrel, with the featureFlags adapter's
// `IsTierEnabledFn`-typed predicate injected at the call site per
// rules/conventions.md #3.
//
// Two assertions:
//   1. default predicate (web parity): a Tier-4 condition surfaces.
//   2. restrictive predicate (tier < 4): Tier-4 is filtered, lower tiers stay.
// Both assert every relevance_score ≤ 0.75 (Sacred Rule #1).
//
// The KB is built inline against the public types only — packages/shared's
// internal test-helpers are not on the exports map (deep imports do not
// resolve through the barrel).

import {
  type ConditionCategory,
  type ConditionWithMappings,
  DEFAULT_MATCHING_CONFIG,
  type KnowledgeBase,
  runSymptomNavigator,
  type Symptom,
  type UserSymptomInput,
} from "@psychage/shared/navigator";
import { describe, expect, it } from "vitest";

import { type IsTierEnabledFn, isTierEnabled } from "@/lib/adapters";

const SYMPTOM_IDS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

function makeSymptom(id: string): Symptom {
  return {
    id,
    domain: "emotional",
    category: "mood",
    name: id,
    description: "",
    synonyms: [],
    ask_duration: true,
    ask_severity: true,
    ask_frequency: true,
    is_red_flag: false,
    red_flag_level: null,
    severity_red_flag_threshold: null,
    severity_red_flag_level: null,
    display_order: 0,
    is_active: true,
    version: "1.0.0",
  };
}

function makeCondition(id: string, category: ConditionCategory): ConditionWithMappings {
  return {
    id,
    name: id,
    full_name: id,
    category,
    description_for_user: "",
    minimum_duration: "2_weeks",
    minimum_duration_display: "",
    minimum_symptoms_for_relevance: 2,
    always_recommend_professional: false,
    guide_path: "",
    coping_path: "",
    provider_questions: [],
    clinical_notes: "",
    is_active: true,
    version: "1.0.0",
    symptom_mappings: SYMPTOM_IDS.map((sid) => ({
      symptom_id: sid,
      weight: 3 as const,
      role: "core" as const,
    })),
    red_flags: [],
  };
}

// SCZ → Tier 1; NPD → Tier 4 (per packages/shared/navigator/featureFlags.ts
// TIER_MAP). Different categories so rankAndDiversify's max_per_family cap
// does not drop either.
const kb: KnowledgeBase = {
  version: "1.0.0",
  symptoms: SYMPTOM_IDS.map(makeSymptom),
  conditions: [makeCondition("SCZ", "psychotic"), makeCondition("NPD", "personality")],
  matchingConfig: DEFAULT_MATCHING_CONFIG,
  crisisResources: {},
};

const userInputs: UserSymptomInput[] = SYMPTOM_IDS.map((sid) => ({
  symptom_id: sid,
  severity: 7,
  duration: "more_than_1_year",
  frequency: "often",
}));

describe("mobile DI seam — runSymptomNavigator + featureFlags adapter", () => {
  it("default predicate via adapter: Tier-4 condition surfaces (web parity); every relevance_score ≤ 0.75", () => {
    const result = runSymptomNavigator(userInputs, kb, undefined, isTierEnabled);

    const ids = result.results.map((r) => r.condition_id);
    expect(ids).toContain("NPD");
    expect(ids).toContain("SCZ");
    for (const r of result.results) {
      expect(r.relevance_score).toBeLessThanOrEqual(0.75);
    }
  });

  it("restrictive predicate (tier < 4): Tier-4 filtered out; lower-tier results remain; every relevance_score ≤ 0.75", () => {
    const restrictive: IsTierEnabledFn = (tier) => tier < 4;

    const result = runSymptomNavigator(userInputs, kb, undefined, restrictive);

    const ids = result.results.map((r) => r.condition_id);
    expect(ids).not.toContain("NPD");
    expect(ids).toContain("SCZ");
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.relevance_score).toBeLessThanOrEqual(0.75);
    }
  });
});
