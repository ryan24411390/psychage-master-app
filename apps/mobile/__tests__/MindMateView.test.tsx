import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { MindMateView } from '@/features/mindmate/components/MindMateView';
import { MindMateUnavailableError } from '@/features/mindmate/errors';
import type { sendMessage } from '@/features/mindmate/mindmate-service';

import { renderWithProviders } from './_helpers';

// A sendImpl that fails as if no session exists (NO_SESSION) — drives the sign-in
// state. Throws on call; the hook's `for await` sits inside its try, so the throw
// is caught exactly like a rejected stream.
const failNoSession = (() => {
  throw new MindMateUnavailableError('Sign in to chat with MindMate.', { code: 'NO_SESSION' });
}) as unknown as typeof sendMessage;

describe('MindMateView', () => {
  it('renders the mascot-fronted intro before any message', () => {
    const noop = jest.fn() as unknown as typeof sendMessage;
    renderWithProviders(<MindMateView region="US" sendImpl={noop} />, { haptics: true });
    expect(screen.getByTestId('mindmate-intro')).toBeTruthy();
    // The mascot is decorative and accessibilityElementsHidden; RNTL excludes
    // hidden elements from queries by default, so opt in to assert it rendered.
    expect(screen.getByTestId('mindmate-mascot', { includeHiddenElements: true })).toBeTruthy();
  });

  it('SR-2: a crisis-style message routes to crisis and never calls the backend', async () => {
    const sendSpy = jest.fn() as unknown as typeof sendMessage;
    const onRequestCrisis = jest.fn();

    renderWithProviders(
      <MindMateView region="US" sendImpl={sendSpy} onRequestCrisis={onRequestCrisis} />,
      { haptics: true },
    );

    fireEvent.changeText(screen.getByTestId('mindmate-input'), 'I want to kill myself');
    fireEvent.press(screen.getByTestId('mindmate-send'));

    await waitFor(() => expect(onRequestCrisis).toHaveBeenCalled());
    expect(screen.getByTestId('mindmate-crisis-card')).toBeTruthy();
    // The crisis pre-check intercepts — the AI backend is not consulted for this turn.
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('shows the sign-in state when there is no session', async () => {
    renderWithProviders(<MindMateView region="US" sendImpl={failNoSession} onSignIn={jest.fn()} />, {
      haptics: true,
    });

    fireEvent.changeText(screen.getByTestId('mindmate-input'), 'what is anxiety');
    fireEvent.press(screen.getByTestId('mindmate-send'));

    await waitFor(() => expect(screen.getByTestId('mindmate-signin')).toBeTruthy());
  });
});
