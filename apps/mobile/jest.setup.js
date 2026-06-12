// Jest render-harness setup (W2-A). RNTL's built-in matchers (toHaveStyle,
// toBeOnTheScreen, …) auto-extend on import — no jest-native needed.
//
// safe-area-context is NOT module-mocked: NativeWind's css-interop wraps the
// real SafeAreaView and reads its displayName, which a module mock clobbers.
// Tests that mount ScreenShell render inside a real SafeAreaProvider seeded
// with static initialMetrics instead (see __tests__/_helpers.tsx).
