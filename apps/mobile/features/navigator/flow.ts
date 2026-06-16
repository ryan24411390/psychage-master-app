// Navigator flow state machine — PURE reducer (no React, type-only shared import) →
// Vitest. In-memory ONLY: the container holds this in component state, so leaving the
// flow unmounts it and nothing persists (SR-4 — selections never leave the device, and
// an abandoned acute session leaves zero residue; re-entry starts fresh).
//
// Web-V2 parity flow (see psychage-v2 NavigatorFlow):
//   welcome → domains → symptoms → details (paged, one symptom at a time)
//     → safety → (Yes) halt | (No) processing → results | halt (engine red-flag screen)
//
// `processing` is the signal for the container to run the INJECTED engine and branch on
// `safety.should_halt`; the reducer itself never runs the engine (stays pure). The
// `safety` step is a mobile-only extra crisis gate retained on top of web's KB red-flag
// detection (Sacred Rule 3 — crisis detection can only be added to, never weakened).

import type {
  SymptomDomain,
  UserDuration,
  UserFrequency,
  UserSymptomInput,
} from '@psychage/shared/navigator';

export type NavStep =
  | 'welcome'
  | 'domains'
  | 'symptoms'
  | 'details'
  | 'safety'
  | 'processing'
  | 'results'
  | 'halt';

export type SeverityAnswer = 'no' | 'yes';

/** Per-symptom answers collected on the Detail screen. All optional — the engine
 *  defaults any missing field (severity→5, duration→2_to_4_weeks, frequency→sometimes),
 *  matching web's pickers, which start unselected. */
export interface SymptomDetail {
  readonly severity?: number; // 1–10
  readonly duration?: UserDuration;
  readonly frequency?: UserFrequency;
}

export interface NavigatorState {
  readonly step: NavStep;
  readonly selectedDomains: readonly SymptomDomain[];
  readonly selectedSymptomIds: readonly string[];
  readonly details: Readonly<Record<string, SymptomDetail>>;
  readonly detailIndex: number;
  readonly severityAnswer: SeverityAnswer | null;
}

export const initialNavigatorState: NavigatorState = {
  step: 'welcome',
  selectedDomains: [],
  selectedSymptomIds: [],
  details: {},
  detailIndex: 0,
  severityAnswer: null,
};

export type NavigatorAction =
  | { type: 'START' }
  | { type: 'TOGGLE_DOMAIN'; domain: SymptomDomain }
  | { type: 'SELECT_ALL_DOMAINS'; domains: readonly SymptomDomain[] }
  | { type: 'DOMAINS_NEXT' }
  | { type: 'TOGGLE_SYMPTOM'; id: string }
  | { type: 'ADD_SYMPTOMS'; ids: readonly string[] }
  | { type: 'REMOVE_SYMPTOMS'; ids: readonly string[] }
  | { type: 'SYMPTOMS_NEXT' }
  | { type: 'SET_DETAIL'; id: string; patch: SymptomDetail }
  | { type: 'DETAIL_NEXT' }
  | { type: 'JUMP_DETAIL'; index: number }
  | { type: 'ANSWER_SAFETY'; answer: SeverityAnswer }
  | { type: 'SHOW_RESULTS' }
  | { type: 'BACK' }
  | { type: 'RESET' };

/** True when BACK on the current state should EXIT the flow (the container handles it). */
export function isExitOnBack(state: NavigatorState): boolean {
  return state.step === 'welcome';
}

function lastDetailIndex(state: NavigatorState): number {
  return Math.max(0, state.selectedSymptomIds.length - 1);
}

function back(state: NavigatorState): NavigatorState {
  switch (state.step) {
    case 'welcome':
      return state; // container exits; reducer no-ops
    case 'domains':
      return { ...state, step: 'welcome' };
    case 'symptoms':
      return { ...state, step: 'domains' };
    case 'details':
      return state.detailIndex > 0
        ? { ...state, detailIndex: state.detailIndex - 1 }
        : { ...state, step: 'symptoms' };
    case 'safety':
      return { ...state, step: 'details', detailIndex: lastDetailIndex(state) };
    case 'processing':
      // Reached only via safety "No"; walk back to the safety question.
      return { ...state, step: 'safety', severityAnswer: null };
    case 'results':
      // Web "Go Back" returns to the symptom screen (detail edits are preserved).
      return { ...state, step: 'symptoms' };
    case 'halt':
      // Walking back past a halt re-opens the safety question (never silently resumes
      // into results on a "Yes" path).
      return { ...state, step: 'safety', severityAnswer: null };
  }
}

