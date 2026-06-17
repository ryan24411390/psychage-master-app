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
    expect(screen.getByText('This is Psychage.')).toBeTruthy();
    expect(screen.getByText('Name your first feeling.')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy(); // crisis reachable before anything

    fireEvent.press(screen.getByRole('button', { name: 'I am feeling...' }));
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
