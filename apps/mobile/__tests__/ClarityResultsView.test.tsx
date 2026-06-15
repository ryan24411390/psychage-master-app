import { fireEvent, screen } from '@testing-library/react-native';

import { TIER_COPY } from '@/features/clarity/bands';
import { ClarityResultsView } from '@/features/clarity/ClarityResultsView';
import type { ClarityResult } from '@/features/clarity/types';

import { renderWithProviders } from './_helpers';

// The results screen is the rail's sharpest edge: a self-assessment score that must
// NOT read as a verdict. So — bands only, no raw 0–100 number, no progress bar.

const RESULT: ClarityResult = {
  composite: 64,
  tier: 'balanced',
  domains: { emotional: 16, wellbeing: 14, social: 18, stress: 6, functioning: 10 },
  notes: [{ id: 'lonely', text: "You've been feeling disconnected from others lately." }],
  crisis: false,
};

function renderResults(extra: Partial<React.ComponentProps<typeof ClarityResultsView>> = {}) {
  const props = {
    result: RESULT,
    onRecommend: jest.fn(),
    onViewHistory: jest.fn(),
    onRetake: jest.fn(),
    ...extra,
  };
  renderWithProviders(<ClarityResultsView {...props} />);
  return props;
}

describe('ClarityResultsView', () => {
  it('renders the tier band and a domain band WORD — never a raw number or progressbar', () => {
    renderResults();
    expect(screen.getByText('Your snapshot')).toBeTruthy();
    expect(screen.getByText(TIER_COPY.balanced.label)).toBeTruthy();

    // domains render as words, not numbers
    expect(screen.getByText(/feels heavy/)).toBeTruthy(); // stress = 6 → "heavy"
    expect(screen.queryByText('64')).toBeNull();
    expect(screen.queryByText(/\/100/)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('adjustable')).toBeNull();
  });

  it('surfaces the reframed "what stood out" note (person-first, no instrument name)', () => {
    renderResults();
    const note = screen.getByText("You've been feeling disconnected from others lately.");
    expect(note).toBeTruthy();
  });

  it('routes a low-domain recommendation to its mobile path', () => {
    const { onRecommend } = renderResults();
    // stress = 6 (≤10) → the sleep-tools recommendation
    fireEvent.press(screen.getByRole('button', { name: 'Open the sleep tools' }));
    expect(onRecommend).toHaveBeenCalledWith('/tools/sleep');
  });

  it('shows the qualitative change note when provided (no digits)', () => {
    renderResults({ changeNote: 'A little steadier than last time.' });
    const change = screen.getByText('A little steadier than last time.');
    expect(change).toBeTruthy();
  });
});
