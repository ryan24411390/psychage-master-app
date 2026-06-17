import { router, Stack } from 'expo-router';

import { ClarityChrome } from '@/features/clarity/components/ClarityChrome';
import { ClarityHistoryView } from '@/features/clarity/ClarityHistoryView';
import { getClarityStore } from '@/lib/clarity-store';
import { goBackOr } from '@/lib/nav';

// Clarity Score history — past snapshots (newest first), text-only, no raw numbers.
// Read straight from the local store. Carries the Help-now pill via ClarityChrome so
// crisis stays one tap away here too (SR-2).
export default function ClarityHistoryRoute() {
  const snapshots = getClarityStore().getRecent(30);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ClarityChrome onHelp={() => router.push('/crisis')} onBack={() => goBackOr('/compass')}>
        <ClarityHistoryView snapshots={snapshots} onStartNew={() => router.replace('/tools/clarity')} />
      </ClarityChrome>
    </>
  );
}
