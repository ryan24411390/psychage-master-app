import { Stack } from 'expo-router';
import '../global.css';

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
