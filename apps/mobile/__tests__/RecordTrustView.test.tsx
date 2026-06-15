import { fireEvent, screen } from '@testing-library/react-native';

import { RecordTrustView } from '@/features/onboarding/RecordTrustView';

import { renderWithProviders } from './_helpers';

describe('RecordTrustView (S2)', () => {
  it('renders the three verbatim trust lines and the primary + secondary actions', () => {
    const onCheckIn = jest.fn();
    const onLookAround = jest.fn();
    renderWithProviders(
      <RecordTrustView onCheckIn={onCheckIn} onLookAround={onLookAround} />,
      { haptics: true },
    );
    expect(screen.getByText('Each day, you can note how you are.')).toBeTruthy();
    expect(screen.getByText("Five plain words — that's all.")).toBeTruthy();
    expect(screen.getByText('It stays on your phone unless you say otherwise.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Do your first check-in — 30 seconds' }));
    fireEvent.press(screen.getByRole('button', { name: 'Look around first' }));
    expect(onCheckIn).toHaveBeenCalled();
    expect(onLookAround).toHaveBeenCalled();
  });
});
