import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CT4_WEBVIEW } from '@/features/webview/copy';

// C-WV-LOAD error frame — swaps in over the chrome with a generic line + retry.
// Never leaks token/auth detail (security.md §3 — generic only).
export function WebViewError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6" testID="wv-error">
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        {CT4_WEBVIEW.loadError}
      </Text>
      <Button variant="secondary" size="sm" onPress={onRetry} testID="wv-retry">
        {CT4_WEBVIEW.retry}
      </Button>
    </View>
  );
}
