import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { fireEvent, screen } from '@testing-library/react-native';

import { AppTabBar } from '@/components/AppTabBar';

import { renderWithProviders } from './_helpers';

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
): BottomTabBarProps {
  const descriptors = Object.fromEntries(
    ROUTES.map((route, i) => [route.key, { options: { title: TITLES[i] } }]),
  );
  return {
    state: { key: 'tabs-1', index: activeIndex, routes: ROUTES },
    descriptors,
    navigation: {
      emit: () => ({ defaultPrevented: false }),
      navigate,
      dispatch,
    },
  } as unknown as BottomTabBarProps;
}

describe('AppTabBar', () => {
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

  it('pops the focused tab stack to root (not navigate) when the active tab is re-pressed', () => {
    const navigate = jest.fn();
    const dispatch = jest.fn();
    // Learn (index 1) is the active tab; pressing it again should reset its stack.
    renderWithProviders(<AppTabBar {...makeProps(1, navigate, dispatch)} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Learn'));
    expect(navigate).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ type: 'POP_TO_TOP' }));
  });
});
