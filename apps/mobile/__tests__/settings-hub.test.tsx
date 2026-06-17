import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import SettingsHubScreen from '@/app/settings/index';
import { AuthProvider, createStubAuthService } from '@/features/auth';

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
    expect(screen.getByTestId('settings-row-therapist-share')).toBeTruthy();
    expect(screen.getByTestId('settings-row-supporter')).toBeTruthy();
    expect(screen.getByTestId('settings-row-crisis')).toBeTruthy();
    expect(screen.getByTestId('settings-row-account-status')).toBeTruthy();
    // Signed-out default (no AuthProvider) → the auth row is Sign in, not Sign out.
    // Mutual exclusivity across both states is pinned in pr110-settings-auth-parity.test.tsx.
    expect(screen.getByTestId('settings-row-sign-in')).toBeTruthy();
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
    // Therapist-share enters at /add-provider (the live flow start), NOT '/why'
    // which collides with the auth S33 route.
    fireEvent.press(screen.getByTestId('settings-row-therapist-share'));
    expect(pushMock).toHaveBeenCalledWith('/add-provider');
  });

  it('crisis is always reachable (SR-2) — routes to /crisis', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-crisis'));
    expect(pushMock).toHaveBeenCalledWith('/crisis');
  });

  it('sign-out routes to the wired S37 confirm sheet', async () => {
    // Sign-out only renders when signed in — seed a session via the stub service
    // and mount the provider so the ternary flips before we press.
    const service = createStubAuthService();
    await service.signIn('person@example.com', 'a-good-password');
    renderWithProviders(
      <AuthProvider service={service}>
        <SettingsHubScreen />
      </AuthProvider>,
    );
    fireEvent.press(await screen.findByTestId('settings-row-sign-out'));
    expect(pushMock).toHaveBeenCalledWith('/sign-out');
  });

  it('delete-account routes to the hard-immediate delete flow', () => {
    renderWithProviders(<SettingsHubScreen />);
    fireEvent.press(screen.getByTestId('settings-row-delete-account'));
    expect(pushMock).toHaveBeenCalledWith('/settings/delete');
  });
});
