// Shared render helpers. Leading underscore + no `.test.` segment keeps this out
// of both runners' globs (jest: *.test.tsx, vitest: *.test.ts).
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react-native';
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
