// Shared render helpers. Leading underscore + no `.test.` segment keeps this out
// of both runners' globs (jest: *.test.tsx, vitest: *.test.ts).
import type { ReactElement, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HapticProvider } from '@/lib/haptic-context';

// Static safe-area metrics — lets the real SafeAreaProvider resolve insets
// synchronously without native measurement (the documented RN test path).
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// A no-retry client so failing queryFns settle immediately under the runner.
function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { haptics = false, query = false }: { haptics?: boolean; query?: boolean } = {},
) {
  let tree: ReactNode = ui;
  if (haptics) tree = <HapticProvider>{tree}</HapticProvider>;
  if (query) tree = <QueryClientProvider client={makeTestQueryClient()}>{tree}</QueryClientProvider>;
  return render(<SafeAreaProvider initialMetrics={INITIAL_METRICS}>{tree}</SafeAreaProvider>);
}

// Drive the Moments FeelingVisualization to an exact valence. It is a pure-scrub
// `adjustable` control (no discrete dots) — under the test renderer there is no
// layout width to scrub, so selection goes through the VoiceOver increment/
// decrement actions. From an unset value the control's neutral base is 3.
export function selectMomentValence(target: 1 | 2 | 3 | 4 | 5) {
  const control = screen.getByRole('adjustable');
  const step = (name: 'increment' | 'decrement') =>
    fireEvent(control, 'accessibilityAction', { nativeEvent: { actionName: name } });
  if (target === 3) {
    step('increment');
    step('decrement');
    return;
  }
  const direction = target < 3 ? 'decrement' : 'increment';
  for (let i = 0; i < Math.abs(target - 3); i++) step(direction);
}
