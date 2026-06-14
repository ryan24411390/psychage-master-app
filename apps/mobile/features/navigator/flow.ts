// Navigator flow state machine — PURE reducer (no React, type-only shared import) →
// Vitest. In-memory ONLY: the container holds this in component state, so leaving the
// flow unmounts it and nothing persists (SR-4 — selections never leave the device, and
// an abandoned acute session leaves zero residue; re-entry starts fresh).
//
// Steps: area (S13) → symptoms (S14) → clarifier×N (S15) → severity (S16) →
//   haltUnsafe (S17, on "Yes") | evaluate (run the engine → S18 results, or S17 if the
//   engine's red-flag screen halts on a CRISIS-flagged selection).
//
// The engine call itself is NOT here (the reducer is pure) — `evaluate` is the signal
// for the container to run the injected engine and branch on safety.should_halt.

import type { UserDuration, UserFrequency, UserSymptomInput } from '@psychage/shared/navigator';

import type { ClarifierQuestion } from './clarifiers';
import type { NavigatorArea } from './areas';

export type NavStep = 'area' | 'symptoms' | 'clarifier' | 'severity' | 'haltUnsafe' | 'evaluate';
export type SeverityAnswer = 'no' | 'yes';

export interface NavigatorState {
  readonly step: NavStep;
  readonly area: NavigatorArea | null;
  readonly selectedSymptomIds: readonly string[];
  readonly clarifierIndex: number;
  readonly answers: Readonly<Record<string, string>>;
  readonly severityAnswer: SeverityAnswer | null;
}

export const initialNavigatorState: NavigatorState = {
  step: 'area',
  area: null,
  selectedSymptomIds: [],
  clarifierIndex: 0,
  answers: {},
  severityAnswer: null,
};

export type NavigatorAction =
  | { type: 'SELECT_AREA'; area: NavigatorArea }
  | { type: 'TOGGLE_SYMPTOM'; id: string }
  | { type: 'SYMPTOMS_NEXT' }
  | { type: 'ANSWER_CLARIFIER'; value: string }
  | { type: 'ANSWER_SEVERITY'; answer: SeverityAnswer }
  | { type: 'BACK' }
  | { type: 'RESET' };

/** True when BACK on the current state should EXIT the flow (the container handles it). */
export function isExitOnBack(state: NavigatorState): boolean {
  return state.step === 'area';
}

function back(state: NavigatorState, clarifiers: readonly ClarifierQuestion[]): NavigatorState {
  switch (state.step) {
    case 'area':
      return state; // container exits; reducer no-ops
    case 'symptoms':
      return { ...state, step: 'area' };
    case 'clarifier':
      return state.clarifierIndex > 0
        ? { ...state, clarifierIndex: state.clarifierIndex - 1 }
        : { ...state, step: 'symptoms' };
    case 'severity':
      return clarifiers.length > 0
        ? { ...state, step: 'clarifier', clarifierIndex: clarifiers.length - 1 }
        : { ...state, step: 'symptoms' };
    case 'haltUnsafe':
    case 'evaluate':
      // Walking back past a halt re-opens the severity question (never silently
      // resumes into results on a "Yes" path).
      return { ...state, step: 'severity', severityAnswer: null };
  }
}

/** Build the reducer for a given clarifier set (it needs the count + ids to advance). */
export function createNavigatorReducer(clarifiers: readonly ClarifierQuestion[]) {
  return function reducer(state: NavigatorState, action: NavigatorAction): NavigatorState {
    switch (action.type) {
      case 'SELECT_AREA':
        // Single-select advances on tap; changing area resets downstream selections.
        return { ...initialNavigatorState, area: action.area, step: 'symptoms' };
      case 'TOGGLE_SYMPTOM': {
        const has = state.selectedSymptomIds.includes(action.id);
        return {
          ...state,
          selectedSymptomIds: has
            ? state.selectedSymptomIds.filter((id) => id !== action.id)
            : [...state.selectedSymptomIds, action.id],
        };
      }
      case 'SYMPTOMS_NEXT':
        if (state.selectedSymptomIds.length === 0) return state; // need ≥1 selection
        return { ...state, step: clarifiers.length > 0 ? 'clarifier' : 'severity', clarifierIndex: 0 };
      case 'ANSWER_CLARIFIER': {
        const q = clarifiers[state.clarifierIndex];
        if (!q) return state;
        const answers = { ...state.answers, [q.id]: action.value };
        const next = state.clarifierIndex + 1;
        return next < clarifiers.length
          ? { ...state, answers, clarifierIndex: next }
          : { ...state, answers, step: 'severity' };
      }
      case 'ANSWER_SEVERITY':
        // SR-2: "Yes" ALWAYS halts, at any point, no flag can bypass it.
        return action.answer === 'yes'
          ? { ...state, severityAnswer: 'yes', step: 'haltUnsafe' }
          : { ...state, severityAnswer: 'no', step: 'evaluate' };
      case 'BACK':
        return back(state, clarifiers);
      case 'RESET':
        return initialNavigatorState;
    }
  };
}

/** Map the collected answers into the engine's UserSymptomInput[] (one per selected
 *  symptom, carrying the session-level duration/frequency). Severity is left to the
 *  engine default — the mobile flow asks the safety question, not a 1–10 rating. */
export function buildUserInputs(state: NavigatorState): UserSymptomInput[] {
  const duration = state.answers.duration as UserDuration | undefined;
  const frequency = state.answers.frequency as UserFrequency | undefined;
  return state.selectedSymptomIds.map((symptom_id) => ({
    symptom_id,
    ...(duration ? { duration } : {}),
    ...(frequency ? { frequency } : {}),
  }));
}
