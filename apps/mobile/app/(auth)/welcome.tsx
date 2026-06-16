import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY, useSocialSignIn } from '@/features/auth';
import { storage } from '@/lib/adapters/storage';
import { markWelcomeSeen } from '@/lib/persistence/onboarding';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S0 — Front-door Welcome gate (Amendment 2026-06-16 / Q1). Brand hero + three paths:
// "Create an account" (sign up), "Log in", and — the anonymous-first invariant —
// "Explore without an account" (Continue), which enters the app with full Tier-1 access.
// Engaging ANY path marks the gate seen, so a later sign-out lands in the app, never
// re-walls the user. Crisis is never reached through this gate; it stays globally
// reachable (Sacred Rule #3).
export default function WelcomeScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { onProvider, socialError, socialBusy } = useSocialSignIn();

  const seen = () => markWelcomeSeen(storage);
  const onContinue = () => {
    seen();
    router.replace('/onboarding/welcome');
  };
  const onSignUp = () => {
    seen();
    router.push('/sign-up');
  };
  const onLogIn = () => {
    seen();
    router.push('/sign-in');
  };
  const handleProvider = (provider: Parameters<typeof onProvider>[0]) => {
    seen();
    void onProvider(provider);
  };

  return (
    <ScreenShell>
      <View className="flex-1 justify-between py-8">
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.calm).easing(easingFn('out'))}
          className="flex-1 items-center justify-center gap-4"
        >
          <View className="h-2 w-12 rounded-full bg-primary dark:bg-primary-dark" />
          <Text variant="h1" className="text-center">
            {AUTH_COPY.welcomeTitle}
          </Text>
          <Text
            variant="body"
            className="max-w-xs text-center text-text-secondary dark:text-text-secondary-dark"
          >
            {AUTH_COPY.welcomeTagline}
          </Text>
        </Animated.View>

        <Animated.View
          entering={
            reduced ? undefined : FadeInDown.duration(DURATION.base).easing(easingFn('out'))
          }
          className="gap-3"
        >
          {socialError ? (
            <Text variant="bodySmall" className="text-center text-error dark:text-error-dark">
              {socialError}
            </Text>
          ) : null}
          <Button variant="primary" disabled={socialBusy} onPress={onSignUp}>
            {AUTH_COPY.welcomeSignUp}
          </Button>
          <Button variant="secondary" disabled={socialBusy} onPress={onLogIn}>
            {AUTH_COPY.welcomeLogin}
          </Button>

          <SocialAuthButtons onProvider={handleProvider} disabled={socialBusy} />

          <Button variant="ghost" disabled={socialBusy} onPress={onContinue}>
            {AUTH_COPY.welcomeContinue}
          </Button>
        </Animated.View>
      </View>
    </ScreenShell>
  );
}
