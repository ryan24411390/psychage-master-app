import { View } from 'react-native';

import { Mascot } from '@/components/home/Mascot';
import { Text } from '@/components/ui/Text';

import { MINDMATE_COPY } from '../copy';

// Empty-conversation state — the mascot fronts MindMate (per the design), with the
// educator framing up front so expectations are set before the first message.
export function MindMateIntro() {
  return (
    <View className="items-center gap-4 px-6 py-10" testID="mindmate-intro">
      <Mascot testID="mindmate-mascot" />
      <Text
        variant="headingLg"
        accessibilityRole="header"
        className="text-center text-text-primary dark:text-text-primary-dark"
      >
        {MINDMATE_COPY.title}
      </Text>
      <Text
        variant="body"
        className="text-center text-text-secondary dark:text-text-secondary-dark"
      >
        {MINDMATE_COPY.intro}
      </Text>
    </View>
  );
}
