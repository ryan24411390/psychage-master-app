import { Stack } from 'expo-router';

import { GlobalHeader } from '@/components/GlobalHeader';
import { useReducedMotion } from '@/lib/motion';

// Learn tab stack. Landing is the named `learn` route (so /learn keeps its URL —
// only one group may own "/", and that's Today's index). The article reader,
// conditions, library and learn sub-routes are nested here so the bottom bar
// persists while reading. GlobalHeader on the landing only; detail screens own
// their chrome. No index.tsx in this group, so the initial route is set explicitly.
export const unstable_settings = { initialRouteName: 'learn' };

export default function LearnStackLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'fade' : 'slide_from_right',
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="learn" options={{ headerShown: true, header: () => <GlobalHeader /> }} />
    </Stack>
  );
}
