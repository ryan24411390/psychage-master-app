import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ChipXL } from '@/features/navigator/components/ChipXL';

import { describeChange } from './bands';
import { ClarityChrome } from './components/ClarityChrome';
import { ClarityResultsView } from './ClarityResultsView';
import {
  type ClarityFlowState,
  clarityReducer,
  initialClarityState,
  isExitOnBack,
} from './flow';
import { CLARITY_QUESTION_COUNT, CLARITY_QUESTIONS } from './questions';
import { scoreClarity } from './scoring';
import type { ClarityResult } from './types';

// The Clarity Score flow (intro → 20 questions → optional crisis interstitial →
// results). Fully ON-DEVICE: the reducer holds the in-progress answers in component
// state, so leaving unmounts them and nothing raw is persisted (SR-4). Only the
// COMPLETED result (composite + tier + domains) is saved, via the injected
// `saveResult` — the store import stays out of this component so render tests inject
// a double (mirrors the Navigator's injected-engine pattern). Crisis is reachable on
// every screen via the chrome's Help-now pill (SR-2).
//
// All user-facing copy here is PROVISIONAL pending Dr. Dobson review (rules §7).

const INTRO_TITLE = 'Clarity Score';
const INTRO_BODY =
  'A short set of questions about how the last couple of weeks have felt. It’s a reflection to help you notice patterns — not a test, and not a label. Your answers stay on this device.';
const INTRO_META = 'About 20 questions. There are no right answers.';
const BEGIN = 'Begin';
const SEE_HISTORY = 'See your past snapshots';

const CRISIS_TITLE = 'Support is available';
const CRISIS_BODY =
  'Your responses suggest you may be going through a lot right now. You don’t have to face this alone.';
const CRISIS_PRIMARY = 'See support resources';
const CRISIS_CONTINUE = 'I’m safe right now — continue';

export interface ClarityFlowProps {
  readonly onExit: () => void;
  /** Help-now pill → the crisis surface. */
  readonly onHelp: () => void;
  /** Crisis interstitial primary action → the crisis surface. */
  readonly onCrisisResources: () => void;
  /** A recommendation's action → a mobile route. */
  readonly onRecommend: (route: string) => void;
  readonly onViewHistory: () => void;
  /**
   * Persist the completed result; returns the PREVIOUS snapshot's composite (for the
   * qualitative change line), or null on a first run. Called once per completion.
   */
  readonly saveResult: (result: ClarityResult) => number | null;
  /** Whether to offer the "see past snapshots" link on the intro. */
  readonly hasHistory?: boolean;
}

export function ClarityFlow({
  onExit,
  onHelp,
  onCrisisResources,
  onRecommend,
  onViewHistory,
  saveResult,
  hasHistory = false,
}: ClarityFlowProps) {
  const [state, dispatch] = useReducer(clarityReducer, initialClarityState);

  const handleBack = () => {
    if (isExitOnBack(state)) onExit();
    else dispatch({ type: 'BACK' });
  };

  // Score only at the results step (pure; stable per answers).
  const result = useMemo<ClarityResult | null>(
    () => (state.step === 'results' ? scoreClarity(state.answers) : null),
    [state.step, state.answers],
  );

  // Persist exactly once per completion; capture the qualitative change vs the prior.
  const [changeNote, setChangeNote] = useState<string | null>(null);
  const savedForResults = useRef(false);
  useEffect(() => {
    if (state.step !== 'results') {
      savedForResults.current = false;
      return;
    }
    if (result && !savedForResults.current) {
      savedForResults.current = true;
      const previousComposite = saveResult(result);
      setChangeNote(previousComposite !== null ? describeChange(result.composite, previousComposite) : null);
    }
  }, [state.step, result, saveResult]);

  // ── Results ────────────────────────────────────────────────────────────────────
  if (state.step === 'results' && result) {
    return (
      <ClarityChrome onHelp={onHelp} onBack={handleBack}>
        <ClarityResultsView
          result={result}
          changeNote={changeNote}
          onRecommend={onRecommend}
          onViewHistory={onViewHistory}
          onRetake={() => {
            setChangeNote(null);
            dispatch({ type: 'RESET' });
          }}
        />
      </ClarityChrome>
    );
  }

  // ── Crisis interstitial (SR-2) ───────────────────────────────────────────────────
  if (state.step === 'crisis') {
    return (
      <ClarityChrome onHelp={onHelp} onBack={handleBack}>
        <ScrollView contentContainerClassName="gap-5 px-4 pb-12 pt-4" showsVerticalScrollIndicator={false}>
          <Text variant="h2" accessibilityRole="header">
            {CRISIS_TITLE}
          </Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {CRISIS_BODY}
          </Text>
          <Button variant="primary" onPress={onCrisisResources}>
            {CRISIS_PRIMARY}
          </Button>
          <Button variant="ghost" onPress={() => dispatch({ type: 'ACK_CRISIS' })}>
            {CRISIS_CONTINUE}
          </Button>
        </ScrollView>
      </ClarityChrome>
    );
  }

  // ── Intro ────────────────────────────────────────────────────────────────────────
  if (state.step === 'intro') {
    return (
      <ClarityChrome onHelp={onHelp} onBack={handleBack}>
        <ScrollView contentContainerClassName="gap-5 px-4 pb-12 pt-4" showsVerticalScrollIndicator={false}>
          <Text variant="h2" accessibilityRole="header">
            {INTRO_TITLE}
          </Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {INTRO_BODY}
          </Text>
          <Text variant="bodySmall" className="text-text-secondary dark:text-text-secondary-dark">
            {INTRO_META}
          </Text>
          <Button variant="primary" onPress={() => dispatch({ type: 'START' })}>
            {BEGIN}
          </Button>
          {hasHistory ? (
            <Button variant="ghost" onPress={onViewHistory}>
              {SEE_HISTORY}
            </Button>
          ) : null}
        </ScrollView>
      </ClarityChrome>
    );
  }

  // ── Question (one per screen) ─────────────────────────────────────────────────────
  return (
    <ClarityChrome onHelp={onHelp} onBack={handleBack}>
      <QuestionStep state={state} onAnswer={(value) => dispatch({ type: 'ANSWER', value })} />
    </ClarityChrome>
  );
}

function QuestionStep({
  state,
  onAnswer,
}: {
  state: ClarityFlowState;
  onAnswer: (value: number) => void;
}) {
  const question = CLARITY_QUESTIONS[state.index];
  if (!question) return null;
  return (
    <ScrollView contentContainerClassName="gap-4 px-4 pb-12 pt-2" showsVerticalScrollIndicator={false}>
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        Question {state.index + 1} of {CLARITY_QUESTION_COUNT}
      </Text>
      <Text variant="bodySmall" className="text-text-secondary dark:text-text-secondary-dark">
        {question.lead}
      </Text>
      <Text variant="h2" accessibilityRole="header">
        {question.prompt}
      </Text>
      <View className="gap-3 pt-1">
        {question.options.map((o) => (
          <ChipXL key={o.value} label={o.label} onPress={() => onAnswer(o.value)} />
        ))}
      </View>
    </ScrollView>
  );
}
