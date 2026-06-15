import { screen } from '@testing-library/react-native';

import { GlobalHeader } from '@/components/GlobalHeader';

import { renderWithProviders } from './_helpers';

// C0.1 — the persistent header in its ANONYMOUS state: wordmark left, Help-now
// pill + avatar right, avatar showing the neutral glyph (no assumed initial).
describe('GlobalHeader (anonymous)', () => {
  it('renders the wordmark, the Help-now pill, and the account avatar', () => {
    renderWithProviders(<GlobalHeader />);
    expect(screen.getByText('Psychage')).toBeTruthy();
    expect(screen.getByText('Help now')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();
    expect(screen.getByLabelText('Account')).toBeTruthy();
  });
});
