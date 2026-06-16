import { LifeBuoy, Phone } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { type Dial, dial as defaultDial } from '@/features/crisis/dialer';
import { telUrl } from '@/features/crisis/intents';
import { useThemeColors } from '@/lib/use-theme-colors';

import { MINDMATE_COPY } from '../copy';

/** The region's primary hotline shown inline on the card (name + voice number). */
export interface CrisisHotline {
  readonly name: string;
  readonly callNumber: string;
}

// SR-2 crisis surface inside the chat. Takes priority over any AI reply. When the
// resolved region has a bundled voice hotline, a direct `tel:` Call action renders
// inline (offline-complete — the dataset ships in the binary, no network needed); the
// secondary CTA still routes to the full crisis screen (S11). Crisis-color OUTLINE
// only (never a red fill) — matches the Help-now pill's sanctioned crisis-color use.
export function CrisisCard({
  onGetSupport,
  hotline,
  dial = defaultDial,
}: {
  onGetSupport: () => void;
  /** Region primary hotline, or null/undefined when the dataset has no voice line. */
  hotline?: CrisisHotline | null;
  /** Injectable dialer for render tests; defaults to the platform dialer. */
  dial?: Dial;
}) {
  const tc = useThemeColors();
  return (
    <View
      accessibilityRole="alert"
      className="mx-4 my-2 gap-3 rounded-2xl border border-crisis bg-surface p-4 dark:bg-surface-dark"
      testID="mindmate-crisis-card"
    >
      <View className="flex-row items-center gap-2">
        <LifeBuoy size={20} color={tc.crisis} strokeWidth={1.75} />
        <Text
          variant="h5"
          className="flex-1 text-text-primary dark:text-text-primary-dark"
        >
          {MINDMATE_COPY.crisisTitle}
        </Text>
      </View>
      <Text variant="bodySmall" className="text-text-secondary dark:text-text-secondary-dark">
        {MINDMATE_COPY.crisisBody}
      </Text>

      {hotline ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${MINDMATE_COPY.crisisCallPrefix} ${hotline.name}`}
          onPress={() => dial(telUrl(hotline.callNumber))}
          className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-lg border border-crisis px-4 py-3"
          testID="mindmate-crisis-call"
        >
          <Phone size={18} color={tc.crisis} strokeWidth={2} />
          <Text variant="h6" className="text-text-primary dark:text-text-primary-dark">
            {MINDMATE_COPY.crisisCallPrefix} {hotline.name}
          </Text>
        </Pressable>
      ) : null}

      <Button onPress={onGetSupport} testID="mindmate-crisis-cta">
        {MINDMATE_COPY.crisisCta}
      </Button>
    </View>
  );
}
