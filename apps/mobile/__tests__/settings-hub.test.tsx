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
    expect(screen.getByTestId('settings-row-crisis')).toBeTruthy();
    expect(screen.getByTestId('settings-row-account-status')).toBeTruthy();
    expect(screen.getByTestId('settings-row-sign-out')).toBeTruthy();
    expect(screen.getByTestId('settings-row-delete-account')).toBeTruthy();
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

  it('crisis is always reachable (SR-2) — routes to /crisis', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-crisis'));
    expect(pushMock).toHaveBeenCalledWith('/crisis');
  });

  it('sign-out routes to the wired S37 confirm sheet', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-sign-out'));
    expect(pushMock).toHaveBeenCalledWith('/sign-out');
  });

  it('delete-account routes to the hard-immediate delete flow', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-delete-account'));
    expect(pushMock).toHaveBeenCalledWith('/settings/delete');
  });
});
