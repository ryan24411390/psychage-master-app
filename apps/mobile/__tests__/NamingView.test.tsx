import { fireEvent, screen } from '@testing-library/react-native';

import { NamingView } from '@/features/onboarding/NamingView';

import { renderWithProviders } from './_helpers';

describe('NamingView (S2)', () => {
  it('renders the naming body, the Help-now pill, and the primary + secondary actions', () => {
    const onName = jest.fn();
    const onLookAround = jest.fn();
    renderWithProviders(
      <NamingView reduced={false} onName={onName} onLookAround={onLookAround} />,
      { haptics: true },
    );
    expect(
      screen.getByText(
        'When you can name a feeling, it loosens its grip. Psychage gives you the words — you choose.',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy(); // crisis reachable on every onboarding screen

    fireEvent.press(screen.getByRole('button', { name: 'Name your first moment — 20 seconds' }));
    expect(onName).toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Look around first' }));
    expect(onLookAround).toHaveBeenCalled();
  });

  it('reduced motion still renders the (still) mascot', () => {
    renderWithProviders(<NamingView reduced={true} onName={() => {}} onLookAround={() => {}} />, {
      haptics: true,
    });
    expect(
      screen.getByTestId('onboarding-naming-mascot', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
