import { fireEvent, screen } from '@testing-library/react-native';

import { OrientView } from '@/features/onboarding/OrientView';

import { renderWithProviders } from './_helpers';

// S6 — orient reinforcement (the close). Restates the event-initiated model. Help-now must
// stay reachable; the copy must name no feeling (valence-blind).
const EMOTION = /anxious|depress|sad|happy|angry|stress|afraid|fear|calm\b|mood/i;

describe('OrientView (S6)', () => {
  it('renders the orient title + body, the Help-now pill, and the single Continue action', () => {
    const onContinue = jest.fn();
    renderWithProviders(<OrientView reduced={false} onContinue={onContinue} />, { haptics: true });

    expect(screen.getByText('Your space is ready.')).toBeTruthy();
    expect(
      screen.getByText('Notice a moment whenever you want — no schedule, no pressure.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy(); // crisis reachable on every onboarding screen

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalled();
  });

  it('names no user emotion (valence-blind) — the body never branches on a feeling', () => {
    renderWithProviders(<OrientView reduced={true} onContinue={() => {}} />, { haptics: true });
    const title = screen.getByText('Your space is ready.').props.children as string;
    const body = screen.getByText(
      'Notice a moment whenever you want — no schedule, no pressure.',
    ).props.children as string;
    expect(EMOTION.test(title)).toBe(false);
    expect(EMOTION.test(body)).toBe(false);
  });

  it('reduced motion still renders the (still) mascot', () => {
    renderWithProviders(<OrientView reduced={true} onContinue={() => {}} />, { haptics: true });
    expect(
      screen.getByTestId('onboarding-orient-mascot', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
