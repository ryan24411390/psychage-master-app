import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useMemo, useReducer, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NavigatorResults, UserSymptomInput } from '@psychage/shared/navigator';

import { SearchableList } from '@/components/SearchableList';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { HelplineRow } from '@/features/crisis/helpline-schema';
import { colors } from '@/lib/colors';

import { type NavigatorArea, type SymptomOption, symptomsForArea } from './areas';
import type { ClarifierQuestion } from './clarifiers';
import { ChipXL } from './components/ChipXL';
import { SymptomChip } from './components/SymptomChip';
import { NAVIGATOR_COPY } from './copy';
import {
  buildUserInputs,
  createNavigatorReducer,
  initialNavigatorState,
  isExitOnBack,
} from './flow';
import { HaltView } from './HaltView';
import { ResultsView, type ResultItemVM } from './ResultsView';

// The Symptom Navigator flow (S13–S18). Fully ON-DEVICE and in-memory — the reducer
// state lives in component state, so leaving the flow unmounts it and NOTHING persists
// (SR-4; abandon leaves zero residue, re-entry starts fresh). The scoring engine is
// INJECTED (`runNavigator`) so the shared package stays off every Jest path — this
// container imports only TYPES from @psychage/shared.

export type RunNavigator = (inputs: UserSymptomInput[]) => NavigatorResults;

const AREAS: ReadonlyArray<{ area: NavigatorArea; label: string }> = [
  { area: 'body', label: NAVIGATOR_COPY.areaBody },
  { area: 'mind', label: NAVIGATOR_COPY.areaMind },
  { area: 'sleep', label: NAVIGATOR_COPY.areaSleep },
  { area: 'both', label: NAVIGATOR_COPY.areaBoth },
];

// All chrome below is VERBATIM Flow Book (Flow 13), now sourced from ./copy (CT4 §9).
const SEVERITY_QUESTION = NAVIGATOR_COPY.severityQuestion;
const CONTINUE_LABEL = NAVIGATOR_COPY.continue;
const SOMETHING_ELSE = NAVIGATOR_COPY.somethingElse;
const SEARCH_PLACEHOLDER = NAVIGATOR_COPY.searchPlaceholder;
const SEARCH_A11Y = NAVIGATOR_COPY.searchA11y;
const NO_MATCH = NAVIGATOR_COPY.noMatch;

export interface NavigatorFlowProps {
  readonly symptoms: readonly SymptomOption[];
  readonly clarifiers: readonly ClarifierQuestion[];
  readonly runNavigator: RunNavigator;
  readonly onExit: () => void;
  readonly emergencyNumber: string;
  readonly helplines: readonly HelplineRow[];
  readonly onReadAbout: (conditionId: string) => void;
  readonly onSteadyingNow: () => void;
  readonly onFindCare: () => void;
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={NAVIGATOR_COPY.back}
      onPress={onPress}
      hitSlop={8}
      className="min-h-[44px] w-11 justify-center"
    >
      <ArrowLeft size={24} color={ink} strokeWidth={2} />
    </Pressable>
  );
}

