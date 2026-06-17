import { router, Stack } from 'expo-router';

import { FounderView } from '@/features/onboarding/FounderView';
import { useReducedMotion } from '@/lib/motion';

// S7 route — founder / intention beat. The terminal onboarding screen: Continue just
// replaces to the first-run home WITHOUT the ?checkin seam (the Moment is already captured —
// no sheet to auto-open; the #132 tour then fires on home as before, because
// arrivingFromOnboarding stays false). Mark-seen is NOT set here — it is anchored to the
// first Moment save in S3 (moment.tsx), and every route to this screen passes through that
// save, so onboarding is already marked seen by the time the founder beat renders.

export default function FounderScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <FounderView reduced={reduced} onContinue={() => router.replace('/')} />
    </>
  );
}
