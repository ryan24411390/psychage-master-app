import { screen } from '@testing-library/react-native';

import { GlobalHeader } from '@/components/GlobalHeader';

import { renderWithProviders } from './_helpers';

// C0.1 — the persistent header in its ANONYMOUS state: wordmark left, Help-now
// pill + avatar right, avatar showing the neutral glyph (no assumed initial).
describe('GlobalHeader (anonymous)', () => {
  it('renders the wordmark, the Help-now pill, and the account avatar', () => {
    renderWithProviders(<GlobalHeader />);
    // Two-tone wordmark: Psy (teal) + chage (ink), one accessible word for SR.
    expect(screen.getByLabelText('Psychage')).toBeTruthy();
    expect(screen.getByText('Psy')).toBeTruthy();
    expect(screen.getByText('chage')).toBeTruthy();
    expect(screen.getByText('Help now')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();
    expect(screen.getByLabelText('Account')).toBeTruthy();
  });
});
