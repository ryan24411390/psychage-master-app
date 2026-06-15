import { Info } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { TOOLKITS_COPY } from './copy';

// ADR-002 (Accepted 2026-06-15) disclaimer banner. The wording is clinically
// ratified and rendered VERBATIM from TOOLKITS_COPY.disclaimer — do not paraphrase.
// Sits at the top of the toolkit detail surface so the educational framing reads
// before any item.
export function ToolkitsDisclaimer() {
  const tc = useThemeColors();
  return (
    <View
      testID="toolkit-disclaimer"
      className="flex-row items-start gap-2 rounded-xl border border-border bg-surface-accent px-4 py-3 dark:border-border-dark dark:bg-surface-accent-dark"
    >
      <View className="pt-0.5">
        <Info size={16} color={tc.inkSecondary} strokeWidth={1.75} />
      </View>
      <Text variant="caption" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
        {TOOLKITS_COPY.disclaimer}
      </Text>
    </View>
  );
}
