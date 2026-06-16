import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppLoader } from '@/components/ui/AppLoader';
import { toolUsageStore, type ToolId, TOOLS } from '@/lib/tool-usage-store';

// The tool entry point records use (so Today's dormant nudge can bring a tool back),
// then immediately hands off to the REAL feature screen — these all already exist and
// are what the Compass tab routes to. Centralizing the record-then-redirect here means
// both ToolsBento (home tiles) and the dormant nudge land on the real screen with one
// usage write and no per-component wiring. `router.replace` keeps Back → Today.
const TOOL_ROUTES: Record<ToolId, string> = {
  toolkit: '/toolkit',
  navigator: '/navigator',
  mindmate: '/tools/mindmate',
  clarity: '/tools/clarity',
  breathing: '/toolkit?exercise=breathing',
};

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const toolId = id as ToolId;
    if (id && TOOLS[toolId]) {
      toolUsageStore.recordUse(toolId);
      router.replace(TOOL_ROUTES[toolId] as never);
    }
  }, [id, router]);

  // Brief hand-off frame while the real screen mounts (no placeholder copy).
  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
      <AppLoader />
    </View>
  );
}
