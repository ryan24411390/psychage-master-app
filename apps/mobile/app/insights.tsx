import { router, Stack } from 'expo-router';

import { InsightsView } from '@/features/insights/InsightsView';
import { readInsightsInput } from '@/features/insights/read-stores';
import { useReducedMotion } from '@/lib/motion';
import { goBackOr } from '@/lib/nav';

// Insights — the cross-tool drill-down behind the home "Your tools" card. Reads every
// local store once at the route (render tests inject doubles into InsightsView directly)
// and renders a per-tool section, newest-used first. Full-screen over the tabs; the
// GlobalHeader keeps the crisis Help-now pill one tap away (SR-2). LOCAL-ONLY (SR-4).
export default function InsightsRoute() {
  const reduced = useReducedMotion();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: reduced ? 'fade' : 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <InsightsView
        input={readInsightsInput()}
        onBack={() => goBackOr('/')}
        onOpenTool={(route) => router.push(route as never)}
      />
    </>
  );
}
