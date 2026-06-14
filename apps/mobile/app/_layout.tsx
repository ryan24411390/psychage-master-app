import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import '../global.css';

// Side-effect import: loading featureFlags.ts executes loadTierFlags(storage)
// at module init, which runs the SR-13 migrator before any consumer reads isTierEnabled.
import '@/lib/adapters/featureFlags';

import { HapticProvider } from '@/lib/haptic-context';
import { useAppearance } from '@/lib/use-appearance';
import { resolveColorScheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

// Bridges the persisted appearance `mode` onto NativeWind's runtime color scheme.
// Effect re-runs whenever the S45 toggle changes `mode`; `colorScheme.set` is the
// imperative apply that `darkMode: 'class'` (tailwind.config.js) makes legal.
function AppearanceSync() {
  const { mode } = useAppearance();
  useEffect(() => {
    colorScheme.set(resolveColorScheme(mode));
  }, [mode]);
  return null;
}

// Status-bar glyphs must contrast the canvas: light glyphs on the dark/true-black
// canvas, dark glyphs on the light canvas. Reads NativeWind's resolved scheme so
// it tracks both manual overrides and 'system'.
function ThemedStatusBar() {
  const { colorScheme: scheme } = useColorScheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

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
      <AppearanceSync />
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </HapticProvider>
  );
}
