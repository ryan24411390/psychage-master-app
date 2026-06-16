import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S35 — Check your email + verification (rules/auth.md §3: email verification
// required before Tier-2). No 6-digit OTP / no C-CODE — the password model uses a
// verification LINK. "Did not get it? Resend" with a cooldown so the button cannot
// be hammered. Router-agnostic: `onResend` is wired by the route.

const DEFAULT_COOLDOWN_SECONDS = 30;

type VerifyPanelProps = {
  email: string;
  cooldownSeconds?: number;
  onResend: () => void;
};

export function VerifyPanel({
  email,
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
  onResend,
}: VerifyPanelProps) {
  const reduced = useReducedMotion();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const onCooldown = remaining > 0;

  const handleResend = () => {
    if (onCooldown) return;
    onResend();
    setRemaining(cooldownSeconds);
  };

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 justify-center gap-6"
      >
        <View className="gap-3">
          <Text variant="h2">{AUTH_COPY.verifyTitle}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {AUTH_COPY.verifyBody}
          </Text>
          <Text variant="h6">{email}</Text>
        </View>

        <Button variant="secondary" disabled={onCooldown} onPress={handleResend}>
          {onCooldown ? AUTH_COPY.resendCooldownLabel(remaining) : AUTH_COPY.resendLabel}
        </Button>
      </Animated.View>
    </ScreenShell>
  );
}
