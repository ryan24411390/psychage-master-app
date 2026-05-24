import { Stack } from 'expo-router';
import '../global.css';

// Side-effect import: runs the SR-13 versioned migrator at launch so any
// `isTierEnabled` read (transitively via featureFlags) sees a stamped v1
// TierFlags envelope. Transitively imported via `@/lib/haptic-context` →
// `@/lib/haptics` chain anyway; restated here for explicit ordering.
import '@/lib/persistence/tier-flags';

import { HapticProvider } from '@/lib/haptic-context';

export default function RootLayout() {
  return (
    <HapticProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </HapticProvider>
  );
}
