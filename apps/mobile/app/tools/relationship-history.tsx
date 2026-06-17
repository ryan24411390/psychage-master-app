import { router, Stack } from 'expo-router';

import { RelationshipFlow } from '@/features/relationship-health/RelationshipFlow';
import { getRelationshipStore } from '@/lib/relationship-store';
import { goBackOr } from '@/lib/nav';

// Relationship Health history — opens the existing flow straight to its history
// view (past results list → tap to view a result). Reuses RelationshipFlow rather
// than duplicating the list/result UI. Full-screen; the flow's own chrome carries
// the Help-now pill (SR-2). LOCAL-ONLY (SR-4): reads only the on-device store.
export default function RelationshipHistoryRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <RelationshipFlow
        store={getRelationshipStore()}
        initialView="history"
        onExit={() => goBackOr('/compass')}
        onCrisis={() => router.push('/crisis')}
      />
    </>
  );
}
