import { describe, expect, it } from 'vitest';

import { CLARIFIERS } from '@/features/navigator/clarifiers';
import {
  buildUserInputs,
  createNavigatorReducer,
  initialNavigatorState,
  isExitOnBack,
  type NavigatorState,
} from '@/features/navigator/flow';

const reducer = createNavigatorReducer(CLARIFIERS);

function drive(actions: Parameters<typeof reducer>[1][]): NavigatorState {
  return actions.reduce((s, a) => reducer(s, a), initialNavigatorState);
}

describe('navigator flow reducer', () => {
  it('single-select area advances to symptoms and resets downstream', () => {
    const s = reducer(initialNavigatorState, { type: 'SELECT_AREA', area: 'mind' });
    expect(s.step).toBe('symptoms');
    expect(s.area).toBe('mind');
    expect(s.selectedSymptomIds).toEqual([]);
  });

  it('toggles symptoms on and off (multi-select)', () => {
    let s = reducer({ ...initialNavigatorState, step: 'symptoms', area: 'mind' }, {
      type: 'TOGGLE_SYMPTOM',
      id: 'low_mood',
    });
    s = reducer(s, { type: 'TOGGLE_SYMPTOM', id: 'worry' });
    expect(s.selectedSymptomIds).toEqual(['low_mood', 'worry']);
    s = reducer(s, { type: 'TOGGLE_SYMPTOM', id: 'low_mood' });
    expect(s.selectedSymptomIds).toEqual(['worry']);
  });

  it('blocks SYMPTOMS_NEXT with zero selections', () => {
    const s = reducer({ ...initialNavigatorState, step: 'symptoms', area: 'mind' }, {
      type: 'SYMPTOMS_NEXT',
    });
    expect(s.step).toBe('symptoms');
  });

  it('walks clarifier → clarifier → severity, recording answers', () => {
    const s = drive([
      { type: 'SELECT_AREA', area: 'mind' },
      { type: 'TOGGLE_SYMPTOM', id: 'low_mood' },
      { type: 'SYMPTOMS_NEXT' },
      { type: 'ANSWER_CLARIFIER', value: 'less_than_1_week' },
      { type: 'ANSWER_CLARIFIER', value: 'often' },
    ]);
    expect(s.step).toBe('severity');
    expect(s.answers).toEqual({ duration: 'less_than_1_week', frequency: 'often' });
  });

  it('SR-2: "Yes" on severity ALWAYS halts (haltUnsafe), "No" goes to evaluate', () => {
    const base = drive([
      { type: 'SELECT_AREA', area: 'mind' },
      { type: 'TOGGLE_SYMPTOM', id: 'low_mood' },
      { type: 'SYMPTOMS_NEXT' },
      { type: 'ANSWER_CLARIFIER', value: 'less_than_1_week' },
      { type: 'ANSWER_CLARIFIER', value: 'often' },
    ]);
    expect(reducer(base, { type: 'ANSWER_SEVERITY', answer: 'yes' }).step).toBe('haltUnsafe');
    expect(reducer(base, { type: 'ANSWER_SEVERITY', answer: 'no' }).step).toBe('evaluate');
  });

  it('BACK past a halt re-opens the severity question (never silently resumes)', () => {
    const halted: NavigatorState = {
      ...initialNavigatorState,
      step: 'haltUnsafe',
      severityAnswer: 'yes',
    };
    const back = reducer(halted, { type: 'BACK' });
    expect(back.step).toBe('severity');
    expect(back.severityAnswer).toBeNull();
  });

  it('BACK steps clarifier index down, then to symptoms, then exits at area', () => {
    expect(reducer({ ...initialNavigatorState, step: 'clarifier', clarifierIndex: 1 }, { type: 'BACK' }).clarifierIndex).toBe(0);
    expect(reducer({ ...initialNavigatorState, step: 'clarifier', clarifierIndex: 0 }, { type: 'BACK' }).step).toBe('symptoms');
    expect(reducer({ ...initialNavigatorState, step: 'symptoms' }, { type: 'BACK' }).step).toBe('area');
    expect(isExitOnBack({ ...initialNavigatorState, step: 'area' })).toBe(true);
  });

  it('buildUserInputs attaches session duration/frequency to each selected symptom', () => {
    const s = drive([
      { type: 'SELECT_AREA', area: 'mind' },
      { type: 'TOGGLE_SYMPTOM', id: 'low_mood' },
      { type: 'TOGGLE_SYMPTOM', id: 'worry' },
      { type: 'SYMPTOMS_NEXT' },
      { type: 'ANSWER_CLARIFIER', value: 'more_than_1_year' },
      { type: 'ANSWER_CLARIFIER', value: 'always' },
    ]);
    expect(buildUserInputs(s)).toEqual([
      { symptom_id: 'low_mood', duration: 'more_than_1_year', frequency: 'always' },
      { symptom_id: 'worry', duration: 'more_than_1_year', frequency: 'always' },
    ]);
  });
});