export function navigatorReducer(
  state: NavigatorState,
  action: NavigatorAction,
): NavigatorState {
  switch (action.type) {
    case 'START':
      return { ...state, step: 'domains' };

    case 'TOGGLE_DOMAIN': {
      const has = state.selectedDomains.includes(action.domain);
      return {
        ...state,
        selectedDomains: has
          ? state.selectedDomains.filter((d) => d !== action.domain)
          : [...state.selectedDomains, action.domain],
      };
    }

    case 'SELECT_ALL_DOMAINS':
      // Web "Select All" picks every domain and advances straight to symptoms.
      return { ...state, selectedDomains: [...action.domains], step: 'symptoms' };

    case 'DOMAINS_NEXT':
      if (state.selectedDomains.length === 0) return state; // need ≥1 domain
      return { ...state, step: 'symptoms' };

    case 'TOGGLE_SYMPTOM': {
      const has = state.selectedSymptomIds.includes(action.id);
      return {
        ...state,
        selectedSymptomIds: has
          ? state.selectedSymptomIds.filter((id) => id !== action.id)
          : [...state.selectedSymptomIds, action.id],
      };
    }

    case 'ADD_SYMPTOMS': {
      const set = new Set([...state.selectedSymptomIds, ...action.ids]);
      return { ...state, selectedSymptomIds: [...set] };
    }

    case 'REMOVE_SYMPTOMS': {
      const drop = new Set(action.ids);
      return {
        ...state,
        selectedSymptomIds: state.selectedSymptomIds.filter((id) => !drop.has(id)),
      };
    }

    case 'SYMPTOMS_NEXT':
      if (state.selectedSymptomIds.length === 0) return state; // need ≥1 symptom
      return { ...state, step: 'details', detailIndex: 0 };

    case 'SET_DETAIL':
      return {
        ...state,
        details: {
          ...state.details,
          [action.id]: { ...state.details[action.id], ...action.patch },
        },
      };

    case 'DETAIL_NEXT': {
      const next = state.detailIndex + 1;
      return next < state.selectedSymptomIds.length
        ? { ...state, detailIndex: next }
        : { ...state, step: 'safety' };
    }

    case 'JUMP_DETAIL': {
      const i = Math.min(Math.max(0, action.index), lastDetailIndex(state));
      return { ...state, step: 'details', detailIndex: i };
    }

    case 'ANSWER_SAFETY':
      // SR-2/SR-3: "Yes" ALWAYS halts, at any point — no flag can bypass it.
      return action.answer === 'yes'
        ? { ...state, severityAnswer: 'yes', step: 'halt' }
        : { ...state, severityAnswer: 'no', step: 'processing' };

    case 'SHOW_RESULTS':
      // Dispatched by the container once the processing animation completes and the
      // engine did NOT halt.
      return { ...state, step: 'results' };

    case 'BACK':
      return back(state);

    case 'RESET':
      return initialNavigatorState;
  }
}

/** Map the collected per-symptom answers into the engine's UserSymptomInput[]. Carries
 *  severity/duration/frequency through to the engine — this is the web-parity scoring
 *  fix (the prior mobile flow dropped severity entirely, forcing the engine default).
 *  Missing fields are omitted so the engine applies the same defaults web does. */
export function buildUserInputs(state: NavigatorState): UserSymptomInput[] {
  return state.selectedSymptomIds.map((symptom_id) => {
    const d = state.details[symptom_id];
    return {
      symptom_id,
      ...(d?.severity !== undefined ? { severity: d.severity } : {}),
      ...(d?.duration !== undefined ? { duration: d.duration } : {}),
      ...(d?.frequency !== undefined ? { frequency: d.frequency } : {}),
    };
  });
}
