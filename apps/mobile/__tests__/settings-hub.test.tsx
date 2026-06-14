import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import SettingsHubScreen from '@/app/settings/index';

import { renderWithProviders } from './_helpers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const pushMock = router.push as unknown as jest.Mock;

describe('S42 Settings hub', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('renders the calm list of rows', () => {
    renderWithProviders(<SettingsHubScreen />);
    expect(screen.getByTestId('settings-row-reminders')).toBeTruthy();
    expect(screen.getByTestId('settings-row-appearance')).toBeTruthy();
    expect(screen.getByTestId('settings-row-privacy')).toBeTruthy();
    expect(screen.getByTestId('settings-row-supporter')).toBeTruthy();
    expect(screen.getByTestId('settings-row-sign-out')).toBeTruthy();
  });

  it('navigates to each sub-screen', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-reminders'));
    expect(pushMock).toHaveBeenCalledWith('/settings/reminders');
    fireEvent.press(screen.getByTestId('settings-row-appearance'));
    expect(pushMock).toHaveBeenCalledWith('/settings/appearance');
    fireEvent.press(screen.getByTestId('settings-row-supporter'));
    expect(pushMock).toHaveBeenCalledWith('/settings/supporter');
  });

  it('sign-out is a no-op stub (B1 owns S37) — no navigation', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-sign-out'));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
