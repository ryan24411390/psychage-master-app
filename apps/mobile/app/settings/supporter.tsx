import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { SupporterTiers } from '@/components/supporter/SupporterTiers';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SUPPORTER } from '@/features/supporter/copy';
import { type ContributionTierId, purchaseContribution } from '@/lib/iap/contribute';

// S50 Keep Psychage free (U4) — the ONLY monetization in V1. Settings-resident,
// reachable only from the hub. NEVER interrupts, NEVER guilts, NEVER ties to a
// feature, NEVER on the record. Voluntary, store-compliant IAP. The purchase call
// is the platform boundary (StoreKit / Play Billing) — stubbed + flagged here.
export default function SupporterScreen() {
  const t = CT4_SUPPORTER;
  const [status, setStatus] = useState<'idle' | 'thanks' | 'unavailable'>('idle');

  const onSelect = async (id: ContributionTierId) => {
    const result = await purchaseContribution(id);
    setStatus(result.purchased ? 'thanks' : result.available ? 'idle' : 'unavailable');
  };

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="h2" className="px-1">
          {t.title}
        </Text>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.body}
        </Text>

        <View className="gap-2">
          <Text variant="h6" className="px-1">
            {t.tiersLabel}
          </Text>
          <SupporterTiers onSelect={onSelect} />
        </View>

        {status === 'thanks' ? (
          <Text
            variant="bodySmall"
            className="px-1 text-text-secondary dark:text-text-secondary-dark"
            testID="supporter-thanks"
          >
            {t.thanks}
          </Text>
        ) : null}
        {status === 'unavailable' ? (
          <Text
            variant="bodySmall"
            className="px-1 text-text-secondary dark:text-text-secondary-dark"
            testID="supporter-unavailable"
          >
            {t.unavailable}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}
