import { router, Stack } from 'expo-router';

import { RelationshipFlow } from '@/features/relationship-health/RelationshipFlow';
import { useReducedMotion } from '@/lib/motion';
import { getRelationshipStore } from '@/lib/relationship-store';

// Relationship Health — native, self-contained assessment (replaces the prior
// WebView wrapper at app/tools/relationship.tsx). Full-screen flow OUTSIDE the
// tabs; its own chrome carries the Help-now pill (SR-2). The store is the
// MMKV-backed on-device singleton (SR-4); results never leave the device.
export default function RelationshipHealthScreen() {
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
      <RelationshipFlow
        store={getRelationshipStore()}
        onExit={() => router.back()}
        onCrisis={() => router.push('/crisis')}
      />
    </>
  );
}
