import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

// Route-level wiring for the onboarding close (S4 acknowledge → S6 orient → S7 founder).
// The contract under test: the close screens are ALL pass-throughs — none of them mark
// onboarding seen. Mark-seen is anchored upstream to the first Moment save in S3 (see
// onboarding-moment-routing.test.tsx); by the time the close renders, onboarding is already
// marked. (usePathname is stubbed so the route-auto <Mascot> resolves a state and renders.)
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

describe('onboarding close routing — the close screens never mark seen (anchored at S3 save)', () => {
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

  it('S7 founder Continue → replaces to the first-run home and does NOT mark seen', () => {
    renderWithProviders(<FounderScreen />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(replaceMock).toHaveBeenCalledWith('/');
    expect(seenMock).not.toHaveBeenCalled();
  });
});
