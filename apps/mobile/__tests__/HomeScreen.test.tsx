import { fireEvent, screen } from '@testing-library/react-native';

import TodayScreen from '@/app/(tabs)/index';

import { renderWithProviders } from './_helpers';

// Integration: the S3 screen wires the dev state toggle + fixtures into HomeView.
// Greeting depends on the real clock (not asserted); the regular fixture's status,
// record label, and footer are deterministic.
describe('TodayScreen (S3 wiring)', () => {
  it('renders the regular state by default and switches to first-run', () => {
    renderWithProviders(<TodayScreen />, { haptics: true });

    expect(screen.getByText('Not yet checked in today · Yesterday: Good.')).toBeTruthy();
    expect(screen.getByText('Your last 7 days')).toBeTruthy();
    expect(screen.getByText('Free for everyone · 5 languages · No ads')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('dev-state-first-run'));

    expect(screen.getByText('This is your space. It starts whenever you’re ready.')).toBeTruthy();
    expect(screen.getByText('Your record')).toBeTruthy();
  });
});
