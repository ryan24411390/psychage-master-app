// Jest render-harness setup (W2-A). RNTL's built-in matchers (toHaveStyle,
// toBeOnTheScreen, …) auto-extend on import — no jest-native needed.
//
// safe-area-context is NOT module-mocked: NativeWind's css-interop wraps the
// real SafeAreaView and reads its displayName, which a module mock clobbers.
// Tests that mount ScreenShell render inside a real SafeAreaProvider seeded
// with static initialMetrics instead (see __tests__/_helpers.tsx).

// @shopify/flash-list's ViewHolder layout pass throws under react-test-renderer,
// so the real component renders no queryable children (incl. ListEmptyComponent).
// Mock it to a plain View that maps data → renderItem, or renders the empty-state
// component when there's no data — keeps list content, including empty-state
// intros, assertable. No test renders a real FlashList.
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  const FlashList = ({ data, renderItem, ListEmptyComponent, keyExtractor, testID }) => {
    const items = data ?? [];
    let body;
    if (items.length === 0) {
      body = React.isValidElement(ListEmptyComponent)
        ? ListEmptyComponent
        : ListEmptyComponent
          ? React.createElement(ListEmptyComponent)
          : null;
    } else {
      body = items.map((item, index) =>
        React.createElement(
          React.Fragment,
          { key: keyExtractor ? keyExtractor(item, index) : index },
          renderItem({ item, index }),
        ),
      );
    }
    return React.createElement(View, { testID }, body);
  };
  return { FlashList };
});
