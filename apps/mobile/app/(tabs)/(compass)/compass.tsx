import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { type DailyEntry, dailyRollupReader } from '@/lib/daily-rollup';
import { getMomentStore } from '@/lib/moment-store';
import {
  Activity,
  Anchor,
  Backpack,
  ChevronRight,
  Compass,
  HeartHandshake,
  LineChart,
  MessageCircle,
  Moon,
  Notebook,
} from 'lucide-react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { ClarityTile, DeepDiveCard, HeroTile, SmallTile } from '@/features/compass/CompassTile';
import { CT4_COMPASS } from '@/features/compass/copy';
import { COMPASS_ROUTES } from '@/features/compass/routes';
import { useThemeColors } from '@/lib/use-theme-colors';

const HEADING = 'ml-0.5 font-display text-[16px] text-text-primary dark:text-text-primary-dark';

export default function CompassScreen() {
  const t = CT4_COMPASS;
  const tcPrimary = useThemeColors().primary;
  const [recent, setRecent] = useState<DailyEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      const reader = dailyRollupReader(getMomentStore());
      setRecent(reader.getRecent(3));
    }, [])
  );

  const showStrugglingSuggestion = recent.length >= 2 && recent.filter(r => r.state <= 1).length >= 2;

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-6 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        {showStrugglingSuggestion && (
          <View className="gap-3">
            <HeroTile
              title="You've logged some tough moments"
              feature="The Toolkit is here when you need to steady yourself."
              icon={Backpack}
              onPress={() => router.push(COMPASS_ROUTES.toolkit)}
              testID="compass-predictive-toolkit"
            />
          </View>
        )}

        {/* Right now */}
        <View className="gap-3">
          <Text variant="h2" className={HEADING}>
            {t.headingRightNow}
          </Text>
          <View className="flex-row gap-3">
            <HeroTile
              title={t.toolkit.title}
              feature={t.toolkit.sub}
              icon={Anchor}
              onPress={() => router.push(COMPASS_ROUTES.toolkit)}
              testID="compass-tile-toolkit"
            />
            <View className="flex-1 gap-3">
              <SmallTile
                title={t.navigator.title}
                feature={t.navigator.sub}
                icon={Compass}
                onPress={() => router.push(COMPASS_ROUTES.navigator)}
                testID="compass-tile-navigator"
              />
              <SmallTile
                title={t.mindmate.title}
                feature={t.mindmate.sub}
                icon={MessageCircle}
                onPress={() => router.push(COMPASS_ROUTES.mindmate)}
                testID="compass-tile-mindmate"
              />
            </View>
          </View>
        </View>

        {/* Over time */}
        <View className="gap-3">
          <Text variant="h2" className={HEADING}>
            {t.headingOverTime}
          </Text>
          <ClarityTile
            title={t.clarity.title}
            feature={t.clarity.sub}
            icon={Activity}
            onPress={() => router.push(COMPASS_ROUTES.clarity)}
            testID="compass-tile-clarity"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View past Clarity snapshots"
            onPress={() => router.push(COMPASS_ROUTES.clarityHistory)}
            hitSlop={6}
            className="min-h-[40px] flex-row items-center justify-end gap-1 px-1"
            testID="compass-clarity-history"
          >
            <Text variant="bodyLarge" className="text-primary dark:text-primary-dark">
              View past snapshots
            </Text>
            <ChevronRight size={16} color={tcPrimary} strokeWidth={2} />
          </Pressable>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <SmallTile
                title={t.moodJournal.title}
                feature={t.moodJournal.sub}
                icon={Notebook}
                onPress={() => router.push(COMPASS_ROUTES.moodJournal)}
                testID="compass-tile-mood-journal"
              />
            </View>
            <View className="flex-1">
              <SmallTile
                title={t.relationship.title}
                feature={t.relationship.sub}
                icon={HeartHandshake}
                onPress={() => router.push(COMPASS_ROUTES.relationship)}
                testID="compass-tile-relationship"
              />
            </View>
          </View>
        </View>

        {/* Deep Dives */}
        <View className="gap-3">
          <Text variant="h2" className={HEADING}>
            {t.headingDeepDives}
          </Text>
          <DeepDiveCard
            title={t.insights.title}
            feature={t.insights.sub}
            icon={LineChart}
            onPress={() => router.push(COMPASS_ROUTES.insights)}
            testID="compass-tile-insights"
          />
          <DeepDiveCard
            title={t.sleep.title}
            feature={t.sleep.sub}
            icon={Moon}
            onPress={() => router.push(COMPASS_ROUTES.sleep)}
            testID="compass-tile-sleep"
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
