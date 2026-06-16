import { router } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { Backpack, Book, Compass, HeartHandshake, LifeBuoy, MessageCircle, Moon, Sparkles } from 'lucide-react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CompassTile } from '@/features/compass/CompassTile';
import { CT4_COMPASS } from '@/features/compass/copy';
import { COMPASS_ROUTES } from '@/features/compass/routes';

export default function CompassScreen() {
  const t = CT4_COMPASS;
  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-6 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Immediate Actions */}
        <View className="gap-3">
          <Text variant="h3" className="ml-1 mb-1">
            {t.headingImmediate}
          </Text>
          <View className="flex-row gap-3">
            <CompassTile
              title={t.toolkit.title}
              subLabel={t.toolkit.sub}
              onPress={() => router.push(COMPASS_ROUTES.toolkit)}
              tint="now"
              icon={LifeBuoy}
              variant="action"
              testID="compass-tile-toolkit"
            />
            <CompassTile
              title={t.navigator.title}
              subLabel={t.navigator.sub}
              onPress={() => router.push(COMPASS_ROUTES.navigator)}
              tint="now"
              icon={Compass}
              variant="action"
              testID="compass-tile-navigator"
            />
          </View>
          <View className="flex-row gap-3">
            <CompassTile
              title={t.mindmate.title}
              subLabel={t.mindmate.sub}
              onPress={() => router.push(COMPASS_ROUTES.mindmate)}
              tint="now"
              icon={MessageCircle}
              variant="action"
              testID="compass-tile-mindmate"
            />
            <CompassTile
              title={t.clarity.title}
              subLabel={t.clarity.sub}
              onPress={() => router.push(COMPASS_ROUTES.clarity)}
              tint="now"
              icon={Sparkles}
              variant="action"
              testID="compass-tile-clarity"
            />
          </View>
        </View>

        {/* Reflection */}
        <View className="gap-2 mt-2">
          <Text variant="h3" className="ml-1 mb-2">
            {t.headingReflection}
          </Text>
          <CompassTile
            title={t.moodJournal.title}
            subLabel={t.moodJournal.sub}
            onPress={() => router.push(COMPASS_ROUTES.moodJournal)}
            tint="patterns"
            icon={Book}
            variant="list"
            testID="compass-tile-mood-journal"
          />
          <CompassTile
            title={t.relationship.title}
            subLabel={t.relationship.sub}
            onPress={() => router.push(COMPASS_ROUTES.relationship)}
            tint="patterns"
            icon={HeartHandshake}
            variant="list"
            testID="compass-tile-relationship"
          />
        </View>

        {/* Deep Dives */}
        <View className="gap-3 mt-2">
          <Text variant="h3" className="ml-1 mb-1">
            {t.headingExplore}
          </Text>
          <CompassTile
            title={t.sleep.title}
            subLabel={t.sleep.sub}
            onPress={() => router.push(COMPASS_ROUTES.sleep)}
            tint="understand"
            icon={Moon}
            variant="feature"
            testID="compass-tile-sleep"
          />
          <CompassTile
            title={t.toolkits.title}
            subLabel={t.toolkits.sub}
            onPress={() => router.push('/toolkits')}
            tint="understand"
            icon={Backpack}
            variant="feature"
            testID="compass-tile-toolkits"
          />
        </View>

      </ScrollView>
    </ScreenShell>
  );
}
