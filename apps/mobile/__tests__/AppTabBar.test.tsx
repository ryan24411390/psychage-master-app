import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { fireEvent, screen } from '@testing-library/react-native';

import { AppTabBar } from '@/components/AppTabBar';

import { renderWithProviders } from './_helpers';

// C0.2 — the custom tab bar. Builds a minimal BottomTabBarProps fixture (the
// shape react-navigation hands a custom `tabBar`) and asserts: four tabs, labels
// ALWAYS visible, the active tab carries selected semantics, and pressing an
// inactive tab navigates.
const ROUTES = [
  { key: 'index-1', name: 'index' },
  { key: 'learn-1', name: 'learn' },
  { key: 'compass-1', name: 'compass' },
  { key: 'find-1', name: 'find' },
];
const TITLES = ['Today', 'Learn', 'Compass', 'Find'];

function makeProps(activeIndex: number, navigate: (name: string) => void): BottomTabBarProps {
  const descriptors = Object.fromEntries(
    ROUTES.map((route, i) => [route.key, { options: { title: TITLES[i] } }]),
  );
  return {
    state: { index: activeIndex, routes: ROUTES },
    descriptors,
    navigation: {
      emit: () => ({ defaultPrevented: false }),
      navigate,
    },
  } as unknown as BottomTabBarProps;
}

describe('AppTabBar', () => {
  it('renders four tabs with always-visible labels', () => {
    renderWithProviders(<AppTabBar {...makeProps(0, () => {})} />, { haptics: true });
    for (const title of TITLES) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    expect(screen.getAllByRole('tab')).toHaveLength(4);
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
    expect(navigate).toHaveBeenCalledWith('learn');
  });
});
