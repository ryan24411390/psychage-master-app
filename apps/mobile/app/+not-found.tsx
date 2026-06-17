import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Mascot } from '@/components/home/Mascot';
import { Text } from '@/components/ui/Text';
import { MASCOT_CONTEXTUAL } from '@/features/mascot';

// Catch-all for any unmatched route (mistyped deep link, stale push notification
// URL, removed screen). Without this, Expo Router falls back to an unstyled default.
// Copy is generic chrome — never diagnostic, never alarming.
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6 dark:bg-background-dark">
        {/* Contextual placement (see MASCOT_CONTEXTUAL): error / 404 → 'oops'. */}
        <Mascot state={MASCOT_CONTEXTUAL.error404} size={156} />
        <Text variant="h2" className="text-center text-text-primary dark:text-text-primary-dark">
          This page isn’t here
        </Text>
        <Text
          variant="body"
          className="text-center text-text-secondary dark:text-text-secondary-dark"
        >
          The link may be broken or the page may have moved.
        </Text>
        <Link href="/" replace className="mt-2">
          <Text variant="label" className="text-primary dark:text-primary-dark">
            Go to home
          </Text>
        </Link>
      </View>
    </>
  );
}
