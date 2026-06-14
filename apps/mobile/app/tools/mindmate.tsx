import { Stack } from 'expo-router';

import { MindMateView } from '@/features/mindmate/components/MindMateView';

// S-MM MindMate route. headerShown:false — MindMateView renders its own
// GlobalHeader (so the Help-now crisis pill stays on screen throughout, SR-1).
export default function MindMateRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MindMateView />
    </>
  );
}
