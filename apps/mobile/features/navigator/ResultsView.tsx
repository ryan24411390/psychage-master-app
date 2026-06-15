import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { RelevancePhrase } from './components/RelevancePhrase';
import { NAVIGATOR_COPY } from './copy';

// S18 — results. Up to THREE "possible explanations", each shown as TEXT only: a plain
// condition name, the relevance as a closed-vocabulary PHRASE (Possible · Likely ·
// Strong match — capped at the engine's 0.75, never a bar/meter/number), and a
// two-line common-language description. The honesty caveat renders ONCE, verbatim.
// Results are NOT written to any record (a different instrument).
//
// Onward paths are injected: "Read about this" → Learn (B2 stub), "Something steadying
// now" → Toolkit S19 (PR C), "Find professional care" → Find (B2 stub).
//
// The condition names + descriptions come from the fixture KB (CT4). The caveat + the
// onward-path labels are Flow Book verbatim, sourced from ./copy (CT4 §9).

const CAVEAT = NAVIGATOR_COPY.caveat;

/** The lean result shape the view renders — a subset of the engine's
 *  NavigatorResultItem, so this view never imports the shared package. */
export interface ResultItemVM {
  readonly condition_id: string;
  readonly name: string;
  readonly description_for_user: string;
  readonly relevance_label: string;
}

export interface ResultsViewProps {
  readonly results: readonly ResultItemVM[];
  readonly onReadAbout: (conditionId: string) => void;
  readonly onSteadyingNow: () => void;
  readonly onFindCare: () => void;
  readonly onSaveForLater?: () => void;
  readonly onBack: () => void;
}

function OnwardLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="min-h-[44px] justify-center"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
        {label}
      </Text>
    </Pressable>
  );
}

export function ResultsView({
  results,
  onReadAbout,
  onSteadyingNow,
  onFindCare,
  onSaveForLater,
  onBack,
}: ResultsViewProps) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const shown = results.slice(0, 3);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={NAVIGATOR_COPY.back}
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] w-11 justify-center"
        >
          <ArrowLeft size={24} color={ink} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <View className="border-l-4 border-primary px-4 py-3 rounded-r-xl bg-surface-accent/20 dark:bg-surface-accent-dark/10">
          <Text variant="body" className="italic text-text-primary dark:text-text-primary-dark">
            {CAVEAT}
          </Text>
        </View>

        {shown.map((r) => (
          <Card key={r.condition_id} variant="elevated" className="gap-2 p-5">
            <RelevancePhrase phrase={r.relevance_label} />
            <Text variant="heading">{r.name}</Text>
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {r.description_for_user}
            </Text>
            <View className="mt-2">
              <OnwardLink
                label={NAVIGATOR_COPY.readAbout}
                onPress={() => onReadAbout(r.condition_id)}
              />
            </View>
          </Card>
        ))}

        <View className="gap-1 border-t border-border pt-4 dark:border-border-dark">
          <OnwardLink label={NAVIGATOR_COPY.steadyingNow} onPress={onSteadyingNow} />
          <OnwardLink label={NAVIGATOR_COPY.findCare} onPress={onFindCare} />
          {onSaveForLater ? (
            <OnwardLink label={NAVIGATOR_COPY.saveForLater} onPress={onSaveForLater} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
