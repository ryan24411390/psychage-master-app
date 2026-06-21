import { router, Stack } from 'expo-router';

import { ClarityFlow } from '@/features/clarity/ClarityFlow';
import { getScoreLabel } from '@/features/clarity/scoring';
import type { ClarityHistoryItem, ClarityResult } from '@/features/clarity/types';
import { getClarityStore } from '@/lib/clarity-store';
import { useReducedMotion } from '@/lib/motion';
import { goBackOr } from '@/lib/nav';

// S32 Clarity Score — NATIVE flow (supersedes the former WebView embed of
// /m/clarity-score). The store is wired here at the route so ClarityFlow stays free
// of the store import (render tests inject a double). LOCAL-ONLY: results are saved to
// the device's MMKV-backed store and never sent anywhere (SR-4). Crisis is reachable
// on every screen via the flow's Help-now pill and the mid-flow interstitial (SR-2).
export default function ClarityRoute() {
  const reduced = useReducedMotion();
  const store = getClarityStore();

  const saveResult = (result: ClarityResult): number | null => {
    const previous = store.getRecent(1)[0]?.composite ?? null;
    store.save(result);
    return previous;
  };

  // History for the dashboard's History tab — newest first, adapted to the web's
  // ClarityHistoryItem shape (label derived from the composite).
  const getHistory = (): ClarityHistoryItem[] =>
    store.getRecent(30).map((s) => ({
      id: s.id,
      date: s.date,
      score: s.composite,
      label: getScoreLabel(s.composite).label,
      domainScores: s.domains,
    }));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: reduced ? 'fade' : 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <ClarityFlow
        onExit={() => goBackOr('/compass')}
        onCrisisResources={() => router.push('/crisis')}
        onRecommend={(route) => router.push(route as never)}
        onViewHistory={() => router.push('/tools/clarity-history')}
        saveResult={saveResult}
        getHistory={getHistory}
        hasHistory={store.count > 0}
      />
    </>
  );
}
