import { render, screen, fireEvent } from '@testing-library/react-native';

import { Button } from '@/components/ui/Button';
import { HapticProvider } from '@/lib/haptic-context';

function renderWithHaptics(ui: React.ReactElement) {
  return render(<HapticProvider>{ui}</HapticProvider>);
}

describe('Button', () => {
  it('renders its string label', () => {
    renderWithHaptics(<Button onPress={() => {}}>Continue</Button>);
    expect(screen.getByText('Continue')).toBeOnTheScreen();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    renderWithHaptics(<Button onPress={onPress}>Continue</Button>);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    renderWithHaptics(
      <Button onPress={onPress} disabled>
        Continue
      </Button>,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
