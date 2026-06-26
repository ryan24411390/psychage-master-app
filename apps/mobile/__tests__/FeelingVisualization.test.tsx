import { fireEvent, screen } from '@testing-library/react-native';

import { FeelingVisualization } from '@/components/moments/FeelingVisualization';
import { useReducedMotion } from '@/lib/motion';

import { renderWithProviders } from './_helpers';

// Render harness pins (Skia mocked, see __mocks__/@shopify/react-native-skia.js):
// the pure-scrub control mounts, its `adjustable` semantics emit a discrete
// MomentValence, the band label tracks the value, and the reduced-motion branch
// still renders + still selects (colour mapping kept, breathing dropped).

jest.mock('@/lib/motion', () => {
  const actual = jest.requireActual('@/lib/motion');
  return { ...actual, useReducedMotion: jest.fn(() => false) };
});

const mockedReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

function step(name: 'increment' | 'decrement') {
  fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
    nativeEvent: { actionName: name },
  });
}

describe('FeelingVisualization', () => {
  beforeEach(() => mockedReducedMotion.mockReturnValue(false));

  it('shows the prompt + the drag hint, and no band word, before a value is set', () => {
    renderWithProviders(<FeelingVisualization value={null} onChange={() => {}} />);
    expect(screen.getByText('How does right now feel?')).toBeTruthy();
    expect(screen.getByText('Drag the shape or slider to set how it feels.')).toBeTruthy();
    expect(screen.queryByText('Neutral')).toBeNull();
  });

  it('emits a snapped MomentValence via the adjustable steps (neutral base = 3)', () => {
    const onChange = jest.fn();
    renderWithProviders(<FeelingVisualization value={null} onChange={onChange} />);

    step('increment'); // 3 → 4
    expect(onChange).toHaveBeenLastCalledWith(4);

    step('decrement'); // 4 → 3
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('clamps stepping at the ends', () => {
    const onChange = jest.fn();
    renderWithProviders(<FeelingVisualization value={5} onChange={onChange} />);
    step('increment'); // already 5 → stays 5
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('renders the band word for the current value', () => {
    renderWithProviders(<FeelingVisualization value={1} onChange={() => {}} />);
    expect(screen.getByText('Very unpleasant')).toBeTruthy();
  });

  it('reduced motion: still renders and still selects (static, colour kept)', () => {
    mockedReducedMotion.mockReturnValue(true);
    const onChange = jest.fn();
    renderWithProviders(<FeelingVisualization value={4} onChange={onChange} />);

    expect(screen.getByText('Pleasant')).toBeTruthy();
    step('decrement'); // 4 → 3
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});
