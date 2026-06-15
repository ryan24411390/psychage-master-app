import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { DestructivePair } from '@/components/settings/DestructivePair';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';

// S47 Delete — what this does. The honest pre-delete screen. HARD-IMMEDIATE, NO
// recovery window. The destructive pair is the geometric-sibling rule: "continue"
// (rust outline) and "keep my account" (identical 54px button, borderStrong/ink)
// are equally easy to choose — no confirm-shaming.
export default function DeleteScreen() {
  const t = CT4_SETTINGS.delete;

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="heading" className="px-1">
          {t.heading}
        </Text>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.body}
        </Text>
        <View className="pt-2">
          <DestructivePair
            destructLabel={t.continueLabel}
            keepLabel={t.keepLabel}
            onDestruct={() => router.push('/settings/delete-confirm')}
            onKeep={() => router.back()}
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
