import { router, Stack } from 'expo-router';

import { OnboardingMomentCapture } from '@/features/onboarding/OnboardingMomentCapture';
import { storage } from '@/lib/adapters/storage';
import { getMomentStore } from '@/lib/moment-store';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S3 route — the first Moment capture. getMomentStore() imports the shared package at
// runtime (off the Jest path; the container takes the store as a prop so render tests
// inject a double). A non-acute save advances to S4; dismissing exits to the first-run
// home. Both terminal exits mark onboarding seen so the home index won't redirect back.

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
        onNamed={() => {
          markOnboardingSeen(storage);
          router.replace('/onboarding/acknowledge');
        }}
        onExit={exit}
        navigateToCrisis={() => {
          // Acute (SR-2): mark seen so the crisis route is never re-walled by onboarding,
          // then route INTO the ungated crisis surface (the Moment was already persisted).
          markOnboardingSeen(storage);
          router.replace('/crisis');
        }}
      />
    </>
  );
}
