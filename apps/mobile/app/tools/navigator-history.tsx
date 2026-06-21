import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { ToolScreen } from '@/components/ui/ToolScreen';
import { NavigatorHistoryDetail } from '@/features/navigator/components/NavigatorHistoryDetail';
import { NavigatorHistoryView } from '@/features/navigator/components/NavigatorHistoryView';
import { getNavigatorStore } from '@/lib/navigator-store';
import { goBackOr } from '@/lib/nav';

// Past Symptom Navigator explorations. Reads the local-only history store (SR-4) and
// toggles list ↔ read-only detail in local state. GlobalHeader keeps the crisis
// Help-now pill one tap away (SR-2). "Start new" replaces into the live flow.
export default function NavigatorHistoryRoute() {
  const snapshots = getNavigatorStore().getRecent(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? snapshots.find((s) => s.id === selectedId) : undefined;

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ToolScreen
        scroll="none"
        onBack={selected ? () => setSelectedId(null) : () => goBackOr('/compass')}
      >
        {selected ? (
          <NavigatorHistoryDetail snapshot={selected} />
        ) : (
          <NavigatorHistoryView
            snapshots={snapshots}
            onSelect={setSelectedId}
            onStartNew={() => router.replace('/navigator')}
          />
        )}
      </ToolScreen>
    </>
  );
}
