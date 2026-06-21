import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

// Route-level wiring for the sign-in screen (P14 recovery). The form body is stubbed
// so these assert ONLY the route's branching, not field validation.

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));

const mockSignIn = jest.fn();
const mockSetSession = jest.fn();
jest.mock('@/features/auth', () => ({
  AUTH_COPY: { offlineLine: 'You are offline.', credentialsLine: 'Those details did not match.' },
  useAuth: () => ({ service: { signIn: mockSignIn }, setSession: mockSetSession }),
  useSocialSignIn: () => ({ onProvider: jest.fn(), socialError: undefined, socialBusy: false }),
}));

jest.mock('@/components/auth/SignInForm', () => {
  const { Pressable, Text } = require('react-native');
  return {
    SignInForm: ({
      onSubmit,
      onSignUp,
      formError,
    }: {
      onSubmit: (e: string, p: string) => void;
      onSignUp?: () => void;
      formError?: string;
    }) => (
      <>
        <Pressable testID="submit" onPress={() => onSubmit('me@x.co', 'pw')}>
          <Text>submit</Text>
        </Pressable>
        {onSignUp ? (
          <Pressable testID="to-signup" onPress={onSignUp}>
            <Text>to-signup</Text>
          </Pressable>
        ) : null}
        {formError ? <Text>{formError}</Text> : null}
      </>
    ),
  };
});

import SignInScreen from '../app/(auth)/sign-in';

describe('SignInScreen routing (P14)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('unconfirmed account routes to /verify with the email (P14 recovery)', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'email-not-confirmed' });
    render(<SignInScreen />);

    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/verify', params: { email: 'me@x.co' } }),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('a successful sign-in replaces to the app root', async () => {
    mockSignIn.mockResolvedValue({ ok: true, session: { email: 'me@x.co', verified: true, name: null } });
    render(<SignInScreen />);

    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  it('a credential failure shows the generic line and does not navigate', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'invalid-credentials' });
    render(<SignInScreen />);

    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() => expect(screen.getByText('Those details did not match.')).toBeTruthy());
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('the sign-up link routes to /sign-up (P15)', () => {
    mockSignIn.mockResolvedValue({ ok: true, session: { email: 'me@x.co', verified: true, name: null } });
    render(<SignInScreen />);

    fireEvent.press(screen.getByTestId('to-signup'));
    expect(mockPush).toHaveBeenCalledWith('/sign-up');
  });
});
