import { fireEvent, screen } from '@testing-library/react-native';

import { ConsentBanner } from '@/features/mindmate/components/ConsentBanner';
import {
  __resetChatConsentCacheForTests,
  getChatPersistConsent,
} from '@/features/mindmate/persistence/chat-consent';

import { renderWithProviders } from './_helpers';

// Control the session the banner sees (P57 login gate). The `mock` prefix lets jest
// reference it from the hoisted factory.
let mockSession: { userId: string } | null = null;
jest.mock('@/features/auth', () => ({
  useAuth: () => ({ session: mockSession }),
}));

describe('ConsentBanner', () => {
  beforeEach(() => {
    __resetChatConsentCacheForTests();
    mockSession = null;
  });

  it('signed in: starts OFF and flips the live persistence gate when toggled on', () => {
    mockSession = { userId: 'u1' };
    renderWithProviders(<ConsentBanner />);
    // Default OFF — nothing persists until the person opts in.
    expect(getChatPersistConsent()).toBe(false);

    fireEvent(screen.getByTestId('mindmate-consent-toggle'), 'valueChange', true);
    expect(getChatPersistConsent()).toBe(true);

    fireEvent(screen.getByTestId('mindmate-consent-toggle'), 'valueChange', false);
    expect(getChatPersistConsent()).toBe(false);
  });

  it('signed out: turning it on gates to sign-in and does not consent (P57)', () => {
    const onRequireSignIn = jest.fn();
    renderWithProviders(<ConsentBanner onRequireSignIn={onRequireSignIn} />);

    fireEvent(screen.getByTestId('mindmate-consent-toggle'), 'valueChange', true);
    expect(onRequireSignIn).toHaveBeenCalledTimes(1);
    expect(getChatPersistConsent()).toBe(false);
  });

  it('signed out: turning it off is always allowed (no sign-in prompt)', () => {
    const onRequireSignIn = jest.fn();
    renderWithProviders(<ConsentBanner onRequireSignIn={onRequireSignIn} />);

    fireEvent(screen.getByTestId('mindmate-consent-toggle'), 'valueChange', false);
    expect(onRequireSignIn).not.toHaveBeenCalled();
    expect(getChatPersistConsent()).toBe(false);
  });

  it('dismissing is not consenting — onDismiss fires without changing the gate', () => {
    const onDismiss = jest.fn();
    renderWithProviders(<ConsentBanner onDismiss={onDismiss} />);

    fireEvent.press(screen.getByTestId('mindmate-consent-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
    expect(getChatPersistConsent()).toBe(false);
  });
});
