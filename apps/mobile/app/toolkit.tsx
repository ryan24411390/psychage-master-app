import { router, Stack, useLocalSearchParams } from 'expo-router';

import { ExerciseFlow } from '@/features/toolkit/ExerciseFlow';
import { resolveExercise } from '@/features/toolkit/exercises';
import { useReducedMotion } from '@/lib/motion';
import { goBackOr } from '@/lib/nav';

// Toolkit route (S19–S21). Pushed full-screen, outside the tabs → chrome-minimal (no
// tab bar). Reached from the Navigator's "Something steadying now" (S18) and, in future,
// other bridge offers. `?exercise=` picks the variant (breathing | grounding |
// body_scan); defaults to breathing. Fully local, no persistence.

export default function ToolkitScreen() {
  const reduced = useReducedMotion();
  const { exercise } = useLocalSearchParams<{ exercise?: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: reduced ? 'fade' : 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <ExerciseFlow
        exercise={resolveExercise(exercise)}
        onExit={() => goBackOr('/compass')}
        onHelp={() => router.push('/crisis')}
      />
    </>
  );
}
