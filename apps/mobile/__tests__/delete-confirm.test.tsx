import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), back: jest.fn() } }));
jest.mock('@/lib/check-in-store', () => ({ resetCheckInStore: jest.fn() }));
jest.mock('@/lib/persistence/account-deletion', () => ({
  requestRemoteAccountDeletion: jest.fn(() => Promise.resolve({ requested: false })),
}));

import DeleteConfirmScreen from '@/app/settings/delete-confirm';
import { storage } from '@/lib/adapters/storage';
import { resetCheckInStore } from '@/lib/check-in-store';
import { requestRemoteAccountDeletion } from '@/lib/persistence/account-deletion';

import { renderWithProviders } from './_helpers';

const resetMock = resetCheckInStore as jest.Mock;
const remoteMock = requestRemoteAccountDeletion as jest.Mock;

describe('S48 delete-confirm', () => {
  beforeEach(() => {
    resetMock.mockClear();
    remoteMock.mockClear();
    (router.replace as jest.Mock).mockClear();
  });

  it('confirm wipes local data, resets the store, calls the remote stub, replaces route', () => {
    storage.set('mobile:appearance', JSON.stringify({ version: 1, mode: 'night', reducedMotion: true }));
    renderWithProviders(<DeleteConfirmScreen />, { haptics: true });

    fireEvent.press(screen.getByTestId('destructive-action'));

    expect(storage.get('mobile:appearance')).toBeNull(); // LOCAL hard-immediate wipe
    expect(resetMock).toHaveBeenCalledTimes(1); // live-instance reset
    expect(remoteMock).toHaveBeenCalledTimes(1); // SR-4-gated remote stub seam invoked
    expect(router.replace as jest.Mock).toHaveBeenCalledWith('/'); // no back into a deleted state
  });

  it('offers no undo / recovery affordance (hard-immediate)', () => {
    renderWithProviders(<DeleteConfirmScreen />, { haptics: true });
    expect(screen.queryByText(/undo/i)).toBeNull();
    expect(screen.queryByText(/recover/i)).toBeNull();
  });
});
