// Manual jest mock for lottie-react-native (activated via jest.mock in
// jest.setup.js). The real LottieView wraps a native animation view that has no
// implementation under react-test-renderer. This renders a plain View that
// re-exposes the props AppLoader passes (autoPlay / loop / progress /
// colorFilters), so the loader's animation + reduced-motion wiring is assertable.
const React = require('react');
const { View } = require('react-native');

function LottieView(props) {
  return React.createElement(View, { ...props, testID: 'app-loader-lottie' });
}

module.exports = LottieView;
module.exports.default = LottieView;
module.exports.LottieView = LottieView;
