// Clarity Score flow — PURE reducer (no React, no RN) → Vitest. Mirrors the
// Symptom Navigator's flow.ts: the container holds this in component state, so
// leaving the flow unmounts it and the in-progress answers vanish. The COMPLETED
// result is persisted (composite + tier + domains only) via the store — but the raw
// answers held here are never serialized (SR-4).
//
// Steps:  intro → question×20 → (crisis interstitial, only if the pattern is present
//   right after q4) → results.
//
// The crisis interstitial (SR-2) fires after the PHQ-4 block and BLOCKS forward
// progress until the user either reaches crisis resources or affirms they are safe.
// It cannot be skipped by any flag — the reducer re-checks `isCrisisPattern` on the
// q4 answer every time q4 is (re)answered, unless already acknowledged this session.

import { CLARITY_QUESTION_COUNT, PHQ4_LAST_INDEX } from './questions';
import { isCrisisPattern } from './scoring';
import type { ClarityAnswers } from './types';

export type ClarityStep = 'intro' | 'question' | 'crisis' | 'results';

export interface ClarityFlowState {
  readonly step: ClarityStep;
  /** Index of the current (or next, while on the crisis interstitial) question, 0–19. */
  readonly index: number;
  readonly answers: ClarityAnswers;
  /** Sticky once the user affirms safety, so the interstitial does not nag. */
  readonly crisisAcknowledged: boolean;
}

export const initialClarityState: ClarityFlowState = {
  step: 'intro',
  index: 0,
  answers: {},
  crisisAcknowledged: false,
};

export type ClarityAction =
  | { type: 'START' }
  | { type: 'ANSWER'; value: number }
  | { type: 'ACK_CRISIS' }
  | { type: 'BACK' }
  | { type: 'RESET' };

/** True when BACK on the current state should EXIT the flow (the container handles it). */
export function isExitOnBack(state: ClarityFlowState): boolean {
  return state.step === 'intro';
}

function questionIdAt(index: number): string {
  return `q${index + 1}`;
}

function back(state: ClarityFlowState): ClarityFlowState {
  switch (state.step) {
    case 'intro':
      return state; // container exits; reducer no-ops
    case 'question':
      return state.index > 0
        ? { ...state, index: state.index - 1 }
        : { ...state, step: 'intro' };
    case 'crisis':
      // Walking back from the interstitial re-opens q4 (never silently resumes past it).
      return { ...state, step: 'question', index: PHQ4_LAST_INDEX };
    case 'results':
      // Back from results re-opens the last question.
      return { ...state, step: 'question', index: CLARITY_QUESTION_COUNT - 1 };
  }
}

export function clarityReducer(state: ClarityFlowState, action: ClarityAction): ClarityFlowState {
  switch (action.type) {
    case 'START':
      return state.step === 'intro' ? { ...state, step: 'question', index: 0 } : state;

    case 'ANSWER': {
      if (state.step !== 'question') return state;
      const answers = { ...state.answers, [questionIdAt(state.index)]: action.value };
      const nextIndex = state.index + 1;

      // Crisis gate: only re-evaluated at the q4→q5 boundary (matches the web), and
      // only when not already acknowledged this session.
      if (
        state.index === PHQ4_LAST_INDEX &&
        !state.crisisAcknowledged &&
        isCrisisPattern(answers)
      ) {
        return { ...state, answers, index: nextIndex, step: 'crisis' };
      }

      return nextIndex >= CLARITY_QUESTION_COUNT
        ? { ...state, answers, step: 'results' }
        : { ...state, answers, index: nextIndex, step: 'question' };
    }

    case 'ACK_CRISIS':
      // "I'm safe right now — continue." Resume at the next question (index already
      // points past q4). Sticky so re-answering q4 won't re-prompt.
      return state.step === 'crisis'
        ? { ...state, step: 'question', crisisAcknowledged: true }
        : state;

    case 'BACK':
      return back(state);

    case 'RESET':
      return initialClarityState;
  }
}
