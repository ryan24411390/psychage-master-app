import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import {
  Activity,
  Anchor,
  Backpack,
  Compass,
  HeartHandshake,
  MessageCircle,
  Moon,
  Notebook,
} from 'lucide-react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { ClarityTile, DeepDiveCard, HeroTile, SmallTile } from '@/features/compass/CompassTile';
import { CT4_COMPASS } from '@/features/compass/copy';
import { COMPASS_ROUTES } from '@/features/compass/routes';

const HEADING = 'ml-0.5 font-display text-[16px] text-text-primary dark:text-text-primary-dark';

export default function CompassScreen() {
  const t = CT4_COMPASS;
  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-6 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        {/* Right now */}
        <View className="gap-3">
          <Text variant="heading" className={HEADING}>
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
          <Text variant="heading" className={HEADING}>
            {t.headingOverTime}
          </Text>
          <ClarityTile
            title={t.clarity.title}
            feature={t.clarity.sub}
            icon={Activity}
            onPress={() => router.push(COMPASS_ROUTES.clarity)}
            testID="compass-tile-clarity"
          />
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
          <Text variant="heading" className={HEADING}>
            {t.headingDeepDives}
          </Text>
          <DeepDiveCard
            title={t.sleep.title}
            feature={t.sleep.sub}
            icon={Moon}
            onPress={() => router.push(COMPASS_ROUTES.sleep)}
            testID="compass-tile-sleep"
          />
          <DeepDiveCard
            title={t.toolkits.title}
            feature={t.toolkits.sub}
            icon={Backpack}
            onPress={() => router.push(COMPASS_ROUTES.toolkits)}
            testID="compass-tile-toolkits"
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
