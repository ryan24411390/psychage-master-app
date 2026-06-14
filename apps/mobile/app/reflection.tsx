import { router, Stack } from 'expo-router';

import { ReflectionView } from '@/features/reflection/ReflectionView';
import { buildPriorWeekReflection } from '@/features/reflection/week';
import { getCheckInStore } from '@/lib/check-in-store';
import { useReducedMotion } from '@/lib/motion';

// S9 route. Computed ON-DEVICE from the local RecordStore (offline-complete). Reached
// from S3's reflection-ready row. "See the full record" → History (S7) is NOT built yet
// (a separate concern) — rendered as a flagged inert link.

export default function ReflectionScreen() {
  const reduced = useReducedMotion();
  const week = buildPriorWeekReflection(getCheckInStore(), new Date());

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ReflectionView
        week={week}
        reduced={reduced}
        onBack={() => router.back()}
        onEarlier={() => router.push('/reflection-earlier')}
        // TODO(S7): History screen is not built (out of this wave's scope). Flagged stub.
        onFullRecord={() => {}}
      />
    </>
  );
}
