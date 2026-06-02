// Slice 8d composition proof — persisted TierFlags → cold-start hydrate →
// `runSymptomNavigator` filtering through `isTierEnabled`.
//
// Three load-bearing assertions on the same canned KB:
//   1. v1 envelope { 4: true }  → Tier-4 (NPD) surfaces alongside Tier-1 (SCZ).
//   2. v1 envelope { 4: false } → Tier-4 (NPD) filtered out; lower tiers remain.
//   3. Every navigator result respects the 0.75 confidence cap (SR #1).
//
// Uses a local Map-backed Storage so the adapter singleton stays untouched.
// The seam under test is `loadTierFlags(storage)` + a closure-built
// `IsTierEnabledFn` — same shape `lib/adapters/featureFlags.ts` builds on
// device, only without the side-effect import.

import {
  type ConditionCategory,
  type ConditionWithMappings,
  DEFAULT_MATCHING_CONFIG,
  type IsTierEnabledFn,
  type KnowledgeBase,
  runSymptomNavigator,
  type Symptom,
  type UserSymptomInput,
} from "@psychage/shared/navigator";
import { describe, expect, it } from "vitest";

import type { Storage } from "@/lib/adapters/storage";
import {
  loadTierFlags,
  SCHEMA_VERSION,
  STORAGE_KEY,
  type Tier,
  type TierFlags,
} from "@/lib/persistence/tier-flags";

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

function makeStorage(seed?: Record<string, string>): Storage {
  const store = new Map<string, string>(seed ? Object.entries(seed) : []);
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
  };
}

function seedFlags(flags: Partial<TierFlags>): string {
  const merged: TierFlags = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, ...flags };
  return JSON.stringify({ version: SCHEMA_VERSION, data: merged });
}

describe("Slice 8d — persisted tier-flags → navigator composition", () => {
  it("Tier 4 enabled in storage → NPD surfaces on cold-start hydrate; cap ≤ 0.75 holds", () => {
    const storage = makeStorage({ [STORAGE_KEY]: seedFlags({ 4: true }) });

    const hydrated = loadTierFlags(storage);
    const isTierEnabled: IsTierEnabledFn = (tier) => hydrated[tier as Tier];

    const result = runSymptomNavigator(userInputs, kb, undefined, isTierEnabled);

    const ids = result.results.map((r) => r.condition_id);
    expect(ids).toContain("NPD");
    expect(ids).toContain("SCZ");
    for (const r of result.results) {
      expect(r.relevance_score).toBeLessThanOrEqual(0.75);
    }
  });

  it("Tier 4 disabled in storage → NPD filtered after cold-start hydrate; SCZ remains; cap ≤ 0.75", () => {
    const storage = makeStorage({ [STORAGE_KEY]: seedFlags({ 4: false }) });

    const hydrated = loadTierFlags(storage);
    const isTierEnabled: IsTierEnabledFn = (tier) => hydrated[tier as Tier];

    const result = runSymptomNavigator(userInputs, kb, undefined, isTierEnabled);

    const ids = result.results.map((r) => r.condition_id);
    expect(ids).not.toContain("NPD");
    expect(ids).toContain("SCZ");
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.relevance_score).toBeLessThanOrEqual(0.75);
    }
  });

  it("SR #4 check — composition does not write any symptom payload to storage", () => {
    const storage = makeStorage();

    const hydrated = loadTierFlags(storage);
    const isTierEnabled: IsTierEnabledFn = (tier) => hydrated[tier as Tier];

    runSymptomNavigator(userInputs, kb, undefined, isTierEnabled);

    // Only key written across the composition: the tier-flags envelope stamped
    // by loadTierFlags on default-seed. No symptom_id, severity, duration,
    // frequency, or mood reaches storage.
    const stored = storage.get(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.version).toBe(SCHEMA_VERSION);
    expect(Object.keys(parsed.data)).toEqual(["1", "2", "3", "4", "5", "6"]);
    // No other key written.
    for (const sid of SYMPTOM_IDS) {
      expect(storage.get(sid)).toBeNull();
      expect(storage.get(`mobile:${sid}`)).toBeNull();
    }
  });
});
