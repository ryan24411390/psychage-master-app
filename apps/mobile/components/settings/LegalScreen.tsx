import { ScrollView, View } from 'react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';

// Shared shell for the in-app legal/disclaimer screens (Terms, Privacy, Medical
// disclaimer). Renders a prominent "placeholder — pending review" banner above the
// body so the fixture state is unmistakable in-app, then the body copy. The wording
// itself lives in features/settings/copy.ts (CT4_SETTINGS.legal), flagged FIXTURE —
// pending Dr. Dobson + legal. Educational framing only (SR-2/SR-3).
export function LegalScreen({ body, testID }: { body: string; testID?: string }) {
  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView
        contentContainerClassName="gap-4 py-4"
        showsVerticalScrollIndicator={false}
        testID={testID}
      >
        <View className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 dark:border-warning-dark/40 dark:bg-warning-dark/10">
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            Placeholder copy — pending clinical and legal review. This is not the final wording.
          </Text>
        </View>
        <Text variant="bodySm" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {body}
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
