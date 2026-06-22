import { ShieldCheck } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { NAVIGATOR_COPY } from '../copy';

// S — Welcome (mobile port of web WelcomeScreen). Hero + educational positioning +
// disclaimer card + start CTA. The KB is bundled (synchronous), so unlike web there are
// no async load/error/retry states here.

export interface WelcomeScreenProps {
  readonly onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const tc = useThemeColors();
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow justify-between gap-6 px-4 pb-8 pt-8"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-6">
        <View className="gap-2">
          <Text variant="h1" accessibilityRole="header">
            {NAVIGATOR_COPY.welcomeTitle}
          </Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {NAVIGATOR_COPY.welcomeSubtitle}
          </Text>
        </View>

        <Card variant="accent" className="flex-row items-start gap-2">
          <ShieldCheck size={20} color={tc.primary} strokeWidth={2} />
          <Text variant="caption" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
            {NAVIGATOR_COPY.welcomeDisclaimer}
          </Text>
        </Card>
      </View>

      <Button variant="primary" onPress={onStart}>
        {NAVIGATOR_COPY.welcomeStart}
      </Button>
    </ScrollView>
  );
}
