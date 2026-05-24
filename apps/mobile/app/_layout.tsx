import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';

// Side-effect import: runs the SR-13 versioned migrator at launch so any
// `isTierEnabled` read (transitively via featureFlags) sees a stamped v1
// TierFlags envelope. Transitively imported via `@/lib/haptic-context` →
// `@/lib/haptics` chain anyway; restated here for explicit ordering.
import '@/lib/persistence/tier-flags';

import { HapticProvider } from '@/lib/haptic-context';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Satoshi cuts registered under one family name so NativeWind's `font-sans` /
  // `font-display` (both → tokens/mobile.tokens.json type.family → "Satoshi")
  // resolve, and RN's `fontWeight` style selects the right cut. IBM Plex Mono
  // unchanged. Italic / Light / Black cuts not loaded (unused in V1).
  const [fontsLoaded] = useFonts({
    Satoshi: require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    'IBM Plex Mono': IBMPlexMono_400Regular,
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
