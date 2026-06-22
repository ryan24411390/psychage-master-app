import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: () => undefined,
}));

import CompassScreen from '@/app/(tabs)/(compass)/compass';
import { COMPASS_ROUTES } from '@/features/compass/routes';
import { MOMENTS_COPY } from '@/features/moments/copy';

import { renderWithProviders } from './_helpers';

describe('Compass bento landing', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  // Tool tiles are single accessible pressables that route to their tool. (Moments is
  // not here — it opens the shared capture sheet in place rather than navigating.)
  const tiles: ReadonlyArray<[testID: string, route: string]> = [
    ['compass-tile-toolkit', COMPASS_ROUTES.toolkit],
    ['compass-tile-navigator', COMPASS_ROUTES.navigator],
    ['compass-tile-mindmate', COMPASS_ROUTES.mindmate],
    ['compass-tile-clarity', COMPASS_ROUTES.clarity],
    ['compass-tile-relationship', COMPASS_ROUTES.relationship],
    ['compass-tile-sleep', COMPASS_ROUTES.sleep],
    ['compass-tile-insights', COMPASS_ROUTES.insights],
  ];

  it.each(tiles)('tile %s navigates to its tool route', (testID, route) => {
    renderWithProviders(<CompassScreen />);
    fireEvent.press(screen.getByTestId(testID));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(route);
  });

  it('Moments tile opens the shared capture sheet (no navigation)', () => {
    renderWithProviders(<CompassScreen />);
    expect(screen.queryByText(MOMENTS_COPY.title)).toBeNull();
    fireEvent.press(screen.getByTestId('compass-tile-moments'));
    expect(screen.getByText(MOMENTS_COPY.title)).toBeTruthy();
    expect(router.push as jest.Mock).not.toHaveBeenCalled();
  });
});
