import { router, Stack } from 'expo-router';

import { SleepArchitectView } from '@/features/sleep-architect/SleepArchitectView';

// S29 Sleep Architect — NATIVE. Replaces the former WebView wrapper around
// /m/sleep-architect (the 'sleep-architect' surface is retired). Pushed full-screen
// OUTSIDE the tabs → chrome-minimal (no tab bar, no GlobalHeader); the view carries
// its own crisis pill (SR-2) and back affordance. LOCAL-ONLY (SR-4).
export default function SleepRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SleepArchitectView onClose={() => router.back()} />
    </>
  );
}
