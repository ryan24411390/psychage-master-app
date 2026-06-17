import { fireEvent, screen } from '@testing-library/react-native';

import { FounderView } from '@/features/onboarding/FounderView';

import { renderWithProviders } from './_helpers';

// S7 — founder / intention beat (terminal onboarding screen). Help-now stays reachable; the
// copy names no feeling (valence-blind). The mark-seen wiring lives in the route file (S7
// route), not the View — see onboarding-close-routing.test.tsx.
const EMOTION = /anxious|depress|sad|happy|angry|stress|afraid|fear|calm\b|mood/i;

describe('FounderView (S7)', () => {
  it('renders the intention line, the attribution, the Help-now pill, and Continue', () => {
    const onContinue = jest.fn();
    renderWithProviders(<FounderView reduced={false} onContinue={onContinue} />, { haptics: true });

    expect(
      screen.getByText(
        'We built Psychage so making sense of how you feel is as ordinary as noticing the weather.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('— The team at Psychage')).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalled();
  });

  it('names no user emotion (valence-blind) — the intention line never branches on a feeling', () => {
    renderWithProviders(<FounderView reduced={true} onContinue={() => {}} />, { haptics: true });
    const body = screen.getByTestId('onboarding-founder-text').props.children as string;
    expect(EMOTION.test(body)).toBe(false);
  });

  it('reduced motion still renders the (still) warm mascot', () => {
    renderWithProviders(<FounderView reduced={true} onContinue={() => {}} />, { haptics: true });
    expect(
      screen.getByTestId('onboarding-founder-mascot', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
