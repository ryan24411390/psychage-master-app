import { router, Stack } from 'expo-router';

import { AcknowledgeView } from '@/features/onboarding/AcknowledgeView';
import { storage } from '@/lib/adapters/storage';
import { useReducedMotion } from '@/lib/motion';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S4 route — acknowledge the act, then enter the app. Onboarding is already marked seen by
// S3 on a successful save; this re-marks defensively (idempotent) and replaces to the
// first-run home WITHOUT the ?checkin seam (the Moment is already captured — no sheet to
// auto-open). Reaching this screen at all means a Moment was named.

export default function AcknowledgeScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <AcknowledgeView
        reduced={reduced}
        onContinue={() => {
          markOnboardingSeen(storage);
          router.replace('/');
        }}
      />
    </>
  );
}
