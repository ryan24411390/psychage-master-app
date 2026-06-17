import { ScrollView } from 'react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';

// Shared shell for the in-app legal/disclaimer screens (Terms, Privacy, Medical
// disclaimer). Renders the approved body copy. The wording lives in
// features/settings/copy.ts (CT4_SETTINGS.legal). Educational framing only (SR-2/SR-3).
export function LegalScreen({ body, testID }: { body: string; testID?: string }) {
  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView
        contentContainerClassName="gap-4 py-4"
        showsVerticalScrollIndicator={false}
        testID={testID}
      >
        <Text variant="bodySm" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {body}
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
