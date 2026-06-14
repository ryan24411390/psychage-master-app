import { router } from 'expo-router';
import { ScrollView } from 'react-native';

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
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {t.heading}
        </Text>
        <CompassTile
          title={t.toolkit.title}
          subLabel={t.toolkit.sub}
          onPress={() => router.push(COMPASS_ROUTES.toolkit)}
          testID="compass-tile-toolkit"
        />
        <CompassTile
          title={t.navigator.title}
          subLabel={t.navigator.sub}
          onPress={() => router.push(COMPASS_ROUTES.navigator)}
          testID="compass-tile-navigator"
        />
        <CompassTile
          title={t.clarity.title}
          subLabel={t.clarity.sub}
          onPress={() => router.push(COMPASS_ROUTES.clarity)}
          testID="compass-tile-clarity"
        />
      </ScrollView>
    </ScreenShell>
  );
}
