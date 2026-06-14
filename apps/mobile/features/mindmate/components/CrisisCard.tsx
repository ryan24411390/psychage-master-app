import { LifeBuoy } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { MINDMATE_COPY } from '../copy';

// SR-2 crisis surface inside the chat. Takes priority over any AI reply; the CTA
// routes to the full crisis screen (S11). Crisis-color OUTLINE only (never a red
// fill) — matches the Help-now pill's sanctioned use of the crisis color.
export function CrisisCard({ onGetSupport }: { onGetSupport: () => void }) {
  return (
    <View
      accessibilityRole="alert"
      className="mx-4 my-2 gap-3 rounded-2xl border border-crisis bg-surface p-4 dark:bg-surface-dark"
      testID="mindmate-crisis-card"
    >
      <View className="flex-row items-center gap-2">
        <LifeBuoy size={20} color={colors.crisis} strokeWidth={1.75} />
        <Text
          variant="bodyBold"
          className="flex-1 text-text-primary dark:text-text-primary-dark"
        >
          {MINDMATE_COPY.crisisTitle}
        </Text>
      </View>
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
        {MINDMATE_COPY.crisisBody}
      </Text>
      <Button onPress={onGetSupport} testID="mindmate-crisis-cta">
        {MINDMATE_COPY.crisisCta}
      </Button>
    </View>
  );
}
