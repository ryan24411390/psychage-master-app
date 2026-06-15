import { render, screen } from '@testing-library/react-native';

import { AppLoader } from '@/components/ui/AppLoader';
import { useReducedMotion } from '@/lib/motion';

// Reduced-motion is the only branch we drive; everything else (theme colors,
// nativewind scheme) resolves to its light default under the runner.
jest.mock('@/lib/motion', () => ({ useReducedMotion: jest.fn(() => false) }));

const mockReducedMotion = useReducedMotion as jest.Mock;

beforeEach(() => {
  mockReducedMotion.mockReturnValue(false);
});

describe('AppLoader', () => {
  it('exposes an accessible, busy progressbar with a default label', () => {
    render(<AppLoader testID="loader" />);
    const node = screen.getByTestId('loader');
    expect(node).toBeOnTheScreen();
    expect(node.props.accessibilityRole).toBe('progressbar');
    expect(node.props.accessibilityLabel).toBe('Loading');
    expect(node.props.accessibilityState).toEqual({ busy: true });
  });

  it('honors a custom accessibility label', () => {
    render(<AppLoader testID="loader" label="Loading providers" />);
    expect(screen.getByTestId('loader').props.accessibilityLabel).toBe('Loading providers');
  });

  it('autoplays and loops by default', () => {
    render(<AppLoader />);
    const lottie = screen.getByTestId('app-loader-lottie');
    expect(lottie.props.autoPlay).toBe(true);
    expect(lottie.props.loop).toBe(true);
    expect(lottie.props.progress).toBeUndefined();
  });

  it('plays once when loop is false', () => {
    render(<AppLoader loop={false} />);
    const lottie = screen.getByTestId('app-loader-lottie');
    expect(lottie.props.autoPlay).toBe(true);
    expect(lottie.props.loop).toBe(false);
  });

  it('holds a static frame under reduced motion', () => {
    mockReducedMotion.mockReturnValue(true);
    render(<AppLoader />);
    const lottie = screen.getByTestId('app-loader-lottie');
    expect(lottie.props.autoPlay).toBe(false);
    expect(lottie.props.loop).toBe(false);
    expect(lottie.props.progress).toBe(0.5);
  });

  it('recolors both named layers via colorFilters', () => {
    render(<AppLoader />);
    const { colorFilters } = screen.getByTestId('app-loader-lottie').props;
    const keypaths = colorFilters.map((f: { keypath: string }) => f.keypath);
    expect(keypaths).toEqual(['Teal_Dot', 'Black_Dots_Group']);
    for (const f of colorFilters as Array<{ color: string }>) {
      expect(typeof f.color).toBe('string');
      expect(f.color).toMatch(/^#/);
    }
  });

  it('renders fullscreen and inline without crashing', () => {
    const { rerender } = render(<AppLoader testID="loader" fullscreen />);
    expect(screen.getByTestId('loader')).toBeOnTheScreen();
    rerender(<AppLoader testID="loader" size="lg" />);
    expect(screen.getByTestId('loader')).toBeOnTheScreen();
  });
});
