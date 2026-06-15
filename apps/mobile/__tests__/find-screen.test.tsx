import { fireEvent, screen } from '@testing-library/react-native';

jest.mock('@/features/offline/useIsOnline', () => ({ useIsOnline: jest.fn() }));

import FindScreen from '@/app/(tabs)/find';
import { useIsOnline } from '@/features/offline/useIsOnline';
import {
  __resetDirectoryLocationCacheForTests,
  resetDirectoryLocation,
} from '@/lib/persistence/directory-location';

import { renderWithProviders } from './_helpers';

const onlineMock = useIsOnline as unknown as jest.Mock;

describe('S28 Find — location gate', () => {
  beforeEach(() => {
    // Fresh, unconfigured location for each case (in-memory storage is a singleton).
    __resetDirectoryLocationCacheForTests();
    resetDirectoryLocation();
    __resetDirectoryLocationCacheForTests();
  });

  it('offline: shows the honest fallback instead of a dead directory', () => {
    onlineMock.mockReturnValue(false);
    renderWithProviders(<FindScreen />, { haptics: true });
    expect(screen.getByTestId('find-offline')).toBeTruthy();
  });

  it('online + first visit: shows the one-time location setup', () => {
    onlineMock.mockReturnValue(true);
    renderWithProviders(<FindScreen />, { haptics: true });
    expect(screen.getByTestId('setup-browse-all')).toBeTruthy();
    expect(screen.getByTestId('setup-state-CA')).toBeTruthy();
  });

  it('online + completing setup flips the gate to the directory', () => {
    onlineMock.mockReturnValue(true);
    renderWithProviders(<FindScreen />, { haptics: true, query: true });
    // "Browse all states" completes setup with no scope → directory opens.
    fireEvent.press(screen.getByTestId('setup-browse-all'));
    expect(screen.getByTestId('directory-filters')).toBeTruthy();
  });
});
