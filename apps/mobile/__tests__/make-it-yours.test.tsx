import { fireEvent, screen } from '@testing-library/react-native';

import { CT4_SETTINGS } from '@/features/settings/copy';
import { storage } from '@/lib/adapters/storage';
import {
  loadPersonalization,
  savePersonalization,
  STORAGE_KEY,
} from '@/lib/persistence/personalization';

import { renderWithProviders } from './_helpers';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/features/auth', () => ({ useAuth: jest.fn() }));

import { useAuth } from '@/features/auth';
import MakeItYoursScreen from '@/app/settings/make-it-yours';

const mockUseAuth = useAuth as unknown as jest.Mock;
const t = CT4_SETTINGS.makeItYours;

beforeEach(() => {
  jest.clearAllMocks();
  storage.remove(STORAGE_KEY);
});

describe('MakeItYoursScreen — verified-method name (P63)', () => {
  it('shows the verified-method name read-only with the account caption', () => {
    mockUseAuth.mockReturnValue({ session: { email: 'a@b.co', verified: true, name: 'Mara Vane' } });
    renderWithProviders(<MakeItYoursScreen />, { haptics: true });

    expect(screen.getByTestId('personalization-name').props.children).toBe('Mara Vane');
    expect(screen.getByText(t.nameFromAccount)).toBeTruthy();
  });

  it('shows the sign-in hint (no name) when anonymous', () => {
    mockUseAuth.mockReturnValue({ session: null });
    renderWithProviders(<MakeItYoursScreen />, { haptics: true });

    expect(screen.getByTestId('personalization-name').props.children).toBe(t.nameSignInHint);
    expect(screen.queryByText(t.nameFromAccount)).toBeNull();
  });

  it('saving preserves the synced name AND the onboarding interests (A-flag)', () => {
    savePersonalization(storage, { name: 'Mara', homeLead: 'check-in', interests: ['sleep-body-connection'] });
    mockUseAuth.mockReturnValue({ session: { email: 'a@b.co', verified: true, name: 'Mara' } });
    renderWithProviders(<MakeItYoursScreen />, { haptics: true });

    fireEvent.press(screen.getByTestId('personalization-save'));

    const loaded = loadPersonalization(storage);
    expect(loaded.name).toBe('Mara');
    expect(loaded.interests).toEqual(['sleep-body-connection']);
  });
});
