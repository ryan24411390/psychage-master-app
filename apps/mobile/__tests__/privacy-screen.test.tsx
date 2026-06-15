import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/check-in-store', () => ({
  getCheckInStore: () => ({ getRange: () => [] }),
  resetCheckInStore: jest.fn(),
}));
jest.mock('@/lib/export/share-record', () => ({ shareRecordFile: jest.fn(() => Promise.resolve()) }));

import PrivacyScreen from '@/app/settings/privacy';
import { shareRecordFile } from '@/lib/export/share-record';
import {
  __resetSyncConsentCacheForTests,
  getCheckInSyncConsent,
} from '@/lib/persistence/sync-consent';

import { renderWithProviders } from './_helpers';

const shareMock = shareRecordFile as unknown as jest.Mock;

describe('S46 Privacy & your data', () => {
  beforeEach(() => {
    shareMock.mockClear();
    (router.push as jest.Mock).mockClear();
    __resetSyncConsentCacheForTests();
  });

  it('hands off a JSON file when Export as JSON is pressed', async () => {
    renderWithProviders(<PrivacyScreen />, { haptics: true });
    fireEvent.press(screen.getByTestId('export-json'));
    await waitFor(() => expect(shareMock).toHaveBeenCalledWith('json', expect.any(String)));
  });

  it('the delete entry leads to the honest delete screen', () => {
    renderWithProviders(<PrivacyScreen />, { haptics: true });
    fireEvent.press(screen.getByTestId('privacy-delete-entry'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/settings/delete');
  });

  it('check-in backup consent defaults OFF and flips on (gates the sync)', () => {
    expect(getCheckInSyncConsent()).toBe(false);
    renderWithProviders(<PrivacyScreen />, { haptics: true });
    fireEvent(screen.getByTestId('sync-consent-toggle'), 'valueChange', true);
    expect(getCheckInSyncConsent()).toBe(true);
  });
});
