import { router, Stack } from 'expo-router';

import { AcknowledgeView } from '@/features/onboarding/AcknowledgeView';
import { useReducedMotion } from '@/lib/motion';

// S4 route — acknowledge the act, then continue into the close (S6 orient → S7 founder).
// This is a pass-through beat now: it does NOT mark onboarding seen. The happy path commits
// "onboarding done" once, at the founder screen (S7), and nowhere earlier. Reaching this
// screen at all means a Moment was named.

export default function AcknowledgeScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <AcknowledgeView
        reduced={reduced}
        onContinue={() => router.replace('/onboarding/orient')}
      />
    </>
  );
}
