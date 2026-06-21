import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ToolScreen } from '@/components/ui/ToolScreen';
import { toolUsageStore, type ToolId, TOOLS } from '@/lib/tool-usage-store';

// Placeholder tool route, wrapped in ToolScreen for the standard chrome (logo +
// Help-now + profile + back). Renamed from `ToolScreen` to avoid shadowing the
// imported component of the same name.
export default function ToolPlaceholderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id && TOOLS[id as ToolId]) {
      toolUsageStore.recordUse(id as ToolId);
    }
  }, [id]);

  const tool = TOOLS[id as ToolId];

  return (
    <ToolScreen scroll="none" onBack={() => router.back()}>
      <View className="flex-1 items-center justify-center gap-6 p-6">
        <Text variant="h1">{tool ? tool.name : 'Tool Not Found'}</Text>
        <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
          This is a placeholder for {tool?.name}. In the full app, the tool itself opens here. Opening
          it is noted on your device, so Today can gently bring it back if it has been a while.
        </Text>
      </View>
    </ToolScreen>
  );
}
