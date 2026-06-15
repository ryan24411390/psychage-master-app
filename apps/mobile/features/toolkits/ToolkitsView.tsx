import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { TOOLKITS_COPY } from './copy';
import { usePublishedToolkits } from './hooks';
import { ToolkitCard } from './ToolkitCard';

const t = TOOLKITS_COPY;

// Toolkits index — a 2-column grid of published toolkits read live from the shared
// Supabase. NO mock fallback: when nothing is published (or the tables are not yet
// migrated to live), the honest empty state shows. GlobalHeader keeps the crisis
// pill one tap away (SR-2).
export function ToolkitsView() {
  const { data, isLoading } = usePublishedToolkits();
  const toolkits = data ?? [];

  const openToolkit = (id: string) => router.push(`/toolkits/${id}`);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />

      <View className="flex-row items-center px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="toolkits-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1.5">
          <Text variant="headingLg">{t.title}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {t.intro}
          </Text>
        </View>

        {isLoading ? (
          <View className="items-center py-12" testID="toolkits-loading">
            <ActivityIndicator color={colors.primary.default.light} />
          </View>
        ) : toolkits.length === 0 ? (
          <View className="py-12" testID="toolkits-empty">
            <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
              {t.empty}
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {toolkits.map((toolkit) => (
              <View key={toolkit.id} className="w-[48%]">
                <ToolkitCard toolkit={toolkit} onPress={openToolkit} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
