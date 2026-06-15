import { router } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { Book, Compass, HeartHandshake, LifeBuoy, MessageCircle, Moon, Sparkles } from 'lucide-react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CompassTile } from '@/features/compass/CompassTile';
import { CT4_COMPASS } from '@/features/compass/copy';
import { COMPASS_ROUTES } from '@/features/compass/routes';

// S5 Compass tab — the landing SHELL. B2 owns this shell; the tiles link to A2's
// pushed destinations (S19 Toolkit, S13 Navigator), now live on main via
// COMPASS_ROUTES (/toolkit, /navigator). B2 does NOT build the destinations.
// The GlobalHeader (incl. the Help-now pill) is injected by the tabs layout, so
// this screen carries no header of its own.
export default function CompassScreen() {
  const t = CT4_COMPASS;
  return (
    <ScreenShell edges={['bottom']} className="bg-paper dark:bg-paper">
      <ScrollView contentContainerClassName="gap-3 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {t.heading}
        </Text>
        <CompassTile
          title={t.toolkit.title}
          subLabel={t.toolkit.sub}
          onPress={() => router.push(COMPASS_ROUTES.toolkit)}
          tint="now"
          icon={LifeBuoy}
          variant="hero"
          testID="compass-tile-toolkit"
        />
        <View className="flex-row gap-3">
          <CompassTile
            title={t.navigator.title}
            subLabel={t.navigator.sub}
            onPress={() => router.push(COMPASS_ROUTES.navigator)}
            tint="now"
            icon={Compass}
            variant="standard"
            testID="compass-tile-navigator"
          />
          <CompassTile
            title={t.relationship.title}
            subLabel={t.relationship.sub}
            onPress={() => router.push(COMPASS_ROUTES.relationship)}
            tint="now"
            icon={HeartHandshake}
            variant="standard"
            testID="compass-tile-relationship"
          />
        </View>
        <View className="flex-row gap-3">
          <CompassTile
            title={t.mindmate.title}
            subLabel={t.mindmate.sub}
            onPress={() => router.push(COMPASS_ROUTES.mindmate)}
            tint="now"
            icon={MessageCircle}
            variant="standard"
            testID="compass-tile-mindmate"
          />
          <CompassTile
            title={t.clarity.title}
            subLabel={t.clarity.sub}
            onPress={() => router.push(COMPASS_ROUTES.clarity)}
            tint="now"
            icon={Sparkles}
            variant="standard"
            testID="compass-tile-clarity"
          />
        </View>
        <Text
          variant="caption"
          className="mt-2 text-text-secondary dark:text-text-secondary-dark"
        >
          {t.reflectHeading}
        </Text>
        <CompassTile
          title={t.moodJournal.title}
          subLabel={t.moodJournal.sub}
          onPress={() => router.push(COMPASS_ROUTES.moodJournal)}
          tint="patterns"
          icon={Book}
          variant="hero"
          testID="compass-tile-mood-journal"
        />
        <Text
          variant="caption"
          className="mt-2 text-text-secondary dark:text-text-secondary-dark"
        >
          {t.exploreHeading}
        </Text>
        <CompassTile
          title={t.sleep.title}
          subLabel={t.sleep.sub}
          onPress={() => router.push(COMPASS_ROUTES.sleep)}
          tint="understand"
          icon={Moon}
          variant="hero"
          testID="compass-tile-sleep"
        />
      </ScrollView>
    </ScreenShell>
  );
}
