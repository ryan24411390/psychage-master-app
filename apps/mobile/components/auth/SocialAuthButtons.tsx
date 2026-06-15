import { Platform, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import type { SocialProvider } from '@/features/auth';

// Apple + Google sign-in entry (rules/auth.md §3). Apple is iOS-only (the provider
// doesn't exist on Android); Google shows on both. A plain "or" divider separates
// these from the email form.
//
// STORE-COMPLIANCE NOTE: Apple HIG prefers the native AppleAuthentication.Apple-
// AuthenticationButton. It's omitted here to keep this component free of native
// imports (RNTL-renderable); swap it in behind a Platform.OS==='ios' guard before
// store submission. Tracked in docs/AUTH-OPS-RUNBOOK.md.

type SocialAuthButtonsProps = {
  onProvider: (provider: SocialProvider) => void;
  disabled?: boolean;
};

export function SocialAuthButtons({ onProvider, disabled }: SocialAuthButtonsProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border/60 dark:bg-border-dark/60" />
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {AUTH_COPY.socialDivider}
        </Text>
        <View className="h-px flex-1 bg-border/60 dark:bg-border-dark/60" />
      </View>

      {Platform.OS === 'ios' ? (
        <Button variant="secondary" disabled={disabled} onPress={() => onProvider('apple')}>
          {AUTH_COPY.continueWithApple}
        </Button>
      ) : null}

      <Button variant="secondary" disabled={disabled} onPress={() => onProvider('google')}>
        {AUTH_COPY.continueWithGoogle}
      </Button>
    </View>
  );
}
