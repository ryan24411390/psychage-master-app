// DEV-ONLY route. Phase 6 Slice 9 verification surface for runSymptomNavigator
// on-device. NOT a production screen. Reached via a `__DEV__`-gated link on
// the Today tab. Remove or production-gate before V1 ship.
//
// Runs the same canned KB + inputs as `__tests__/navigator-seam.test.ts` so
// device output is byte-comparable to the node test (web parity check).

import {
  type ConditionCategory,
  type ConditionWithMappings,
  DEFAULT_MATCHING_CONFIG,
  type KnowledgeBase,
  runSymptomNavigator,
  type Symptom,
  type UserSymptomInput,
} from "@psychage/shared/navigator";
import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Text as RNText, ScrollView, View } from "react-native";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Text } from "@/components/ui/Text";
import { isTierEnabled, storage } from "@/lib/adapters";
import { loadTierFlags, SCHEMA_VERSION, STORAGE_KEY } from "@/lib/persistence/tier-flags";

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

export default function DevNavigatorScreen() {
  const [tierFlags, setTierFlags] = useState(() => loadTierFlags(storage));

  const result = runSymptomNavigator(userInputs, kb, undefined, isTierEnabled);
  const capHolds = result.results.every((r) => r.relevance_score <= 0.75);

  const toggleTier4 = () => {
    const next = { ...tierFlags, 4: !tierFlags[4] };
    storage.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, data: next }));
    setTierFlags(next);
  };

  const reseed = () => {
    storage.remove(STORAGE_KEY);
    setTierFlags(loadTierFlags(storage));
  };

  return (
    <ScreenShell>
      <Stack.Screen options={{ headerShown: true, title: "Dev — Verify" }} />
      <ScrollView contentContainerClassName="gap-6 py-4">
        {/* Font sample — verifies 3 families load (not system fallback). */}
        <View className="gap-2">
          <Text variant="caption">FONTS (expect distinct typefaces, not system fallback)</Text>
          <RNText style={{ fontFamily: "Satoshi", fontSize: 22 }}>
            Satoshi — sans · the quick brown fox 0123456789
          </RNText>
          <RNText style={{ fontFamily: "Satoshi", fontSize: 22 }}>
            Satoshi — display · the quick brown fox
          </RNText>
          <RNText style={{ fontFamily: "IBM Plex Mono", fontSize: 18 }}>
            IBM Plex Mono — mono · const x = 42;
          </RNText>
          <RNText style={{ fontSize: 18 }}>System fallback (no fontFamily) · same string</RNText>
        </View>

        {/* MMKV tier-flags — verifies persistence across launches. */}
        <View className="gap-2">
          <Text variant="caption">MMKV TIER-FLAGS (toggle, force-quit, relaunch, verify)</Text>
          <Text variant="body">
            {Object.entries(tierFlags)
              .map(([t, on]) => `T${t}:${on ? "on" : "off"}`)
              .join(" · ")}
          </Text>
          <Pressable
            onPress={toggleTier4}
            className="bg-primary dark:bg-primary-dark rounded-lg p-3"
          >
            <Text variant="body" className="text-white text-center">
              Toggle Tier 4 ({tierFlags[4] ? "on→off" : "off→on"})
            </Text>
          </Pressable>
          <Pressable
            onPress={reseed}
            className="border border-border dark:border-border-dark rounded-lg p-3"
          >
            <Text variant="body" className="text-center">
              Reseed (remove key + reload defaults)
            </Text>
          </Pressable>
        </View>

        {/* Navigator results — verifies shared package + DI seam on-device. */}
        <View className="gap-2">
          <Text variant="caption">runSymptomNavigator (web-parity: contains SCZ + NPD)</Text>
          <Text variant="body">
            Results: {result.results.length} · Cap ≤ 0.75: {capHolds ? "PASS" : "FAIL"}
          </Text>
          {result.results.map((r) => (
            <View
              key={r.condition_id}
              className="border border-border dark:border-border-dark rounded-lg p-3 gap-1"
            >
              <Text variant="heading">{r.condition_id}</Text>
              <Text variant="bodySm">
                relevance: {r.relevance_score.toFixed(4)} · level: {r.relevance_level}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
