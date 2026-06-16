import type { ReactNode } from 'react';
import { View } from 'react-native';

import { GoogleIcon } from '@/components/auth/SocialIcons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import type { SocialProvider } from '@/features/auth';

// Social sign-in entry (rules/auth.md §3). Google only — Apple is hidden in V1 (the
// provider code path stays in the service, just no button). A plain "or" divider
// separates this from the email form.

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
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border/60 dark:bg-border-dark/60" />
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {AUTH_COPY.socialDivider}
        </Text>
        <View className="h-px flex-1 bg-border/60 dark:bg-border-dark/60" />
      </View>

      <Button variant="secondary" disabled={disabled} onPress={() => onProvider('google')}>
        <ButtonRow icon={<GoogleIcon />} label={AUTH_COPY.continueWithGoogle} />
      </Button>
    </View>
  );
}
