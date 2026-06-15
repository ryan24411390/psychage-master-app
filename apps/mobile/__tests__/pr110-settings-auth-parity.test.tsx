import { screen } from '@testing-library/react-native';

import { renderWithProviders } from './_helpers';

// PR #110 pre-merge gate B — Settings auth-state matrix.
//
// fix/auth-session-parity moved AuthProvider to the ROOT layout and made Settings
// read live session via useAuth(). The Sign-in / Sign-out rows are a single ternary
// on `session` (app/settings/index.tsx) and MUST be mutually exclusive — never both,
// never neither. auth-provider.test.tsx already pins boot-hydration (the original
// "session boots null forever" bug) and onAuthChange reactivity at the context level;
// this file pins the SCREEN-level rendering the OOM-prone suite never exercised.
//
// expo-router is mocked so SettingsHubScreen's router.push targets are inert.
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import SettingsHubScreen from '@/app/settings/index';
import { AuthProvider, createStubAuthService } from '@/features/auth';

describe('PR #110 — Settings reflects live auth state (web parity)', () => {
  it('cold boot SIGNED-OUT (no provider): shows Sign in, not Sign out', async () => {
    // No AuthProvider mounted → useAuth() returns the default context (session: null),
    // exactly the Tier-1-safe path. Settings must offer Sign in.
    renderWithProviders(<SettingsHubScreen />);

    expect(screen.getByTestId('settings-row-sign-in')).toBeTruthy();
    expect(screen.queryByTestId('settings-row-sign-out')).toBeNull();
  });

  it('cold boot SIGNED-IN (seeded token): hydrates and flips to Sign out', async () => {
    // Seed a persisted session the way secure-store carries one across a relaunch,
    // then mount the provider — its getSession() effect hydrates the session and the
    // Settings ternary flips. This is the screen-level regression guard for the
    // original bug (provider booted null → Settings stuck on "signed out").
    const service = createStubAuthService();
    await service.signIn('person@example.com', 'a-good-password');

    renderWithProviders(
      <AuthProvider service={service}>
        <SettingsHubScreen />
      </AuthProvider>,
    );

    // Async: the flip happens after the mount effect resolves getSession().
    expect(await screen.findByTestId('settings-row-sign-out')).toBeTruthy();
    expect(screen.queryByTestId('settings-row-sign-in')).toBeNull();
  });

  it('mutual exclusivity: exactly one of Sign in / Sign out renders (signed-out)', () => {
    renderWithProviders(<SettingsHubScreen />);

    const signIn = screen.queryByTestId('settings-row-sign-in');
    const signOut = screen.queryByTestId('settings-row-sign-out');
    expect([signIn, signOut].filter(Boolean)).toHaveLength(1);
  });

  it('mutual exclusivity: exactly one of Sign in / Sign out renders (signed-in)', async () => {
    const service = createStubAuthService();
    await service.signIn('person@example.com', 'a-good-password');

    renderWithProviders(
      <AuthProvider service={service}>
        <SettingsHubScreen />
      </AuthProvider>,
    );
    await screen.findByTestId('settings-row-sign-out');

    const signIn = screen.queryByTestId('settings-row-sign-in');
    const signOut = screen.queryByTestId('settings-row-sign-out');
    expect([signIn, signOut].filter(Boolean)).toHaveLength(1);
  });

  it('crisis row stays reachable regardless of auth state (SR-2)', () => {
    // Tier-1 / crisis affordance must never gate on session.
    renderWithProviders(<SettingsHubScreen />);
    expect(screen.getByTestId('settings-row-crisis')).toBeTruthy();
  });
});
