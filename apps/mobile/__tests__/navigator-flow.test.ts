import { describe, expect, it } from 'vitest';

import {
  buildUserInputs,
  initialNavigatorState,
  isExitOnBack,
  type NavigatorState,
  navigatorReducer as reducer,
} from '@/features/navigator/flow';

function drive(actions: Parameters<typeof reducer>[1][]): NavigatorState {
  return actions.reduce((s, a) => reducer(s, a), initialNavigatorState);
}

describe('navigator flow reducer (web-parity step model)', () => {
  it('START advances welcome → domains', () => {
    const s = reducer(initialNavigatorState, { type: 'START' });
    expect(s.step).toBe('domains');
  });

  it('multi-selects domains and advances on DOMAINS_NEXT', () => {
    let s = reducer({ ...initialNavigatorState, step: 'domains' }, {
      type: 'TOGGLE_DOMAIN',
      domain: 'emotional',
    });
    s = reducer(s, { type: 'TOGGLE_DOMAIN', domain: 'physical' });
    expect(s.selectedDomains).toEqual(['emotional', 'physical']);
    s = reducer(s, { type: 'TOGGLE_DOMAIN', domain: 'emotional' });
    expect(s.selectedDomains).toEqual(['physical']);
    s = reducer(s, { type: 'DOMAINS_NEXT' });
    expect(s.step).toBe('symptoms');
  });

  it('blocks DOMAINS_NEXT with zero domains', () => {
    const s = reducer({ ...initialNavigatorState, step: 'domains' }, { type: 'DOMAINS_NEXT' });
    expect(s.step).toBe('domains');
  });

  it('SELECT_ALL_DOMAINS picks all and jumps to symptoms', () => {
    const s = reducer({ ...initialNavigatorState, step: 'domains' }, {
      type: 'SELECT_ALL_DOMAINS',
      domains: ['emotional', 'physical', 'cognitive', 'behavioral'],
    });
    expect(s.selectedDomains).toHaveLength(4);
    expect(s.step).toBe('symptoms');
  });

  it('toggles symptoms and bulk add/remove', () => {
    let s: NavigatorState = { ...initialNavigatorState, step: 'symptoms' };
    s = reducer(s, { type: 'TOGGLE_SYMPTOM', id: 'MOD_001' });
    s = reducer(s, { type: 'ADD_SYMPTOMS', ids: ['MOD_002', 'ENR_001', 'MOD_001'] });
    expect(s.selectedSymptomIds).toEqual(['MOD_001', 'MOD_002', 'ENR_001']); // dedup
    s = reducer(s, { type: 'REMOVE_SYMPTOMS', ids: ['MOD_002'] });
    expect(s.selectedSymptomIds).toEqual(['MOD_001', 'ENR_001']);
  });

  it('blocks SYMPTOMS_NEXT with zero selections, advances to details otherwise', () => {
    let s: NavigatorState = { ...initialNavigatorState, step: 'symptoms' };
    expect(reducer(s, { type: 'SYMPTOMS_NEXT' }).step).toBe('symptoms');
    s = reducer(s, { type: 'TOGGLE_SYMPTOM', id: 'MOD_001' });
    s = reducer(s, { type: 'SYMPTOMS_NEXT' });
    expect(s.step).toBe('details');
    expect(s.detailIndex).toBe(0);
  });

  it('pages through details then advances to safety', () => {
    let s: NavigatorState = {
      ...initialNavigatorState,
      step: 'details',
      selectedSymptomIds: ['MOD_001', 'MOD_002'],
    };
    s = reducer(s, { type: 'DETAIL_NEXT' });
    expect(s).toMatchObject({ step: 'details', detailIndex: 1 });
    s = reducer(s, { type: 'DETAIL_NEXT' });
    expect(s.step).toBe('safety');
  });

  it('records per-symptom detail patches (merged)', () => {
    let s: NavigatorState = {
      ...initialNavigatorState,
      step: 'details',
      selectedSymptomIds: ['MOD_001'],
    };
    s = reducer(s, { type: 'SET_DETAIL', id: 'MOD_001', patch: { severity: 8 } });
    s = reducer(s, { type: 'SET_DETAIL', id: 'MOD_001', patch: { duration: 'more_than_1_year' } });
    expect(s.details.MOD_001).toEqual({ severity: 8, duration: 'more_than_1_year' });
  });

  it('SR-2/SR-3: safety "Yes" ALWAYS halts; "No" proceeds to processing', () => {
    const base: NavigatorState = { ...initialNavigatorState, step: 'safety' };
    expect(reducer(base, { type: 'ANSWER_SAFETY', answer: 'yes' }).step).toBe('halt');
    expect(reducer(base, { type: 'ANSWER_SAFETY', answer: 'no' }).step).toBe('processing');
  });

  it('walking back past a halt re-opens safety and clears the answer (never resumes)', () => {
    const halted: NavigatorState = {
      ...initialNavigatorState,
      step: 'halt',
      severityAnswer: 'yes',
    };
    const s = reducer(halted, { type: 'BACK' });
    expect(s).toMatchObject({ step: 'safety', severityAnswer: null });
  });

  it('isExitOnBack only at welcome', () => {
    expect(isExitOnBack(initialNavigatorState)).toBe(true);
    expect(isExitOnBack({ ...initialNavigatorState, step: 'symptoms' })).toBe(false);
  });

  it('RESET returns to the initial welcome state', () => {
    const s = drive([
      { type: 'START' },
      { type: 'TOGGLE_DOMAIN', domain: 'emotional' },
      { type: 'RESET' },
    ]);
    expect(s).toEqual(initialNavigatorState);
  });
});

describe('buildUserInputs (the scoring-parity fix)', () => {
  it('carries severity, duration, and frequency per symptom', () => {
    const state: NavigatorState = {
      ...initialNavigatorState,
      selectedSymptomIds: ['MOD_001', 'ENR_001'],
      details: {
        MOD_001: { severity: 9, duration: 'more_than_1_year', frequency: 'always' },
        ENR_001: { severity: 4 },
      },
    };
    expect(buildUserInputs(state)).toEqual([
      { symptom_id: 'MOD_001', severity: 9, duration: 'more_than_1_year', frequency: 'always' },
      { symptom_id: 'ENR_001', severity: 4 },
    ]);
  });

  it('omits undefined fields so the engine applies its own defaults', () => {
    const state: NavigatorState = {
      ...initialNavigatorState,
      selectedSymptomIds: ['MOD_001'],
      details: {},
    };
    expect(buildUserInputs(state)).toEqual([{ symptom_id: 'MOD_001' }]);
  });
});
