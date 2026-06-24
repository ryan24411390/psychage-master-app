import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { useLearnCategories } from '@/features/learn/hooks';
import { InterestPickView } from '@/features/onboarding/InterestPickView';
import { storage } from '@/lib/adapters/storage';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';
import { setInterests } from '@/lib/persistence/personalization';

// Interests route (P18) — second first-run screen, after the warm welcome. Persists the
// chosen content-category slugs (drives Learn + home recs) and marks onboarding seen, then
// lands on home. This is the new onboarding TERMINAL: mood capture is deferred out of
// first-run (P16) — the first Moment is captured later from home. Choosing is optional;
// Skip resolves with an empty selection and still completes onboarding.
//
// Categories come from useLearnCategories (→ listBrowseCategories) — the EXACT
// canonical, DB-populated taxonomy Browse renders, so the picker and Browse can never
// drift (no hardcoded list, no hardcoded count). Empty while loading/offline: the
// picker still offers Continue + Skip.
export default function InterestsScreen() {
  const { data: categories } = useLearnCategories();
  const done = (slugs: string[]) => {
    setInterests(storage, slugs);
    markOnboardingSeen(storage);
    router.replace('/');
  };
  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <InterestPickView categories={categories ?? []} onDone={done} />
    </View>
  );
}
