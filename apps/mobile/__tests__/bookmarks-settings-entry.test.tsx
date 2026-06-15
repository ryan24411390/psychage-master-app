import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import SettingsHubScreen from '@/app/settings/index';
import { renderWithProviders } from './_helpers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('Settings "Saved" entry (T-010)', () => {
  it('routes to /saved when tapped', () => {
    renderWithProviders(<SettingsHubScreen />, { haptics: true });
    fireEvent.press(screen.getByTestId('settings-row-saved'));
    expect(router.push as unknown as jest.Mock).toHaveBeenCalledWith('/saved');
  });
});
