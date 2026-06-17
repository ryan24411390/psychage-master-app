import { router, Stack } from 'expo-router';

import { NamingView } from '@/features/onboarding/NamingView';
import { storage } from '@/lib/adapters/storage';
import { useReducedMotion } from '@/lib/motion';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S2 route — "what naming does". Name → S3 (the first Moment capture). Look around first
// is a terminal exit: it marks onboarding seen (so the home index won't redirect back
// here) and replaces to the first-run home.

export default function NamingScreen() {
  const reduced = useReducedMotion();
  const lookAround = () => {
    markOnboardingSeen(storage);
    router.replace('/');
  };
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <NamingView
        reduced={reduced}
        onName={() => router.push('/onboarding/moment')}
        onLookAround={lookAround}
      />
    </>
  );
}
