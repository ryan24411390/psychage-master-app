import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';

// Side-effect import: loading featureFlags.ts executes loadTierFlags(storage)
// at module init, which runs the SR-13 migrator before any consumer reads isTierEnabled.
import '@/lib/adapters/featureFlags';

import { HapticProvider } from '@/lib/haptic-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // DD-001 typography lock: IBM Plex Sans (OFL) body/UI, Fraunces (OFL) display.
  // Each cut registers under its expo-google-fonts export name; NativeWind's
  // `font-sans` → IBMPlexSans_400Regular and `font-display` → Fraunces_600SemiBold
  // resolve via tokens/mobile.tokens.json type.family. The mono token was dropped
  // (no production use). The prior bundled brand typeface was removed per DD-001 —
  // its ITF/Fontshare EULA does not clearly cover app-binary embedding.
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_700Bold,
    Fraunces_600SemiBold,
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
