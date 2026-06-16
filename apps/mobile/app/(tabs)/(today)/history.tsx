import { Stack } from 'expo-router';
import { View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { HistoryContainer } from '@/components/history/HistoryContainer';
import { getCheckInStore } from '@/lib/check-in-store';

// S7 route — the full record (History continuum). Pushed full-screen OUTSIDE the tabs;
// renders the C0.1 GlobalHeader itself (crisis pill ≤1 tap) above the continuum. Reached
// from S3's "History" link and S9's "See the full record". Fully local: the store reads
// the on-device record (no network). The store is constructed here (it imports the shared
// package at runtime, so it's loaded only on device / Vitest — render tests inject a double
// into HistoryContainer directly).

export default function HistoryScreen() {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <GlobalHeader />
      <HistoryContainer store={getCheckInStore()} />
    </View>
  );
}
