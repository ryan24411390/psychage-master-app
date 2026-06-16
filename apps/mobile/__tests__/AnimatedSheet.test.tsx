import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { useReducedMotion } from '@/lib/motion';

// Drive only the reduced-motion branch + the dismiss wiring. The drag physics run
// on the UI thread and aren't unit-observable, so we mock gesture-handler to a
// passthrough and assert the parts that matter: content renders, and a backdrop
// tap dismisses. Under reduced motion the dismiss is synchronous (no exit spring),
// which keeps the assertion deterministic.

jest.mock('@/lib/motion', () => ({
  useReducedMotion: jest.fn(() => false),
  DURATION: { swift: 150, base: 300, calm: 600, breath: 4000 },
  REDUCED_MOTION_FADE_MS: 200,
  SPRING_PRESETS: { deep: { damping: 25, stiffness: 120, mass: 1.5 } },
}));

jest.mock('react-native-gesture-handler', () => {
  const chain: Record<string, () => unknown> = {};
  const builder = new Proxy(chain, {
    get: () => () => builder,
  });
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: { Pan: () => builder },
  };
});

const mockReducedMotion = useReducedMotion as jest.Mock;

beforeEach(() => {
  mockReducedMotion.mockReturnValue(false);
});

describe('AnimatedSheet', () => {
  it('renders its panel content', () => {
    render(
      <AnimatedSheet onDismiss={jest.fn()}>
        <Text>Sheet body</Text>
      </AnimatedSheet>,
    );
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
  });

  it('dismisses immediately on backdrop tap under reduced motion', () => {
    mockReducedMotion.mockReturnValue(true);
    const onDismiss = jest.fn();
    render(
      <AnimatedSheet onDismiss={onDismiss}>
        <Text>Sheet body</Text>
      </AnimatedSheet>,
    );
    // The backdrop is hidden from a11y by design, so opt hidden elements back in.
    fireEvent.press(screen.getByTestId('animated-sheet-backdrop', { includeHiddenElements: true }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
