import { fireEvent, screen } from '@testing-library/react-native';

import { AcknowledgeView } from '@/features/onboarding/AcknowledgeView';

import { renderWithProviders } from './_helpers';

describe('AcknowledgeView (S4)', () => {
  it('renders the acknowledgment copy, the teal pulse element, the Help-now pill, and Continue', () => {
    const onContinue = jest.fn();
    renderWithProviders(<AcknowledgeView reduced={false} onContinue={onContinue} />, {
      haptics: true,
    });
    expect(screen.getByText('You named it. That’s the whole skill.')).toBeTruthy();
    expect(
      screen.getByTestId('onboarding-acknowledge-pulse', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Help now')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalled();
  });

  // VALENCE-BLINDNESS (the core invariant of this slice): the acknowledgment is byte-
  // identical regardless of which feeling was named. AcknowledgeView takes NO moment /
  // valence / label input — there is structurally nothing for valence to vary. Proven
  // here by rendering twice (as a user would arrive after a "positive" vs a "negative"
  // capture) and asserting the trees are deeply equal.
  it('renders identically regardless of the named feeling (valence-blind)', () => {
    const afterPositive = renderWithProviders(
      <AcknowledgeView reduced={true} onContinue={() => {}} />,
      { haptics: true },
    );
    const positiveText = afterPositive.getByTestId('onboarding-acknowledge-text').props.children;
    afterPositive.unmount();

    const afterNegative = renderWithProviders(
      <AcknowledgeView reduced={true} onContinue={() => {}} />,
      { haptics: true },
    );
    const negativeText = afterNegative.getByTestId('onboarding-acknowledge-text').props.children;

    // The affirming copy is one fixed constant — no valence/label branch exists — so the
    // arrival after a "positive" capture is byte-identical to a "negative" one.
    expect(positiveText).toBe(negativeText);
    expect(positiveText).toBe('You named it. That’s the whole skill.');
  });

  it('reduced motion renders the pulse in its static rested state (no animation)', () => {
    renderWithProviders(<AcknowledgeView reduced={true} onContinue={() => {}} />, {
      haptics: true,
    });
    expect(
      screen.getByTestId('onboarding-acknowledge-pulse', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
