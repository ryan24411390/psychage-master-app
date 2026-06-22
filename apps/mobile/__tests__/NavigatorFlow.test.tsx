import { act, fireEvent, screen } from '@testing-library/react-native';

import type { KnowledgeBase, NavigatorResults, Symptom } from '@psychage/shared/navigator';

import { NavigatorFlow } from '@/features/navigator/NavigatorFlow';
import type { HelplineRow } from '@/features/crisis/helpline-schema';
import { storage } from '@/lib/adapters/storage';

import { renderWithProviders } from './_helpers';

// The flow imports ONLY types from @psychage/shared; the engine + provider questions are
// injected, so this jest/RNTL suite never loads the (non-jest-transformed) shared pkg.

function sym(id: string, name: string, crisis = false): Symptom {
  return {
    id,
    name,
    domain: 'emotional',
    category: 'mood',
    description: '',
    synonyms: [],
    ask_duration: true,
    ask_severity: true,
    ask_frequency: true,
    is_red_flag: crisis,
    red_flag_level: crisis ? 'CRISIS' : null,
    severity_red_flag_threshold: null,
    severity_red_flag_level: null,
    display_order: 1,
    is_active: true,
    version: '1.0.0',
  };
}

const KB = {
  symptoms: [sym('MOD_001', 'Low mood'), sym('MOD_002', 'Loss of interest')],
} as unknown as KnowledgeBase;

const HELPLINES: HelplineRow[] = [
  {
    name: 'Sample Line',
    fiveWordDesc: 'Free support, all hours here',
    callNumber: '111',
    textNumber: null,
    region: 'US',
  },
];

const OK_RESULT = {
  safety: { has_crisis: false, has_urgent: false, has_watch: false, should_halt: false },
  results: [
    {
      condition_id: 'MDE',
      name: 'Depression',
      full_name: 'Major Depressive Episode',
      description_for_user: 'Long stretches of low mood are common.',
      relevance_score: 0.5,
      relevance_level: 'high',
      relevance_label: 'Highly Relevant',
      relevance_color: '#000',
      matched_symptoms: [{ name: 'Low mood', role: 'core' }],
      guide_path: '',
      coping_path: '',
      provider_questions: [],
      always_recommend_professional: false,
    },
  ],
  general_recommendations: [],
  disclaimer: '',
  version: '1',
  timestamp: '',
} as unknown as NavigatorResults;

const HALT_RESULT = {
  safety: { has_crisis: true, has_urgent: true, has_watch: false, should_halt: true },
  results: [],
} as unknown as NavigatorResults;

function renderFlow(runNavigator: () => NavigatorResults) {
  const handlers = {
    onExit: jest.fn(),
    onTrack: jest.fn(),
    onFindCare: jest.fn(),
    onLearn: jest.fn(),
  };
  renderWithProviders(
    <NavigatorFlow
      kb={KB}
      runNavigator={runNavigator}
      getProviderQuestions={() => ['What might be going on?']}
      emergencyNumber="911"
      helplines={HELPLINES}
      {...handlers}
    />,
    { haptics: true },
  );
  return handlers;
}

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

/** welcome → domains → symptoms → details, stopping ON the safety question. */
function driveToSafety() {
  press('Start the Navigator');
  fireEvent.press(screen.getByText('Emotional & Mood'));
  press('Continue');
  fireEvent.press(screen.getByText('Low mood'));
  press('Continue');
  press('See results'); // single symptom → last detail page
}

