import { screen } from '@testing-library/react-native';

jest.mock('@/features/offline/useIsOnline', () => ({ useIsOnline: jest.fn() }));
jest.mock('@/components/HeaderAvatar', () => ({ HeaderAvatar: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() }, useFocusEffect: () => undefined }));

import FindScreen from '@/app/(tabs)/(find)/find';
import { useIsOnline } from '@/features/offline/useIsOnline';
import {
  __resetDirectoryLocationCacheForTests,
  resetDirectoryLocation,
} from '@/lib/persistence/directory-location';

import { renderWithProviders } from './_helpers';

const onlineMock = useIsOnline as unknown as jest.Mock;

describe('S28 Find — prototype port', () => {
  beforeEach(() => {
    // Fresh, unconfigured location so the screen starts on the location step.
    __resetDirectoryLocationCacheForTests();
    resetDirectoryLocation();
    __resetDirectoryLocationCacheForTests();
  });

  it('offline: shows the honest fallback instead of the directory', () => {
    onlineMock.mockReturnValue(false);
    renderWithProviders(<FindScreen />, { haptics: true, query: true });
    expect(screen.getByTestId('find-offline')).toBeTruthy();
  });

  it('online + first visit: shows the location hero', () => {
    onlineMock.mockReturnValue(true);
    renderWithProviders(<FindScreen />, { haptics: true, query: true });
    expect(screen.getByText('Find care')).toBeTruthy();
    expect(screen.getByText('Use my location')).toBeTruthy();
    expect(screen.getByText('Enter my state instead')).toBeTruthy();
  });
});
