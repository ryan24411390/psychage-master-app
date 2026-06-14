import { router, Stack } from 'expo-router';

import { WelcomeView } from '@/features/onboarding/WelcomeView';
import { useReducedMotion } from '@/lib/motion';

// S1 route. First-launch entry (the home index redirects here on first run until
// onboarding is marked seen). Continue → S2.

export default function WelcomeScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <WelcomeView reduced={reduced} onContinue={() => router.push('/onboarding/record')} />
    </>
  );
}
