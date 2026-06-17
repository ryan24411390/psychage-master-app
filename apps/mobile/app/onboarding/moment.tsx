import { router, Stack } from 'expo-router';

import { OnboardingMomentCapture } from '@/features/onboarding/OnboardingMomentCapture';
import { storage } from '@/lib/adapters/storage';
import { getMomentStore } from '@/lib/moment-store';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S3 route — the first Moment capture. getMomentStore() imports the shared package at
// runtime (off the Jest path; the container takes the store as a prop so render tests
// inject a double). A save ADVANCES into the close (S4 acknowledge → S6 orient → S7 founder)
// WITHOUT marking onboarding seen — the happy path commits "onboarding done" once, at the
// founder screen (S7). Dismissing (onExit) is the terminal escape hatch that DOES mark
// seen, so the home index won't redirect a person who left early back into onboarding.
// (No acute auto-route: the SR-2 crisis pill in the header is the safety floor.)

export default function MomentScreen() {
  const store = getMomentStore();
  const exit = () => {
    markOnboardingSeen(storage);
    router.replace('/');
  };
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <OnboardingMomentCapture
        store={store}
        onNamed={() => router.replace('/onboarding/acknowledge')}
        onExit={exit}
      />
    </>
  );
}
