import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/offline/useIsOnline', () => ({ useIsOnline: jest.fn() }));

import FindScreen from '@/app/(tabs)/find';
import { useIsOnline } from '@/features/offline/useIsOnline';

import { renderWithProviders } from './_helpers';

const onlineMock = useIsOnline as unknown as jest.Mock;

describe('S28 Find', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('online: opens the directory (S26 native list)', () => {
    onlineMock.mockReturnValue(true);
    renderWithProviders(<FindScreen />, { haptics: true });
    fireEvent.press(screen.getByTestId('find-open-directory'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/find/directory');
  });

  it('offline: shows the honest fallback instead of a dead directory', () => {
    onlineMock.mockReturnValue(false);
    renderWithProviders(<FindScreen />, { haptics: true });
    expect(screen.getByTestId('find-offline')).toBeTruthy();
  });
});
