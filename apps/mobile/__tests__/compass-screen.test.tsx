import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import CompassScreen from '@/app/(tabs)/compass';
import { COMPASS_ROUTES } from '@/features/compass/routes';

import { renderWithProviders } from './_helpers';

describe('S5 Compass shell', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders the two landing tiles and links to A2 destinations (stubbed paths)', () => {
    renderWithProviders(<CompassScreen />);
    fireEvent.press(screen.getByTestId('compass-tile-toolkit'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(COMPASS_ROUTES.toolkit);
    fireEvent.press(screen.getByTestId('compass-tile-navigator'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(COMPASS_ROUTES.navigator);
  });
});
