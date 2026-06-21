import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { WelcomeView } from '@/features/onboarding/WelcomeView';
import { useReducedMotion } from '@/lib/motion';

// S1 route. First-launch entry (the home index redirects here on first run until
// onboarding is marked seen). Begin → interests (P16/P18: warm welcome leads, mood
// capture is deferred out of first-run). Sign in → the existing /sign-in route (link
// weight only — onboarding never walls; anonymous-first invariant).

export default function WelcomeScreen() {
  const reduced = useReducedMotion();
  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <WelcomeView
        reduced={reduced}
        onBegin={() => router.push('/onboarding/interests')}
        onSignIn={() => router.push('/sign-in')}
      />
    </View>
  );
}