export function NavigatorFlow({
  symptoms,
  clarifiers,
  runNavigator,
  onExit,
  emergencyNumber,
  helplines,
  onReadAbout,
  onSteadyingNow,
  onFindCare,
}: NavigatorFlowProps) {
  const reducer = useMemo(() => createNavigatorReducer(clarifiers), [clarifiers]);
  const [state, dispatch] = useReducer(reducer, initialNavigatorState);
  const [searching, setSearching] = useState(false);

  // Engine runs only at the 'evaluate' step (pure; useMemo keeps it stable per state).
  const engineResult = useMemo<NavigatorResults | null>(
    () => (state.step === 'evaluate' ? runNavigator(buildUserInputs(state)) : null),
    [state, runNavigator],
  );

  const handleBack = () => {
    if (isExitOnBack(state)) onExit();
    else dispatch({ type: 'BACK' });
  };

  // ── Halt (user "Yes" OR the engine's red-flag screen) ───────────────────────────
  if (state.step === 'haltUnsafe' || engineResult?.safety.should_halt) {
    return (
      <HaltView
        emergencyNumber={emergencyNumber}
        helplines={helplines}
        onGoBack={() => dispatch({ type: 'BACK' })}
      />
    );
  }

  // ── Results (S18) ────────────────────────────────────────────────────────────────
  if (state.step === 'evaluate' && engineResult !== null) {
    const vms: ResultItemVM[] = engineResult.results.map((r) => ({
      condition_id: r.condition_id,
      name: r.name,
      description_for_user: r.description_for_user,
      relevance_label: r.relevance_label,
    }));
    return (
      <ResultsView
        results={vms}
        onReadAbout={onReadAbout}
        onSteadyingNow={onSteadyingNow}
        onFindCare={onFindCare}
        onBack={() => dispatch({ type: 'BACK' })}
      />
    );
  }

  // ── Step screens (S13–S16) ───────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pt-1">
        <BackButton onPress={handleBack} />
      </View>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
        {state.step === 'area' &&
          AREAS.map((a) => (
            <ChipXL key={a.area} label={a.label} onPress={() => dispatch({ type: 'SELECT_AREA', area: a.area })} />
          ))}

        {state.step === 'symptoms' && state.area !== null && (
          <SymptomStep
            symptoms={symptoms}
            area={state.area}
            selectedIds={state.selectedSymptomIds}
            searching={searching}
            onToggle={(id) => dispatch({ type: 'TOGGLE_SYMPTOM', id })}
            onToggleSearch={() => setSearching((s) => !s)}
            onPickFromSearch={(id) => {
              dispatch({ type: 'TOGGLE_SYMPTOM', id });
              setSearching(false);
            }}
            onContinue={() => dispatch({ type: 'SYMPTOMS_NEXT' })}
          />
        )}

        {state.step === 'clarifier' &&
          (() => {
            const q = clarifiers[state.clarifierIndex];
            if (!q) return null;
            return (
              <View className="gap-4">
                <Text variant="headingLg" accessibilityRole="header">
                  {q.prompt}
                </Text>
                {q.options.map((o) => (
                  <ChipXL
                    key={o.value}
                    label={o.label}
                    onPress={() => dispatch({ type: 'ANSWER_CLARIFIER', value: o.value })}
                  />
                ))}
              </View>
            );
          })()}

        {state.step === 'severity' && (
          <View className="gap-4">
            <Text variant="headingLg" accessibilityRole="header">
              {SEVERITY_QUESTION}
            </Text>
            <ChipXL
              label={NAVIGATOR_COPY.severityNo}
              onPress={() => dispatch({ type: 'ANSWER_SEVERITY', answer: 'no' })}
            />
            <ChipXL
              label={NAVIGATOR_COPY.severityYes}
              onPress={() => dispatch({ type: 'ANSWER_SEVERITY', answer: 'yes' })}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SymptomStep({
  symptoms,
  area,
  selectedIds,
  searching,
  onToggle,
  onToggleSearch,
  onPickFromSearch,
  onContinue,
}: {
  symptoms: readonly SymptomOption[];
  area: NavigatorArea;
  selectedIds: readonly string[];
  searching: boolean;
  onToggle: (id: string) => void;
  onToggleSearch: () => void;
  onPickFromSearch: (id: string) => void;
  onContinue: () => void;
}) {
  if (searching) {
    return (
      <View className="h-[420px]">
        <SearchableList
          items={symptoms}
          getKey={(s) => s.id}
          getLabel={(s) => s.name}
          onSelect={(s) => onPickFromSearch(s.id)}
          accentColor={colors.teal[700]}
          searchPlaceholder={SEARCH_PLACEHOLDER}
          searchAccessibilityLabel={SEARCH_A11Y}
          noMatchLabel={NO_MATCH}
        />
      </View>
    );
  }

  const areaSyms = symptomsForArea(symptoms, area);
  const extras = symptoms.filter(
    (s) => selectedIds.includes(s.id) && !areaSyms.some((a) => a.id === s.id),
  );
  const display = [...areaSyms, ...extras];

  return (
    <View className="gap-3">
      {display.map((s) => (
        <SymptomChip
          key={s.id}
          label={s.name}
          selected={selectedIds.includes(s.id)}
          onToggle={() => onToggle(s.id)}
        />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={SOMETHING_ELSE}
        onPress={onToggleSearch}
        hitSlop={6}
        className="min-h-[44px] justify-center"
      >
        <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
          {SOMETHING_ELSE}
        </Text>
      </Pressable>
      <Button variant="primary" disabled={selectedIds.length === 0} onPress={onContinue} className="mt-2">
        {CONTINUE_LABEL}
      </Button>
    </View>
  );
}
