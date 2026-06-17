import { router, Stack } from 'expo-router';

import { FounderView } from '@/features/onboarding/FounderView';
import { storage } from '@/lib/adapters/storage';
import { useReducedMotion } from '@/lib/motion';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S7 route — founder / intention beat. The TERMINAL onboarding screen: Continue marks
// onboarding seen (moved here from S3/S4 — the happy path now commits "onboarding done"
// exactly once, at this screen) and replaces to the first-run home WITHOUT the ?checkin
// seam (the Moment is already captured — no sheet to auto-open; the #132 tour then fires on
// home as before, because arrivingFromOnboarding stays false).

export default function FounderScreen() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <FounderView
        reduced={reduced}
        onContinue={() => {
          markOnboardingSeen(storage);
          router.replace('/');
        }}
      />
    </>
  );
}
