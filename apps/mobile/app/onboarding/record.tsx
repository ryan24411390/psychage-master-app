import { router, Stack } from 'expo-router';

import { RecordTrustView } from '@/features/onboarding/RecordTrustView';
import { storage } from '@/lib/adapters/storage';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

// S2 route. Both exits mark onboarding seen FIRST (so the home index won't redirect back
// here), then replace to the home: the primary opens S4 over the first-run home via the
// ?checkin=1 param seam; the secondary just lands on S3 first-run.

export default function RecordScreen() {
  const finish = (checkin: boolean) => {
    markOnboardingSeen(storage);
    router.replace(checkin ? { pathname: '/', params: { checkin: '1' } } : '/');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <RecordTrustView onCheckIn={() => finish(true)} onLookAround={() => finish(false)} />
    </>
  );
}
