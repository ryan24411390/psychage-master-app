import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_FIND } from '@/features/find/copy';
import { OfflineFallback } from '@/features/offline/OfflineFallback';
import { useIsOnline } from '@/features/offline/useIsOnline';

// S28 Find tab. Online: a thin landing into the directory (S26, a WebView screen in
// PR E — the push resolves once that route lands). Offline: the honest fallback, so
// the Find directory never shows a dead WebView. The GlobalHeader is the tabs header.
export default function FindScreen() {
  const online = useIsOnline();

  if (!online) {
    return (
      <ScreenShell edges={['bottom']}>
        <OfflineFallback variant="offline" testID="find-offline" />
      </ScreenShell>
    );
  }

  const t = CT4_FIND;
  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="headingLg" className="px-1">
          {t.title}
        </Text>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>
        <Button variant="primary" onPress={() => router.push('/find/directory')} testID="find-open-directory">
          {t.openDirectory}
        </Button>
      </ScrollView>
    </ScreenShell>
  );
}
