import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { fireEvent, screen } from '@testing-library/react-native';

import { AppTabBar } from '@/components/AppTabBar';
import { fireHaptic } from '@/lib/haptics';

import { renderWithProviders } from './_helpers';

// Mock the low-level dispatcher so we can assert the tab haptic without touching
// expo-haptics. HapticProvider's fire() calls this module's fireHaptic.
jest.mock('@/lib/haptics', () => ({ fireHaptic: jest.fn() }));
const mockFireHaptic = fireHaptic as unknown as jest.Mock;

// C0.2 — the custom tab bar (active-pill redesign). Builds a minimal
// BottomTabBarProps fixture (the shape react-navigation hands a custom `tabBar`)
// and asserts: four tabs (each reachable by its accessibility label), ONLY the
// focused tab shows a visible text label (inactive tabs are icon-only), the active
// tab carries selected semantics, and pressing an inactive tab navigates.
// Route names are the tab group-folder names after the nested-stack restructure.
const ROUTES = [
  { key: 'today-1', name: '(today)' },
  { key: 'learn-1', name: '(learn)' },
  { key: 'compass-1', name: '(compass)' },
  { key: 'find-1', name: '(find)' },
];
const TITLES = ['Today', 'Learn', 'Compass', 'Find'];

function makeProps(
  activeIndex: number,
  navigate: (name: string) => void,
  dispatch: (action: unknown) => void = () => {},
  // Nested stack depth for the active tab. 0 = at root (re-press is a no-op),
  // >0 = off-root (re-press pops the focused child stack to its root). The
  // active route gets a real nested navigation-state `key` so the dispatch can
  // TARGET that stack instead of bubbling up the tab navigator.
  activeStackDepth = 1,
): BottomTabBarProps {
  const descriptors = Object.fromEntries(
    ROUTES.map((route, i) => [route.key, { options: { title: TITLES[i] } }]),
  );
  const routes = ROUTES.map((route, i) =>
    i === activeIndex
      ? {
          ...route,
          state: {
            key: `${route.name}-stack`,
            index: activeStackDepth,
            routes: Array.from({ length: activeStackDepth + 1 }, (_, n) => ({
              key: `${route.name}-screen-${n}`,
            })),
          },
        }
      : route,
  );
  return {
    state: { key: 'tabs-1', index: activeIndex, routes },
    descriptors,
    navigation: {
      emit: () => ({ defaultPrevented: false }),
      navigate,
      dispatch,
    },
  } as unknown as BottomTabBarProps;
}

describe('AppTabBar', () => {
  beforeEach(() => {
    mockFireHaptic.mockClear();
  });

  it('renders four tabs, each reachable by its accessibility label', () => {
    renderWithProviders(<AppTabBar {...makeProps(0, () => {})} />, { haptics: true });
    for (const title of TITLES) {
      expect(screen.getByLabelText(title)).toBeTruthy();
    }
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('shows a visible label only on the focused tab (others are icon-only)', () => {
    renderWithProviders(<AppTabBar {...makeProps(0, () => {})} />, { haptics: true });
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.queryByText('Learn')).toBeNull();
    expect(screen.queryByText('Compass')).toBeNull();
    expect(screen.queryByText('Find')).toBeNull();
  });

  it('marks the active tab as selected', () => {
    renderWithProviders(<AppTabBar {...makeProps(0, () => {})} />, { haptics: true });
    const selected = screen.getAllByRole('tab', { selected: true });
    expect(selected).toHaveLength(1);
  });

  it('navigates when an inactive tab is pressed', () => {
    const navigate = jest.fn();
    renderWithProviders(<AppTabBar {...makeProps(0, navigate)} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Learn'));
    expect(navigate).toHaveBeenCalledWith('(learn)');
  });

  it('pops the focused tab stack to root (not navigate) when the active tab is re-pressed off-root', () => {
    const navigate = jest.fn();
    const dispatch = jest.fn();
    // Learn (index 1) is the active tab, with a 2-deep nested stack; pressing it
    // again pops that stack — dispatched at the child stack via its `target` key,
    // not bubbled up the tab navigator (which would log "POP_TO_TOP not handled").
    renderWithProviders(<AppTabBar {...makeProps(1, navigate, dispatch, 1)} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Learn'));
    expect(navigate).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ type: 'POP_TO_TOP', target: '(learn)-stack' }),
    );
  });

  it('does NOT dispatch when the active tab is re-pressed already at its stack root', () => {
    const navigate = jest.fn();
    const dispatch = jest.fn();
    // Active tab's nested stack is at root (depth 0): nothing to pop, so we skip
    // the dispatch entirely — a bare POP_TO_TOP at root is what produced the
    // "Is there any screen to go back to?" warning.
    renderWithProviders(<AppTabBar {...makeProps(1, navigate, dispatch, 0)} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Learn'));
    expect(navigate).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("fires the light 'tab' haptic on tab press (P3)", () => {
    renderWithProviders(<AppTabBar {...makeProps(0, () => {})} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Learn'));
    expect(mockFireHaptic).toHaveBeenCalledWith('tab', expect.any(Function));
  });
});
