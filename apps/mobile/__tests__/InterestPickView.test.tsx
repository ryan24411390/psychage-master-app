import { fireEvent, screen } from '@testing-library/react-native';

import { InterestPickView } from '@/features/onboarding/InterestPickView';

import { renderWithProviders } from './_helpers';

describe('InterestPickView (P18)', () => {
  it('toggles chips and resolves Continue with the chosen category slugs', () => {
    const onDone = jest.fn();
    renderWithProviders(<InterestPickView onDone={onDone} />, { haptics: true });

    expect(screen.getByText('What would you like to explore?')).toBeTruthy();

    fireEvent.press(screen.getByTestId('interest-chip-emotional-regulation'));
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith(['emotional-regulation']);
  });

  it('Skip resolves with an empty selection (onboarding still completes)', () => {
    const onDone = jest.fn();
    renderWithProviders(<InterestPickView onDone={onDone} />, { haptics: true });

    fireEvent.press(screen.getByRole('button', { name: 'Skip for now' }));
    expect(onDone).toHaveBeenCalledWith([]);
  });
});
