import { fireEvent, screen } from '@testing-library/react-native';

import { WelcomeView } from '@/features/onboarding/WelcomeView';

import { renderWithProviders } from './_helpers';

describe('WelcomeView (S1)', () => {
  it('renders the host mascot, verbatim title + body, the Help-now pill, and Continue', () => {
    const onContinue = jest.fn();
    renderWithProviders(<WelcomeView reduced={false} onContinue={onContinue} />, { haptics: true });
    expect(screen.getByTestId('onboarding-host-mascot', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('This is Psychage.')).toBeTruthy();
    expect(
      screen.getByText("A private record of how you're doing — free, for everyone."),
    ).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy(); // crisis reachable before anything
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalled();
  });

  it('reduced motion still renders the (still) host mascot', () => {
    renderWithProviders(<WelcomeView reduced={true} onContinue={() => {}} />, { haptics: true });
    expect(screen.getByTestId('onboarding-host-mascot', { includeHiddenElements: true })).toBeTruthy();
  });
});
