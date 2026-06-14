import { fireEvent, screen } from '@testing-library/react-native';

import type { NavigatorResults } from '@psychage/shared/navigator';

import type { SymptomOption } from '@/features/navigator/areas';
import { CLARIFIERS } from '@/features/navigator/clarifiers';
import { NavigatorFlow } from '@/features/navigator/NavigatorFlow';
import type { HelplineRow } from '@/features/crisis/helpline-schema';
import { storage } from '@/lib/adapters/storage';

import { renderWithProviders } from './_helpers';

const SYMPTOMS: SymptomOption[] = [
  { id: 'low_mood', name: 'Low mood', area: 'mind', order: 1 },
  { id: 'worry', name: 'Constant worry', area: 'mind', order: 2 },
  { id: 'cant_sleep', name: 'Trouble sleeping', area: 'sleep', order: 1 },
];

const HELPLINES: HelplineRow[] = [
  { name: 'Sample Line', fiveWordDesc: 'Free support, all hours here', callNumber: '111', textCapable: false, region: 'US' },
];

const OK_RESULT = {
  safety: { should_halt: false },
  results: [
    {
      condition_id: 'low_mood_pattern',
      name: 'Ongoing low mood',
      description_for_user: 'Long stretches of low mood are common.',
      relevance_label: 'Strong match',
    },
  ],
} as unknown as NavigatorResults;

const HALT_RESULT = { safety: { should_halt: true }, results: [] } as unknown as NavigatorResults;

function renderFlow(runNavigator: () => NavigatorResults) {
  const handlers = {
    onExit: jest.fn(),
    onReadAbout: jest.fn(),
    onSteadyingNow: jest.fn(),
    onFindCare: jest.fn(),
  };
  renderWithProviders(
    <NavigatorFlow
      symptoms={SYMPTOMS}
      clarifiers={CLARIFIERS}
      runNavigator={runNavigator}
      emergencyNumber="911"
      helplines={HELPLINES}
      {...handlers}
    />,
    { haptics: true },
  );
  return handlers;
}

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

/** S13 → S14 → clarifiers → S16, stopping before the severity answer. */
function driveToSeverity() {
  press('Mind');
  press('Low mood');
  press('Continue');
  press('Today'); // duration
  press('Often'); // frequency
}

describe('NavigatorFlow (S13–S18)', () => {
  it('runs the 4–6 step flow to capped TEXT results (no bar) with the verbatim caveat', () => {
    renderFlow(() => OK_RESULT);
    driveToSeverity();
    press('No');
    expect(screen.getByText('No online tool can be certain. A clinician can.')).toBeTruthy();
    expect(screen.getByText('Ongoing low mood')).toBeTruthy();
    expect(screen.getByText('Strong match')).toBeTruthy();
    // C-REL-PHRASE is TEXT only — never a progress bar/meter/gauge.
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('adjustable')).toBeNull();
  });

  it('"Yes" on the severity question halts to S17 (crisis actions embedded), never proceeds', () => {
    renderFlow(() => OK_RESULT);
    driveToSeverity();
    press('Yes');
    expect(
      screen.getByText("Then let's pause this. What you're feeling deserves real support right now."),
    ).toBeTruthy();
    expect(screen.getByLabelText('Call your local emergency number')).toBeTruthy();
    // never reached results
    expect(screen.queryByText('Ongoing low mood')).toBeNull();
  });

  it('a CRISIS-flagged selection (engine should_halt) also halts to S17', () => {
    renderFlow(() => HALT_RESULT);
    driveToSeverity();
    press('No'); // engine returns should_halt → HaltView, not results
    expect(
      screen.getByText("Then let's pause this. What you're feeling deserves real support right now."),
    ).toBeTruthy();
    expect(screen.queryByText('Ongoing low mood')).toBeNull();
  });

  it('SR-4: completing the flow persists NOTHING (no storage writes)', () => {
    const setSpy = jest.spyOn(storage, 'set');
    setSpy.mockClear();
    renderFlow(() => OK_RESULT);
    driveToSeverity();
    press('No');
    expect(setSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
  });

  it('"Something else" reveals the symptom search', () => {
    renderFlow(() => OK_RESULT);
    press('Mind');
    press('Something else');
    expect(screen.getByLabelText('Search symptoms')).toBeTruthy();
  });
});
