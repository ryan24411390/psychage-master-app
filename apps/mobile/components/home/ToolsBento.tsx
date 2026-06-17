import { router } from 'expo-router';
import { Activity, Anchor, Compass, MessageCircle } from 'lucide-react-native';
import { View } from 'react-native';

import { ClarityTile, HeroTile, SmallTile } from '@/components/ui/tiles/Tiles';
import { Text } from '@/components/ui/Text';
import { COMPASS_ROUTES } from '@/features/compass/routes';
import { TOOLS, type ToolId, toolUsageStore } from '@/lib/tool-usage-store';

// "When you need something now" bento. Four real tools in the Compass bento system:
// a tall Toolkit hero + a stacked Navigator/MindMate pair, then the wide navy Clarity
// tile. Each tap records local usage (drives the dormant-tool nudge — the same behavior
// the old /tool/[id] placeholder hop gave) then pushes the real native flow.
function open(id: ToolId, route: string) {
  toolUsageStore.recordUse(id);
  router.push(route as Parameters<typeof router.push>[0]);
}

export function ToolsBento() {
  return (
    <View className="gap-3">
      <Text variant="h2" className="ml-1 mt-2">
        When you need something now
      </Text>

      <View className="flex-row gap-3">
        <HeroTile
          title={TOOLS.toolkit.title}
          feature={TOOLS.toolkit.name}
          icon={Anchor}
          onPress={() => open('toolkit', COMPASS_ROUTES.toolkit)}
          testID="bento-tile-toolkit"
        />
        <View className="flex-1 gap-3">
          <SmallTile
            title={TOOLS.navigator.title}
            feature={TOOLS.navigator.name}
            icon={Compass}
            onPress={() => open('navigator', COMPASS_ROUTES.navigator)}
            testID="bento-tile-navigator"
          />
          <SmallTile
            title={TOOLS.mindmate.title}
            feature={TOOLS.mindmate.name}
            icon={MessageCircle}
            onPress={() => open('mindmate', COMPASS_ROUTES.mindmate)}
            testID="bento-tile-mindmate"
          />
        </View>
      </View>

      <ClarityTile
        title={TOOLS.clarity.title}
        feature="Clarity Score · stays on your phone"
        icon={Activity}
        onPress={() => open('clarity', COMPASS_ROUTES.clarity)}
        testID="bento-tile-clarity"
      />
    </View>
  );
}
