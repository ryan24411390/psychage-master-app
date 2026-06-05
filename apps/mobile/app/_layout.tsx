import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';

// Side-effect import: loading featureFlags.ts executes loadTierFlags(storage)
// at module init, which runs the SR-13 migrator before any consumer reads isTierEnabled.
import '@/lib/adapters/featureFlags';

import { HapticProvider } from '@/lib/haptic-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Satoshi cuts registered under one family name so NativeWind's `font-sans` /
  // `font-display` / `font-mono` (all → tokens/mobile.tokens.json type.family →
  // "Satoshi") resolve, and RN's `fontWeight` style selects the right cut. Mono
  // renders via the Satoshi fallback (IBM Plex Mono dropped). Italic / Light /
  // Black cuts not loaded (unused in V1).
  const [fontsLoaded] = useFonts({
    Satoshi: require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <HapticProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </HapticProvider>
  );
}
