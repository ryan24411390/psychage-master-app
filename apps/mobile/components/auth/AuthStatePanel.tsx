import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Reusable centred status screen — the shared body for every terminal/transition auth
// state: verification success, session expired, generic auth error, maintenance/outage,
// reset done, reset-link expired. One layout, themed + token-driven, so all the auth
// "state" screens share the same calm design language (Phase 5). AUTH IS CALM: a mount
// fade only, no shake, no alarm colour by default.

type Action = { readonly label: string; readonly onPress: () => void; readonly busy?: boolean };

type AuthStatePanelProps = {
  /** Optional lucide icon (already sized/coloured by the caller). */
  icon?: ReactNode;
  title: string;
  body?: string;
  primary?: Action;
  secondary?: Action;
  testID?: string;
};

export function AuthStatePanel({ icon, title, body, primary, secondary, testID }: AuthStatePanelProps) {
  const reduced = useReducedMotion();
  return (
    <ScreenShell testID={testID}>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 justify-center gap-6"
      >
        <View className="items-center gap-3">
          {icon ? <View className="mb-1">{icon}</View> : null}
          <Text variant="headingLg" className="text-center">
            {title}
          </Text>
          {body ? (
            <Text
              variant="body"
              className="text-center text-text-secondary dark:text-text-secondary-dark"
            >
              {body}
            </Text>
          ) : null}
        </View>

        {primary || secondary ? (
          <View className="gap-3">
            {primary ? (
              <Button variant="primary" disabled={primary.busy} onPress={primary.onPress}>
                {primary.label}
              </Button>
            ) : null}
            {secondary ? (
              <Button variant="ghost" disabled={secondary.busy} onPress={secondary.onPress}>
                {secondary.label}
              </Button>
            ) : null}
          </View>
        ) : null}
      </Animated.View>
    </ScreenShell>
  );
}
