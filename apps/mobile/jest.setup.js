// Jest render-harness setup (W2-A). RNTL's built-in matchers (toHaveStyle,
// toBeOnTheScreen, …) auto-extend on import — no jest-native needed.
//
// safe-area-context is NOT module-mocked: NativeWind's css-interop wraps the
// real SafeAreaView and reads its displayName, which a module mock clobbers.
// Tests that mount ScreenShell render inside a real SafeAreaProvider seeded
// with static initialMetrics instead (see __tests__/_helpers.tsx).

// @shopify/flash-list's ViewHolder layout pass throws under react-test-renderer,
// so the real component renders no queryable children (incl. ListEmptyComponent).
// Activate the manual mock in __mocks__/@shopify/flash-list.js — a plain View that
// maps data → renderItem (or renders the empty-state when there's no data) so list
// content, including empty-state intros, is assertable. No test renders a real
// FlashList. The mock lives in a module file (not a jest.mock factory here) to stay
// clear of babel-plugin-jest-hoist's out-of-scope-variable rule.
jest.mock('@shopify/flash-list');

// lottie-react-native's native animation view has no react-test-renderer
// implementation. The manual mock in __mocks__/lottie-react-native.js renders a
// plain View that re-exposes AppLoader's props so its animation + reduced-motion
// wiring is assertable. No test mounts a real LottieView.
jest.mock('lottie-react-native');

// @shopify/react-native-skia's Canvas mounts a native Skia view with no
// react-test-renderer implementation. The manual mock in
// __mocks__/@shopify/react-native-skia.js renders the shape nodes as plain Views
// so the FeelingVisualization wrapper (its adjustable a11y control + band label)
// stays assertable. No test mounts a real Skia Canvas.
jest.mock('@shopify/react-native-skia');


