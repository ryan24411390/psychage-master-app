import { fireEvent, screen } from '@testing-library/react-native';
import { SignInSheet } from '@/features/bookmarks/SignInSheet';
import { renderWithProviders } from './_helpers';

describe('SignInSheet (T-005)', () => {
  it('renders content-neutral title/body and the sign-in CTA when visible', () => {
    renderWithProviders(<SignInSheet visible onClose={jest.fn()} onSignIn={jest.fn()} />, { haptics: true });
    expect(screen.getByText('Keep this for later')).toBeTruthy();
    expect(screen.getByText('Sign in to save')).toBeTruthy();
  });

  it('CTA invokes onSignIn (parent resumes the save — AC-5.3)', () => {
    const onSignIn = jest.fn();
    renderWithProviders(<SignInSheet visible onClose={jest.fn()} onSignIn={onSignIn} />, { haptics: true });
    fireEvent.press(screen.getByText('Sign in to save'));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('"Not now" and scrim both dismiss', () => {
    const onClose = jest.fn();
    renderWithProviders(<SignInSheet visible onClose={onClose} onSignIn={jest.fn()} />, { haptics: true });
    fireEvent.press(screen.getByText('Not now'));
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
