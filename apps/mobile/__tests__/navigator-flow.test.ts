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

describe('P35 — paged symptom selection (symptomPage)', () => {
  it('starts symptoms on page 0 from DOMAINS_NEXT', () => {
    let s: NavigatorState = { ...initialNavigatorState, step: 'domains', selectedDomains: ['emotional'] };
    s = reducer(s, { type: 'DOMAINS_NEXT' });
    expect(s).toMatchObject({ step: 'symptoms', symptomPage: 0 });
  });

  it('SYMPTOMS_PAGE_NEXT advances one page without leaving the symptoms step', () => {
    let s: NavigatorState = { ...initialNavigatorState, step: 'symptoms', symptomPage: 0 };
    s = reducer(s, { type: 'SYMPTOMS_PAGE_NEXT' });
    expect(s).toMatchObject({ step: 'symptoms', symptomPage: 1 });
    s = reducer(s, { type: 'SYMPTOMS_PAGE_NEXT' });
    expect(s.symptomPage).toBe(2);
  });

  it('BACK walks the pages, then exits to domains from page 0', () => {
    let s: NavigatorState = { ...initialNavigatorState, step: 'symptoms', symptomPage: 2 };
    s = reducer(s, { type: 'BACK' });
    expect(s).toMatchObject({ step: 'symptoms', symptomPage: 1 });
    s = reducer(s, { type: 'BACK' });
    expect(s).toMatchObject({ step: 'symptoms', symptomPage: 0 });
    s = reducer(s, { type: 'BACK' });
    expect(s.step).toBe('domains');
  });

  it('resets the page to 0 when the domain set changes (SELECT_ALL_DOMAINS / DOMAINS_NEXT)', () => {
    const onPage2: NavigatorState = { ...initialNavigatorState, step: 'symptoms', symptomPage: 2 };
    expect(reducer(onPage2, { type: 'SELECT_ALL_DOMAINS', domains: ['emotional'] }).symptomPage).toBe(0);
    const atDomains: NavigatorState = { ...onPage2, step: 'domains', selectedDomains: ['emotional'] };
    expect(reducer(atDomains, { type: 'DOMAINS_NEXT' }).symptomPage).toBe(0);
  });

  it('SYMPTOMS_NEXT (the final gate) still requires ≥1 symptom and enters details', () => {
    const empty: NavigatorState = { ...initialNavigatorState, step: 'symptoms', symptomPage: 1 };
    expect(reducer(empty, { type: 'SYMPTOMS_NEXT' }).step).toBe('symptoms');
    const picked: NavigatorState = { ...empty, selectedSymptomIds: ['MOD_001'] };
    expect(reducer(picked, { type: 'SYMPTOMS_NEXT' })).toMatchObject({ step: 'details', detailIndex: 0 });
  });
});

describe('P36 — intensity (and other detail) selections persist across navigation', () => {
  it('a tapped severity survives paging to the next symptom and back', () => {
    let s: NavigatorState = {
      ...initialNavigatorState,
      step: 'details',
      selectedSymptomIds: ['MOD_001', 'MOD_002'],
      detailIndex: 0,
    };
    s = reducer(s, { type: 'SET_DETAIL', id: 'MOD_001', patch: { severity: 8 } });
    s = reducer(s, { type: 'DETAIL_NEXT' }); // → symptom 2
    expect(s.detailIndex).toBe(1);
    s = reducer(s, { type: 'SET_DETAIL', id: 'MOD_002', patch: { severity: 3 } });
    s = reducer(s, { type: 'BACK' }); // ← back to symptom 1
    expect(s.detailIndex).toBe(0);
    // Both choices are retained, keyed by symptom — never clobbered by navigation.
    expect(s.details.MOD_001).toEqual({ severity: 8 });
    expect(s.details.MOD_002).toEqual({ severity: 3 });
  });

  it('a later patch merges onto the same symptom (severity + frequency coexist)', () => {
    let s: NavigatorState = {
      ...initialNavigatorState,
      step: 'details',
      selectedSymptomIds: ['MOD_001'],
    };
    s = reducer(s, { type: 'SET_DETAIL', id: 'MOD_001', patch: { severity: 6 } });
    s = reducer(s, { type: 'SET_DETAIL', id: 'MOD_001', patch: { frequency: 'often' } });
    expect(s.details.MOD_001).toEqual({ severity: 6, frequency: 'often' });
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
