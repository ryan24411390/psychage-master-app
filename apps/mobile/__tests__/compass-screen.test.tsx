import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: () => undefined,
}));

import CompassScreen from '@/app/(tabs)/(compass)/compass';
import { COMPASS_ROUTES } from '@/features/compass/routes';

import { renderWithProviders } from './_helpers';

describe('Compass bento landing', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  // Every tile is a single accessible pressable that routes to its tool.
  const tiles: ReadonlyArray<[testID: string, route: string]> = [
    ['compass-tile-toolkit', COMPASS_ROUTES.toolkit],
    ['compass-tile-navigator', COMPASS_ROUTES.navigator],
    ['compass-tile-mindmate', COMPASS_ROUTES.mindmate],
    ['compass-tile-clarity', COMPASS_ROUTES.clarity],
    ['compass-tile-mood-journal', COMPASS_ROUTES.moodJournal],
    ['compass-tile-relationship', COMPASS_ROUTES.relationship],
    ['compass-tile-sleep', COMPASS_ROUTES.sleep],
    ['compass-tile-toolkits', COMPASS_ROUTES.toolkits],
  ];

  it.each(tiles)('tile %s navigates to its tool route', (testID, route) => {
    renderWithProviders(<CompassScreen />);
    fireEvent.press(screen.getByTestId(testID));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(route);
  });
});
