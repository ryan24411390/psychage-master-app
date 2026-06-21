import { router, Stack } from 'expo-router';

import { ToolScreen } from '@/components/ui/ToolScreen';
import { ClarityHistoryView } from '@/features/clarity/ClarityHistoryView';
import { getClarityStore } from '@/lib/clarity-store';
import { goBackOr } from '@/lib/nav';

// Clarity Score history — past snapshots (newest first), text-only, no raw numbers.
// Read straight from the local store. Carries the Help-now pill via ToolScreen so
// crisis stays one tap away here too (SR-2).
export default function ClarityHistoryRoute() {
  const snapshots = getClarityStore().getRecent(30);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ToolScreen scroll="none" onBack={() => goBackOr('/compass')}>
        <ClarityHistoryView snapshots={snapshots} onStartNew={() => router.replace('/tools/clarity')} />
      </ToolScreen>
    </>
  );
}
