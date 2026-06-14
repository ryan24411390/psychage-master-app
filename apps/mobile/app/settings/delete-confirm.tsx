import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { DestructivePair } from '@/components/settings/DestructivePair';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';
import { storage } from '@/lib/adapters/storage';
import { resetCheckInStore } from '@/lib/check-in-store';
import { requestRemoteAccountDeletion } from '@/lib/persistence/account-deletion';
import { wipeLocalData } from '@/lib/persistence/wipe-local-data';

// S48 Delete — confirm. The final confirm. On confirm the LOCAL/REMOTE boundary
// is explicit and ordered:
//   1. wipeLocalData(storage) — HARD-IMMEDIATE local erase of all known keys.
//   2. resetCheckInStore()    — drop the live singleton so reads reflect empty disk.
//   3. requestRemoteAccountDeletion() — SR-4-gated STUB, no network; fire-and-forget
//      so the local delete never blocks on the (un-wired) remote cascade.
// Then replace the route so there is no back-button into a deleted state. No undo
// timer, no soft-delete, no confirm-shaming.
export default function DeleteConfirmScreen() {
  const t = CT4_SETTINGS.deleteConfirm;

  const onConfirm = () => {
    wipeLocalData(storage);
    resetCheckInStore();
    void requestRemoteAccountDeletion();
    router.replace('/');
  };

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
            destructLabel={t.confirmLabel}
            keepLabel={t.keepLabel}
            onDestruct={onConfirm}
            onKeep={() => router.back()}
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
