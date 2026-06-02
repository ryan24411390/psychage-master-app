/**
 * Critical Finding #1 guard.
 *
 * If a knowledge-base API response (or admin edit) supplies a
 * confidence_cap above 0.75, the engine MUST floor it at 0.75. This test
 * exercises both runSymptomNavigator (which wraps the config once) and
 * calculateConditionScore (which floors per-call) so neither path regresses.
 */

import { describe, expect, it } from "vitest";
import { CONFIDENCE_CAP } from "../constants";
import { runSymptomNavigator } from "../engine";
import { calculateConditionScore } from "../scoring";
import type { ConditionWithMappings, KnowledgeBase } from "../types";
import { DEFAULT_MATCHING_CONFIG } from "../utils";

const HOSTILE_CAP = 0.99;

const symptom = {
  id: "S1",
  domain: "emotional" as const,
  category: "mood",
  name: "Sadness",
  description: "",
  synonyms: [],
  ask_duration: false,
  ask_severity: false,
  ask_frequency: false,
  is_red_flag: false,
  red_flag_level: null,
  severity_red_flag_threshold: null,
  severity_red_flag_level: null,
  display_order: 1,
  is_active: true,
  version: "1.0.0",
};

const condition: ConditionWithMappings = {
  id: "TEST_COND",
  name: "Test Condition",
  full_name: "Test Condition",
  category: "test",
  description_for_user: "",
  minimum_duration: "less_than_1_month",
  minimum_symptoms_for_relevance: 1,
  guide_path: "",
  coping_path: "",
  provider_questions: [],
  always_recommend_professional: false,
  is_active: true,
  version: "1.0.0",
  symptom_mappings: [{ symptom_id: "S1", weight: 3, role: "core" }],
};

const hostileKB: KnowledgeBase = {
  symptoms: [symptom],
  conditions: [condition],
  crisisResources: [],
  matchingConfig: {
    ...DEFAULT_MATCHING_CONFIG,
    confidence_cap: HOSTILE_CAP,
  },
};

describe("CONFIDENCE_CAP floor (Critical Finding #1)", () => {
  it("CONFIDENCE_CAP constant is 0.75", () => {
    expect(CONFIDENCE_CAP).toBe(0.75);
  });

  it("runSymptomNavigator floors a hostile config cap at 0.75", () => {
    const result = runSymptomNavigator(
      [{ symptom_id: "S1", severity: 10, frequency: "always", duration: "more_than_1_year" }],
      hostileKB,
    );
    for (const item of result.results) {
      expect(item.relevance_score).toBeLessThanOrEqual(CONFIDENCE_CAP);
    }
  });

  it("calculateConditionScore floors hostile cap when invoked directly", () => {
    const userSymptoms = [
      {
        symptom_id: "S1",
        symptom: symptom,
        severity: 10,
        frequency: "always" as const,
        duration: "more_than_1_year" as const,
      },
    ];
    const score = calculateConditionScore(userSymptoms, condition, {
      confidence_cap: HOSTILE_CAP,
      below_minimum_penalty: DEFAULT_MATCHING_CONFIG.below_minimum_penalty,
      severity_modifiers: DEFAULT_MATCHING_CONFIG.severity_modifiers,
      frequency_modifiers: DEFAULT_MATCHING_CONFIG.frequency_modifiers,
      duration_modifiers: DEFAULT_MATCHING_CONFIG.duration_modifiers,
    });
    expect(score.capped_score).toBeLessThanOrEqual(CONFIDENCE_CAP);
  });
});
