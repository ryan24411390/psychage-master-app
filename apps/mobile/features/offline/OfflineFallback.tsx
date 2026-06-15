import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CT4_OFFLINE } from '@/features/offline/copy';

// The honest offline / empty state (S25 today's-read, S28 Find, WebView fallback).
// Reused across surfaces. No fake spinner, no blame — a calm line + an optional
// retry. The clay still-life slot is a CT2 placeholder (a neutral block) until the
// illustration set is commissioned.

type OfflineFallbackProps = {
  variant: 'offline' | 'empty';
  onRetry?: () => void;
  testID?: string;
};

export function OfflineFallback({ variant, onRetry, testID }: OfflineFallbackProps) {
  const t = variant === 'offline' ? CT4_OFFLINE.offline : CT4_OFFLINE.empty;

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6" testID={testID}>
      {/* CT2 PLACEHOLDER — clay still-life illustration slot (commission pending). */}
      <View className="h-20 w-20 rounded-xl bg-border dark:bg-border-dark" />
      <Text variant="heading" className="text-center">
        {t.title}
      </Text>
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        {t.body}
      </Text>
      {onRetry ? (
        <View className="pt-1">
          <Button variant="secondary" size="sm" onPress={onRetry} testID="offline-retry">
            {CT4_OFFLINE.retry}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
