import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AuthProvider, createStubAuthService, useAuth } from '@/features/auth';

import { renderWithProviders } from './_helpers';

// The fix for the web↔mobile auth-parity bug: before this, AuthProvider booted
// session:null forever and was mounted only inside the (auth) group, so the rest of
// the app (Settings) always read "signed out" even with a valid persisted token.
// These tests pin the two behaviours web's AuthContext has and mobile lacked:
//   1) boot hydration from the persisted session (getSession on mount)
//   2) runtime reactivity to sign-in / sign-out (onAuthChange subscription)

function Probe() {
  const { session } = useAuth();
  return <Text>{session ? session.email : 'NO-SESSION'}</Text>;
}

describe('AuthProvider — boot hydration + reactivity (web parity)', () => {
  it('hydrates the context from a persisted session on mount', async () => {
    const service = createStubAuthService();
    // Seed a persisted session the way secure-store would carry one across a relaunch.
    await service.signIn('person@example.com', 'a-good-password');

    renderWithProviders(
      <AuthProvider service={service}>
        <Probe />
      </AuthProvider>,
    );

    // The mount effect calls service.getSession() → context reflects the restored
    // session instead of falsely showing signed-out.
    expect(await screen.findByText('person@example.com')).toBeTruthy();
  });

  it('reacts to sign-in and sign-out emitted after mount', async () => {
    const service = createStubAuthService();

    renderWithProviders(
      <AuthProvider service={service}>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('NO-SESSION')).toBeTruthy();

    // External sign-in propagates through the onAuthChange subscription.
    await act(async () => {
      await service.signIn('person@example.com', 'a-good-password');
    });
    expect(await screen.findByText('person@example.com')).toBeTruthy();

    // External sign-out clears it (token refresh failure / sign-out from anywhere).
    await act(async () => {
      await service.signOut();
    });
    expect(await screen.findByText('NO-SESSION')).toBeTruthy();
  });

  it('with no provider mounted, useAuth() still returns null (Tier-1 safety)', async () => {
    // rules/auth.md §5/§10: Tier-1 features read useAuth() with NO provider and must
    // get session:null, never a throw. The default context value guarantees this.
    renderWithProviders(<Probe />);

    expect(await screen.findByText('NO-SESSION')).toBeTruthy();
  });
});
