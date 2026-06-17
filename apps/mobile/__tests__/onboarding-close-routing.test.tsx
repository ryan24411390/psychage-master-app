import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

// Route-level wiring for the onboarding close (S4 acknowledge → S6 orient → S7 founder).
// The contract under test: on the HAPPY PATH, markOnboardingSeen fires exactly once — at
// the founder screen (S7) — and nowhere earlier. Acknowledge and orient are pass-throughs.
// (usePathname is stubbed so the route-auto <Mascot> resolves a state and renders.)
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
  usePathname: () => '/',
}));
jest.mock('@/lib/persistence/onboarding', () => ({ markOnboardingSeen: jest.fn() }));

import AcknowledgeScreen from '@/app/onboarding/acknowledge';
import FounderScreen from '@/app/onboarding/founder';
import OrientScreen from '@/app/onboarding/orient';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

import { renderWithProviders } from './_helpers';

const replaceMock = router.replace as jest.Mock;
const seenMock = markOnboardingSeen as jest.Mock;

describe('onboarding close routing — markOnboardingSeen fires only at the founder screen', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    seenMock.mockClear();
  });

  it('S4 acknowledge Continue → routes to /onboarding/orient and does NOT mark seen', () => {
    renderWithProviders(<AcknowledgeScreen />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(replaceMock).toHaveBeenCalledWith('/onboarding/orient');
    expect(seenMock).not.toHaveBeenCalled();
  });

  it('S6 orient Continue → routes to /onboarding/founder and does NOT mark seen', () => {
    renderWithProviders(<OrientScreen />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(replaceMock).toHaveBeenCalledWith('/onboarding/founder');
    expect(seenMock).not.toHaveBeenCalled();
  });

  it('S7 founder Continue → marks seen, then replaces to the first-run home', () => {
    renderWithProviders(<FounderScreen />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(seenMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/');
  });
});
