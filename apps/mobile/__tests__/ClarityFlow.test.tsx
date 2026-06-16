import { fireEvent, screen } from '@testing-library/react-native';

import { ClarityFlow } from '@/features/clarity/ClarityFlow';
import { CLARITY_QUESTIONS } from '@/features/clarity/questions';
import { scoreClarity } from '@/features/clarity/scoring';
import type { ClarityResult } from '@/features/clarity/types';

import { renderWithProviders } from './_helpers';

/** Narrow an indexed access to a definite value (tsc noUncheckedIndexedAccess). */
function req<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`expected ${label} to be defined`);
  return value;
}

// Render tests for the native flow under the web-parity override. The store is INJECTED
// via saveResult (a jest.fn), so this never touches the real MMKV store. Asserts: the
// Help-now pill is on every screen (SR-2), the crisis interstitial blocks after a crisis
// q4 (SR-2), and the results dashboard shows the RAW score + "/ 100" + the web tier label
// after the 2s calculating interlude.

function renderFlow() {
  const saveResult = jest.fn<number | null, [ClarityResult]>(() => null);
  const handlers = {
    onExit: jest.fn(),
    onHelp: jest.fn(),
    onCrisisResources: jest.fn(),
    onRecommend: jest.fn(),
    onViewHistory: jest.fn(),
    saveResult,
  };
  renderWithProviders(<ClarityFlow {...handlers} />, { haptics: true });
  return handlers;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

describe('ClarityFlow', () => {
  it('intro begins the flow; the Help-now pill is present on every screen', () => {
    renderFlow();
    expect(screen.getByText('Clarity Score')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();

    press('Begin');
    expect(screen.getByText('Question 1 of 20')).toBeTruthy();
    expect(screen.getByText(req(CLARITY_QUESTIONS[0], 'q1').prompt)).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();
  });

  it('a crisis answer on q4 raises the interstitial and blocks until acknowledged (SR-2)', () => {
    renderFlow();
    press('Begin');
    press('Not at all'); // q1 = 0
    press('Not at all'); // q2 = 0
    press('Not at all'); // q3 = 0
    press('Nearly every day'); // q4 = 3 → crisis pattern

    expect(screen.getByText('Support is available')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();
    expect(screen.queryByText('Question 5 of 20')).toBeNull();

    press(/safe right now/);
    expect(screen.getByText('Question 5 of 20')).toBeTruthy();
  });

  it('completing all 20 (no crisis) calculates, then shows the raw score dashboard and saves once', async () => {
    const handlers = renderFlow();
    press('Begin');
    for (const q of CLARITY_QUESTIONS) {
      press(req(q.options[0], q.id).label); // first option each — keeps q4 below the crisis threshold
    }

    const answers: Record<string, number> = {};
    for (const q of CLARITY_QUESTIONS) answers[q.id] = req(q.options[0], q.id).value;
    const expected = scoreClarity(answers);

    // The 2s calculating interlude shows first.
    expect(screen.getByText('Analyzing your responses…')).toBeTruthy();

    // After the timer elapses, the dashboard reveals the raw composite + "/ 100" + label.
    await screen.findByText('/ 100', {}, { timeout: 4000 });
    expect(screen.getAllByText(String(expected.totalScore)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(expected.label).length).toBeGreaterThan(0);
    expect(screen.getByText('Overview')).toBeTruthy();

    // Saved exactly once with the completed result.
    expect(handlers.saveResult).toHaveBeenCalledTimes(1);
    const saved = req(handlers.saveResult.mock.calls[0], 'save call')[0];
    expect(saved.totalScore).toBe(expected.totalScore);
    expect(saved.tier).toBe(expected.tier);
  });

  it('the crisis interstitial routes to the crisis surface', () => {
    const handlers = renderFlow();
    press('Begin');
    press('Not at all');
    press('Not at all');
    press('Not at all');
    press('Nearly every day');
    press('See support resources');
    expect(handlers.onCrisisResources).toHaveBeenCalledTimes(1);
  });
});
