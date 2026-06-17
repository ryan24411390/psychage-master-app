import { router, Stack } from 'expo-router';

import { EarlierReflectionsView } from '@/features/reflection/EarlierReflectionsView';
import { buildEarlierWeeks } from '@/features/reflection/week';
import { dailyRollupReader } from '@/lib/daily-rollup';
import { getMomentStore } from '@/lib/moment-store';

// S10 route. The "Earlier weeks" list, computed on-device. Reachable from S9.

export default function ReflectionEarlierScreen() {
  const weeks = buildEarlierWeeks(dailyRollupReader(getMomentStore()), new Date());

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <EarlierReflectionsView weeks={weeks} onBack={() => router.back()} />
    </>
  );
}
