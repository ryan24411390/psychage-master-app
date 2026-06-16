import { Stack } from 'expo-router';

import { GlobalHeader } from '@/components/GlobalHeader';
import { useReducedMotion } from '@/lib/motion';

// Compass tab stack. Landing is the named `compass` route. The full-screen tools
// kept in-tab per the redesign (sleep, mindmate, relationship-health, mood-journal,
// med-tracker) and toolkits are nested here so the bar persists in them. The
// assessment-in-progress flows that must stay full-screen (Clarity, Navigator,
// Toolkit exercise) deliberately remain at the router root — outside this stack.
// GlobalHeader on the landing only.
export const unstable_settings = { initialRouteName: 'compass' };

export default function CompassStackLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'fade' : 'slide_from_right',
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="compass"
        options={{ headerShown: true, header: () => <GlobalHeader /> }}
      />
    </Stack>
  );
}
