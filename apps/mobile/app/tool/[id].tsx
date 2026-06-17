import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { toolUsageStore, type ToolId, TOOLS } from '@/lib/tool-usage-store';

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id && TOOLS[id as ToolId]) {
      toolUsageStore.recordUse(id as ToolId);
    }
  }, [id]);

  const tool = TOOLS[id as ToolId];

  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark p-6 gap-6">
      <Text variant="h1">{tool ? tool.name : 'Tool Not Found'}</Text>
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        This is a placeholder for {tool?.name}. In the full app, the tool itself opens here. Opening
        it is noted on your device, so Today can gently bring it back if it has been a while.
      </Text>
      <Button variant="secondary" onPress={() => router.back()}>
        Back to Today
      </Button>
    </View>
  );
}
