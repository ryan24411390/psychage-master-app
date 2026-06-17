import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { OnboardingMomentCapture } from '@/features/onboarding/OnboardingMomentCapture';
import { storage } from '@/lib/adapters/storage';
import { getMomentStore } from '@/lib/moment-store';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S3 route — the first Moment capture. getMomentStore() imports the shared package at
// runtime (off the Jest path; the container takes the store as a prop so render tests
// inject a double). Mark-seen is anchored to the VALUE MOMENT: every path that leaves this
// screen marks onboarding seen, because the capture sheet persists the Moment BEFORE this
// screen branches (OnboardingMomentCapture.handleSave: append → branch). So a saved Moment
// — non-acute (onNamed → S4) or acute (navigateToCrisis → /crisis, SR-2) — always commits
// "onboarding done", and "look around first" (onExit) is an explicit opt-out. There is no
// state where a captured Moment exists but onboarding isn't marked, so a force-quit during
// the close (S4→S7) can never re-onboard. The mark is NOT deferred to the founder screen.

export default function MomentScreen() {
  const store = getMomentStore();
  const exit = () => {
    markOnboardingSeen(storage);
    router.replace('/');
  };
  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <OnboardingMomentCapture
        store={store}
        onNamed={() => {
          // First successful (non-acute) save: a Moment now exists → onboarding is done.
          markOnboardingSeen(storage);
          router.replace('/');
        }}
        onExit={exit}
        navigateToCrisis={() => {
          // Acute (SR-2): mark seen so the crisis route is never re-walled by onboarding,
          // then route INTO the ungated crisis surface (the Moment was already persisted).
          markOnboardingSeen(storage);
          router.replace('/crisis');
        }}
      />
    </View>
  );
}
