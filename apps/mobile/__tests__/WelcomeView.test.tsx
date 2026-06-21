import { fireEvent, screen } from '@testing-library/react-native';

import { WelcomeView } from '@/features/onboarding/WelcomeView';

import { renderWithProviders } from './_helpers';

describe('WelcomeView (S1)', () => {
  it('renders the host mascot, title + body, the Help-now pill, Begin, and a sign-in link', () => {
    const onBegin = jest.fn();
    const onSignIn = jest.fn();
    renderWithProviders(<WelcomeView reduced={false} onBegin={onBegin} onSignIn={onSignIn} />, {
      haptics: true,
    });
    expect(
      screen.getByTestId('onboarding-host-mascot', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByText('Welcome to Psychage.')).toBeTruthy();
    expect(
      screen.getByText(/A calm place to understand what you are feeling/),
    ).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy(); // crisis reachable before anything

    fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
    expect(onBegin).toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Already have a record? Sign in' }));
    expect(onSignIn).toHaveBeenCalled();
  });

  it('reduced motion still renders the (still) host mascot', () => {
    renderWithProviders(<WelcomeView reduced={true} onBegin={() => {}} onSignIn={() => {}} />, {
      haptics: true,
    });
    expect(
      screen.getByTestId('onboarding-host-mascot', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
