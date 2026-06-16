import { RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { getTierHexColor } from '../scoring';
import type { ClarityHistoryItem, ClarityScoreResult, DomainKey, Recommendation } from '../types';
import { CrisisUrgentBanner } from './CrisisUrgentBanner';
import { TierBadge } from './TierBadge';
import { DimensionsTab } from './tabs/DimensionsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { OverviewTab } from './tabs/OverviewTab';
import { ScoreGuideTab } from './tabs/ScoreGuideTab';

// ClarityResultsDashboard — the results surface, a faithful RN port of the web
// ClarityResultsDashboard: a score banner (raw 0–100 number, tier badge, retake),
// a 4-tab bar with an animated underline, and the active tab's content. Everything
// scrolls together. The web-parity override surfaces the raw number + hard tier labels
// (Sacred Rule #2 release gate — see types.ts).

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'dimensions', label: 'Dimensions' },
  { id: 'guide', label: 'Score Guide' },
  { id: 'history', label: 'History' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export interface ClarityResultsDashboardProps {
  readonly results: ClarityScoreResult;
  readonly recommendations: Recommendation[];
  readonly history: ClarityHistoryItem[];
  readonly onRetake: () => void;
  readonly onRecommend: (route: string) => void;
}

export function ClarityResultsDashboard({
  results,
  recommendations,
  history,
  onRetake,
  onRecommend,
}: ClarityResultsDashboardProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const tierHex = getTierHexColor(results.tier);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [initialDimension, setInitialDimension] = useState<DomainKey | undefined>();
  const [barWidth, setBarWidth] = useState(0);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const tabWidth = barWidth / TABS.length;

  const tx = useSharedValue(0);
  useEffect(() => {
    const target = activeIndex * tabWidth;
    tx.value = reduced ? target : withSpring(target, { stiffness: 400, damping: 30 });
  }, [activeIndex, tabWidth, reduced, tx]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    width: tabWidth || 0,
  }));

  const handleNavigateToDimension = (key: DomainKey) => {
    setInitialDimension(key);
    setActiveTab('dimensions');
  };

  return (
    <ScrollView contentContainerClassName="px-4 pb-12 pt-2" showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View className="rounded-t-2xl border border-border bg-surface px-5 py-8 dark:border-border-dark dark:bg-surface-dark">
        <View className="flex-row items-end justify-between">
          <View>
            <Text variant="caption" className="mb-2 text-text-secondary dark:text-text-secondary-dark">
              YOUR CLARITY SCORE
            </Text>
            <View className="flex-row items-baseline gap-2">
              <Text style={{ fontSize: 64, fontWeight: '700', color: tierHex, lineHeight: 68 }}>
                {results.totalScore}
              </Text>
              <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
                / 100
              </Text>
            </View>
            <View className="mt-2">
              <TierBadge tier={results.tier} label={results.label} size="lg" />
              <Text variant="caption" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
                Assessment complete
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retake assessment"
            onPress={onRetake}
            hitSlop={8}
            className="min-h-[44px] flex-row items-center gap-1.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <RefreshCw size={14} color={tc.inkSecondary} />
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              Retake
            </Text>
          </Pressable>
        </View>

        {results.tier === 'crisis' ? <CrisisUrgentBanner /> : null}
      </View>

      {/* Tab bar */}
      <View
        className="flex-row border-x border-b border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
        onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(tab.id)}
              className="min-h-[44px] flex-1 items-center justify-center px-2 py-3"
            >
              <Text
                variant={isActive ? 'bodyMedium' : 'bodySm'}
                style={{ color: isActive ? tc.ink : tc.inkSecondary, fontSize: 13 }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        {/* Animated underline indicator */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', bottom: 0, left: 0, height: 2, backgroundColor: tc.ink }, indicatorStyle]}
        />
      </View>

      {/* Active tab content */}
      <View className="pt-8">
        {activeTab === 'overview' ? (
          <OverviewTab
            results={results}
            recommendations={recommendations}
            onNavigateToDimension={handleNavigateToDimension}
            onRecommend={onRecommend}
          />
        ) : null}
        {activeTab === 'dimensions' ? (
          <DimensionsTab results={results} initialDimension={initialDimension} />
        ) : null}
        {activeTab === 'guide' ? <ScoreGuideTab currentTier={results.tier} /> : null}
        {activeTab === 'history' ? <HistoryTab history={history} currentResult={results} /> : null}
      </View>

      {/* First-mount fade of the whole surface (matches the web's results entrance). */}
      {reduced ? null : <Animated.View entering={FadeIn.duration(300)} pointerEvents="none" />}
    </ScrollView>
  );
}