describe('NavigatorFlow (web-parity flow)', () => {
  it('Welcome → start reveals the domain step', () => {
    renderFlow(() => OK_RESULT);
    expect(screen.getByText('Understand your experience.')).toBeTruthy();
    press('Start the Navigator');
    expect(screen.getByText('Where are you noticing things?')).toBeTruthy();
  });

  it('SR-2: the Help-now crisis pill is present from the first step (ToolScreen chrome)', () => {
    renderFlow(() => OK_RESULT);
    // welcome step — Navigator previously had NO always-visible crisis affordance;
    // ToolScreen now guarantees one. Exactly one, no double-chrome.
    expect(screen.getByLabelText('Help now')).toBeTruthy();
    expect(screen.getAllByLabelText('Help now')).toHaveLength(1);
    press('Start the Navigator');
    expect(screen.getByLabelText('Help now')).toBeTruthy(); // domains step
  });

  it('runs the full flow to the report with an animated confidence bar + % (signed-off parity)', () => {
    jest.useFakeTimers();
    try {
      renderFlow(() => OK_RESULT);
      driveToSafety();
      press('No');
      act(() => {
        jest.advanceTimersByTime(2400); // processing pacing
      });
      expect(screen.getByText('Your Results')).toBeTruthy();
      expect(screen.getByText('Depression')).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy(); // confidence percentage shown
    } finally {
      jest.useRealTimers();
    }
  });

  it('"Yes" on the safety question halts (crisis actions embedded), never proceeds', () => {
    renderFlow(() => OK_RESULT);
    driveToSafety();
    press('Yes');
    expect(
      screen.getByText("Then let's pause this. What you're feeling deserves real support right now."),
    ).toBeTruthy();
    expect(screen.queryByText('Your Results')).toBeNull();
  });

  it('engine should_halt also routes to the crisis surface, not results', () => {
    jest.useFakeTimers();
    try {
      renderFlow(() => HALT_RESULT);
      driveToSafety();
      press('No');
      act(() => {
        jest.advanceTimersByTime(2400);
      });
      expect(
        screen.getByText("Then let's pause this. What you're feeling deserves real support right now."),
      ).toBeTruthy();
      expect(screen.queryByText('Your Results')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('SR-4: completing the flow persists NOTHING (no storage writes)', () => {
    jest.useFakeTimers();
    const setSpy = jest.spyOn(storage, 'set');
    try {
      setSpy.mockClear();
      renderFlow(() => OK_RESULT);
      driveToSafety();
      press('No');
      act(() => {
        jest.advanceTimersByTime(2400);
      });
      expect(setSpy).not.toHaveBeenCalled();
    } finally {
      setSpy.mockRestore();
      jest.useRealTimers();
    }
  });

  it('"Something else" reveals the symptom search', () => {
    renderFlow(() => OK_RESULT);
    press('Start the Navigator');
    fireEvent.press(screen.getByText('Emotional & Mood'));
    press('Continue');
    press('Something else');
    expect(screen.getByLabelText('Search symptoms')).toBeTruthy();
  });
});

// ── P35 — paged symptom selection (one category per page) ─────────────────────────
function symInCategory(id: string, name: string, category: Symptom['category']): Symptom {
  return { ...sym(id, name), category };
}

const TWO_CATEGORY_KB = {
  symptoms: [
    symInCategory('MOD_001', 'Low mood', 'mood'),
    symInCategory('ANX_001', 'Constant worry', 'anxiety_fear'),
  ],
} as unknown as KnowledgeBase;

describe('P35 — symptom selection paginates by category', () => {
  function renderTwoCategoryFlow() {
    renderWithProviders(
      <NavigatorFlow
        kb={TWO_CATEGORY_KB}
        runNavigator={() => OK_RESULT}
        getProviderQuestions={() => ['What might be going on?']}
        emergencyNumber="911"
        helplines={HELPLINES}
        onExit={jest.fn()}
        onTrack={jest.fn()}
        onFindCare={jest.fn()}
        onLearn={jest.fn()}
      />,
      { haptics: true },
    );
    press('Start the Navigator');
    fireEvent.press(screen.getByText('Emotional & Mood'));
    press('Continue'); // domains → symptoms (page 0)
  }

  it('shows one category per page with a position indicator and a Next control', () => {
    renderTwoCategoryFlow();
    // Page 1 of 2 — only the first category's chip is on screen.
    expect(screen.getByText('Area 1 of 2')).toBeTruthy();
    expect(screen.getByText('Low mood')).toBeTruthy();
    expect(screen.queryByText('Constant worry')).toBeNull();
    // The primary advances the page (not the final continue) on a non-last page.
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    press('Next');
    expect(screen.getByText('Area 2 of 2')).toBeTruthy();
    expect(screen.getByText('Constant worry')).toBeTruthy();
    expect(screen.queryByText('Low mood')).toBeNull();
  });

  it('the global back affordance walks back through the pages', () => {
    renderTwoCategoryFlow();
    press('Next');
    expect(screen.getByText('Area 2 of 2')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText('Area 1 of 2')).toBeTruthy();
  });

  it('the last page is the final gate → details (needs ≥1 symptom overall)', () => {
    renderTwoCategoryFlow();
    press('Next'); // → last page
    fireEvent.press(screen.getByText('Constant worry')); // select on the last page
    press('Continue'); // last page → details
    expect(screen.getByText('How intense does this feel?')).toBeTruthy();
  });
});

// ── P37/P38 — enlarged, contrast-safe detail question prompts ─────────────────────
// ── P36 — the intensity selector registers and reflects the choice ────────────────
describe('Detail step — question prompts (P37/P38) and intensity (P36)', () => {
  function driveToFirstDetail() {
    renderFlow(() => OK_RESULT);
    press('Start the Navigator');
    fireEvent.press(screen.getByText('Emotional & Mood'));
    press('Continue');
    fireEvent.press(screen.getByText('Low mood'));
    press('Continue'); // single category → details
  }

  it('renders all three question prompts (enlarged headers, primary ink)', () => {
    driveToFirstDetail();
    expect(screen.getByText('How intense does this feel?')).toBeTruthy();
    expect(screen.getByText('How long has this been going on?')).toBeTruthy();
    expect(screen.getByText('How often does it happen?')).toBeTruthy();
  });

  it('P36: tapping an intensity segment registers and updates the live tier label', () => {
    driveToFirstDetail();
    // Default severity 5 → "Moderate"; "Significant" not yet shown.
    expect(screen.getByText('Moderate')).toBeTruthy();
    expect(screen.queryByText('Significant')).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: '8 — Significant' }));
    // The choice registered: the live tier label now reads "Significant".
    expect(screen.getByText('Significant')).toBeTruthy();
  });
});
