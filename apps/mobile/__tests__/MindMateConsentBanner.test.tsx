import { fireEvent, screen } from '@testing-library/react-native';

import { ConsentBanner } from '@/features/mindmate/components/ConsentBanner';
import {
  __resetChatConsentCacheForTests,
  getChatPersistConsent,
} from '@/features/mindmate/persistence/chat-consent';

import { renderWithProviders } from './_helpers';

describe('ConsentBanner', () => {
  beforeEach(() => {
    __resetChatConsentCacheForTests();
  });

  it('starts OFF and flips the live persistence gate when toggled on', () => {
    renderWithProviders(<ConsentBanner />);
    // Default OFF — nothing persists until the person opts in.
    expect(getChatPersistConsent()).toBe(false);

    fireEvent(screen.getByTestId('mindmate-consent-toggle'), 'valueChange', true);
    expect(getChatPersistConsent()).toBe(true);

    fireEvent(screen.getByTestId('mindmate-consent-toggle'), 'valueChange', false);
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
