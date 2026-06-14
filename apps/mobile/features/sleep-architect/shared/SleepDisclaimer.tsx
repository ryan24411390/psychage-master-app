import { Info } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { colors } from '@/lib/colors';

// SR-3 educational framing. A persistent, low-key reminder that Sleep Architect is
// education — not medical advice, not a diagnosis. Ported from the web tool's
// SleepDisclaimer. Copy is CT4 (Dr. Dobson review before ship).
export function SleepDisclaimer() {
  const { colorScheme } = useColorScheme();
  const tint =
    colorScheme === 'dark' ? colors.text.tertiary.dark : colors.text.tertiary.light;
  return (
    <View className="flex-row gap-2 rounded-xl border border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
      <Info size={16} color={tint} strokeWidth={1.75} />
      <Text
        variant="caption"
        className="flex-1 leading-5 text-text-tertiary dark:text-text-tertiary-dark"
      >
        {CT4_SLEEP.disclaimer}
      </Text>
    </View>
  );
}
