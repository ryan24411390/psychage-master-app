import { describe, expect, it } from 'vitest';

import { CLARITY_QUESTION_COUNT, PHQ4_LAST_INDEX } from '@/features/clarity/questions';
import {
  type ClarityAction,
  type ClarityFlowState,
  clarityReducer,
  initialClarityState,
  isExitOnBack,
} from '@/features/clarity/flow';

// The flow is in-memory only (SR-4): the reducer holds the answers, so leaving the
// route unmounts it and they vanish. The crisis gate (SR-2) is re-checked at the
// q4→q5 boundary and blocks forward progress until acknowledged.

function run(actions: ClarityAction[], from: ClarityFlowState = initialClarityState): ClarityFlowState {
  return actions.reduce(clarityReducer, from);
}

/** Answer the current question with `value`, repeated `count` times. */
function answers(value: number, count: number): ClarityAction[] {
  return Array.from({ length: count }, () => ({ type: 'ANSWER', value }) as ClarityAction);
}

describe('happy path — intro → 20 questions → results', () => {
  it('START moves intro → first question', () => {
    const s = clarityReducer(initialClarityState, { type: 'START' });
    expect(s.step).toBe('question');
    expect(s.index).toBe(0);
  });

  it('a calm run (no crisis) answers all 20 and enters the calculating interlude', () => {
    const s = run([{ type: 'START' }, ...answers(0, CLARITY_QUESTION_COUNT)]);
    expect(s.step).toBe('calculating');
    expect(Object.keys(s.answers)).toHaveLength(CLARITY_QUESTION_COUNT);
    expect(s.answers.q1).toBe(0);
    expect(s.answers.q20).toBe(0);
  });

  it('FINISH_CALCULATING moves calculating → results', () => {
    const s = run([{ type: 'START' }, ...answers(0, CLARITY_QUESTION_COUNT), { type: 'FINISH_CALCULATING' }]);
    expect(s.step).toBe('results');
  });

  it('FINISH_CALCULATING is a no-op outside the calculating step', () => {
    const s = run([{ type: 'START' }, { type: 'FINISH_CALCULATING' }]);
    expect(s.step).toBe('question');
    expect(s.index).toBe(0);
  });

  it('answers are keyed q1..q20 in order', () => {
    const s = run([{ type: 'START' }, ...answers(1, 5)]);
    expect(s.index).toBe(5);
    expect(Object.keys(s.answers)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });
});

describe('crisis gate (SR-2) — fires at the q4 boundary, blocks until acknowledged', () => {
  it('a crisis PHQ-4 pattern halts at the interstitial after q4', () => {
    const s = run([{ type: 'START' }, ...answers(3, 4)]); // q1..q4 = 3 → total 12
    expect(s.step).toBe('crisis');
    expect(s.index).toBe(PHQ4_LAST_INDEX + 1); // points at q5, ready to resume
    expect(s.crisisAcknowledged).toBe(false);
  });

  it('ACK_CRISIS resumes at q5 and sticks (re-answering q4 will not re-prompt)', () => {
    const after = run([{ type: 'START' }, ...answers(3, 4), { type: 'ACK_CRISIS' }]);
    expect(after.step).toBe('question');
    expect(after.index).toBe(PHQ4_LAST_INDEX + 1);
    expect(after.crisisAcknowledged).toBe(true);

    // Walk back to q4, re-answer with a crisis value → no second interstitial.
    const back = run([{ type: 'BACK' }, { type: 'ANSWER', value: 3 }], after);
    expect(back.step).toBe('question');
  });

  it('no crisis pattern flows straight past q4 to q5', () => {
    const s = run([{ type: 'START' }, ...answers(1, 4)]); // total 4, q4 = 1
    expect(s.step).toBe('question');
    expect(s.index).toBe(4);
  });
});

describe('BACK', () => {
  it('isExitOnBack is true only on the intro', () => {
    expect(isExitOnBack(initialClarityState)).toBe(true);
    expect(isExitOnBack({ ...initialClarityState, step: 'question' })).toBe(false);
  });

  it('BACK from the first question returns to intro', () => {
    const s = run([{ type: 'START' }, { type: 'BACK' }]);
    expect(s.step).toBe('intro');
  });

  it('BACK from the crisis interstitial re-opens q4', () => {
    const s = run([{ type: 'START' }, ...answers(3, 4), { type: 'BACK' }]);
    expect(s.step).toBe('question');
    expect(s.index).toBe(PHQ4_LAST_INDEX);
  });

  it('BACK from results re-opens the last question', () => {
    const s = run([{ type: 'START' }, ...answers(0, CLARITY_QUESTION_COUNT), { type: 'BACK' }]);
    expect(s.step).toBe('question');
    expect(s.index).toBe(CLARITY_QUESTION_COUNT - 1);
  });
});

describe('RESET', () => {
  it('returns to the pristine initial state (answers cleared)', () => {
    const s = run([{ type: 'START' }, ...answers(2, 6), { type: 'RESET' }]);
    expect(s).toEqual(initialClarityState);
  });
});
