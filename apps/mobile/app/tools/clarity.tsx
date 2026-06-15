import { router, Stack } from 'expo-router';

import { ClarityFlow } from '@/features/clarity/ClarityFlow';
import type { ClarityResult } from '@/features/clarity/types';
import { getClarityStore } from '@/lib/clarity-store';

// S32 Clarity Score — NATIVE flow (supersedes the former WebView embed of
// /m/clarity-score). The store is wired here at the route so ClarityFlow stays free
// of the store import (render tests inject a double). LOCAL-ONLY: results are saved to
// the device's MMKV-backed store and never sent anywhere (SR-4). Crisis is reachable
// on every screen via the flow's Help-now pill and the mid-flow interstitial (SR-2).
export default function ClarityRoute() {
  const store = getClarityStore();

  const saveResult = (result: ClarityResult): number | null => {
    // The previous snapshot's composite (for the qualitative change line) must be read
    // BEFORE the new save appends this one.
    const previous = store.getRecent(1)[0]?.composite ?? null;
    store.save(result);
    return previous;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <ClarityFlow
        onExit={() => router.back()}
        onHelp={() => router.push('/crisis')}
        onCrisisResources={() => router.push('/crisis')}
        onRecommend={(route) => router.push(route)}
        onViewHistory={() => router.push('/tools/clarity-history')}
        saveResult={saveResult}
        hasHistory={store.count > 0}
      />
    </>
  );
}
