import { Stack } from 'expo-router';
import { View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { MoodJournalView } from '@/features/mood-journal/MoodJournalView';
import { useReducedMotion } from '@/lib/motion';
import { getMoodJournalStore } from '@/lib/mood-journal-store';

// Mood Journal tool route — the "patterns & triggers" surface. Pushed full-screen
// OUTSIDE the tabs; renders the GlobalHeader itself so the Help-now crisis pill stays
// ≤1 tap (SR-2), mirroring app/history.tsx. Reached from the Compass tile.
//
// Fully local (SR-4): the store reads/writes on-device only, never the network. The
// store is constructed here (it imports the shared package at runtime, so it loads
// only on device / in Vitest — render tests inject a double into MoodJournalView).
export default function MoodJournalRoute() {
  const reduced = useReducedMotion();
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <Stack.Screen
        options={{
          headerShown: false,
          animation: reduced ? 'fade' : 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <GlobalHeader />
      <MoodJournalView momentStore={getMoodJournalStore()} />
    </View>
  );
}
