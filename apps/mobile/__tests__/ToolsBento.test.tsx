import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { ToolsBento } from '@/components/home/ToolsBento';
import { COMPASS_ROUTES } from '@/features/compass/routes';

import { renderWithProviders } from './_helpers';

// The "When you need something now" bento — four real tools, each pushing its real
// native flow (NOT the old /tool/[id] placeholder). The dropped 5th "Breathing" tile
// stays reachable from the steadying bridge, not here.
describe('ToolsBento (Right now bento)', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders four tiles and routes each to its real destination', () => {
    renderWithProviders(<ToolsBento />);

    fireEvent.press(screen.getByTestId('bento-tile-toolkit'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(COMPASS_ROUTES.toolkit);

    fireEvent.press(screen.getByTestId('bento-tile-navigator'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(COMPASS_ROUTES.navigator);

    fireEvent.press(screen.getByTestId('bento-tile-mindmate'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(COMPASS_ROUTES.mindmate);

    fireEvent.press(screen.getByTestId('bento-tile-clarity'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith(COMPASS_ROUTES.clarity);
  });

  it('shows the navy Clarity tile copy and stays-on-your-phone label', () => {
    renderWithProviders(<ToolsBento />);
    expect(screen.getByText('Clarity Score · stays on your phone')).toBeTruthy();
  });
});
