import { router, Stack } from 'expo-router';

import { OrientView } from '@/features/onboarding/OrientView';
import { useReducedMotion } from '@/lib/motion';

// S6 route — orient reinforcement (the close). Continue → S7 (founder). This is a pass-
// through beat: it does NOT mark onboarding seen. On the happy path the mark fires once, at
// the founder screen (S7), and nowhere earlier — so a person who reaches here has not yet
// "completed" onboarding. (The earlier escape hatches — S2 look-around, S3 dismiss, S3
// acute → crisis — still mark seen because they bypass this close entirely.)

export default function OrientScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <OrientView reduced={reduced} onContinue={() => router.replace('/onboarding/founder')} />
    </>
  );
}
