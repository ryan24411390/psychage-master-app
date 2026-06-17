import { router, Stack } from 'expo-router';

import { WelcomeView } from '@/features/onboarding/WelcomeView';
import { useReducedMotion } from '@/lib/motion';

// S1 route. First-launch entry (the home index redirects here on first run until
// onboarding is marked seen). Begin → S2 (naming). Sign in → the existing /sign-in route
// (link weight only — onboarding never walls; anonymous-first invariant).

export default function WelcomeScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <WelcomeView
        reduced={reduced}
        onBegin={() => router.push('/onboarding/naming')}
        onSignIn={() => router.push('/sign-in')}
      />
    </>
  );
}
