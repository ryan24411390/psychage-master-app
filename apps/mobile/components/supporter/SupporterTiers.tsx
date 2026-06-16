import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { CT4_SUPPORTER } from '@/features/supporter/copy';
import { SUPPORTER_TIERS } from '@/features/supporter/tiers';
import type { ContributionTierId } from '@/lib/iap/contribute';

// The voluntary contribution tiers list. Plain rows — name + price. NO crisis/error
// color, NO mascot, NO urgency, NO feature-gating. Calm by construction.

type SupporterTiersProps = {
  onSelect: (id: ContributionTierId) => void;
};

export function SupporterTiers({ onSelect }: SupporterTiersProps) {
  return (
    <View className="gap-2">
      {SUPPORTER_TIERS.map((tier) => {
        const name = CT4_SUPPORTER.tiers[tier.nameKey];
        return (
          <Pressable
            key={tier.id}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${tier.priceLabel}`}
            onPress={() => onSelect(tier.id)}
            testID={`supporter-tier-${tier.id}`}
            className="min-h-[44px] flex-row items-center justify-between rounded-lg border border-border px-4 py-3 dark:border-border-dark"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text variant="h6">{name}</Text>
            <Text variant="h6" className="text-text-secondary dark:text-text-secondary-dark">
              {tier.priceLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
