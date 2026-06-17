import { router, Stack } from 'expo-router';

import { ReflectionView } from '@/features/reflection/ReflectionView';
import { buildPriorWeekReflection } from '@/features/reflection/week';
import { dailyRollupReader } from '@/lib/daily-rollup';
import { getMomentStore } from '@/lib/moment-store';
import { useReducedMotion } from '@/lib/motion';

// S9 route. Computed ON-DEVICE from the local RecordStore (offline-complete). Reached
// from S3's reflection-ready row. "See the full record" → History (S7).

export default function ReflectionScreen() {
  const reduced = useReducedMotion();
  const week = buildPriorWeekReflection(dailyRollupReader(getMomentStore()), new Date());

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ReflectionView
        week={week}
        reduced={reduced}
        onBack={() => router.back()}
        onEarlier={() => router.push('/reflection-earlier')}
        onFullRecord={() => router.push('/history')}
      />
    </>
  );
}
