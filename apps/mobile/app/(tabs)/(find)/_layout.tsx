import { Stack } from 'expo-router';

import { useReducedMotion } from '@/lib/motion';

// Find tab stack. Landing is the named `find` route; directory/compare/provider
// detail are nested here so the bar persists through provider discovery. Find owns
// its own header (FindCareScreen), so no GlobalHeader is injected and every screen
// stays headerShown:false.
export const unstable_settings = { initialRouteName: 'find' };

export default function FindStackLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'fade' : 'slide_from_right',
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
