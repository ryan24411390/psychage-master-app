import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { AppleIcon, GoogleIcon } from '@/components/auth/SocialIcons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import type { SocialProvider } from '@/features/auth';
import { useThemeColors } from '@/lib/use-theme-colors';

// Apple + Google sign-in entry (rules/auth.md §3). Apple is iOS-only; Google shows on
// both. Each button carries its brand mark (SocialIcons) left of the label. A plain "or"
// divider separates these from the email form.
//
// STORE-COMPLIANCE NOTE: Apple HIG prefers the native AppleAuthentication.Apple-
// AuthenticationButton. The styled button is used to keep this RNTL-renderable; swap it
// in behind Platform.OS==='ios' before store submission (docs/AUTH-OPS-RUNBOOK.md).

type SocialAuthButtonsProps = {
  onProvider: (provider: SocialProvider) => void;
  disabled?: boolean;
};

function ButtonRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center justify-center gap-2.5">
      {icon}
      <Text variant="bodyMedium" className="text-text-primary dark:text-text-primary-dark">
        {label}
      </Text>
    </View>
  );
}

export function SocialAuthButtons({ onProvider, disabled }: SocialAuthButtonsProps) {
  const colors = useThemeColors();
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
          <ButtonRow icon={<AppleIcon color={colors.ink} />} label={AUTH_COPY.continueWithApple} />
        </Button>
      ) : null}

      <Button variant="secondary" disabled={disabled} onPress={() => onProvider('google')}>
        <ButtonRow icon={<GoogleIcon />} label={AUTH_COPY.continueWithGoogle} />
      </Button>
    </View>
  );
}
