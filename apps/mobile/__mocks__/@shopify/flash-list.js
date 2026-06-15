// Manual jest mock for @shopify/flash-list (activated via jest.mock in
// jest.setup.js). The real FlashList's ViewHolder layout pass throws under
// react-test-renderer, leaving no queryable children. This renders a plain View
// that maps data → renderItem, or renders the empty-state component when there is
// no data, so list content (including empty-state intros) is assertable in tests.
const React = require('react');
const { View } = require('react-native');

function FlashList({ data, renderItem, ListEmptyComponent, keyExtractor, testID }) {
  const items = data ?? [];
  let body;
  if (items.length === 0) {
    if (React.isValidElement(ListEmptyComponent)) {
      body = ListEmptyComponent;
    } else if (ListEmptyComponent) {
      body = React.createElement(ListEmptyComponent);
    } else {
      body = null;
    }
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
}

module.exports = { FlashList };
