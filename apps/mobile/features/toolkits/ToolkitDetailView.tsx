import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppLoader } from '@/components/ui/AppLoader';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { TOOLKITS_COPY } from './copy';
import { ToolkitsDisclaimer } from './Disclaimer';
import { useToolkit } from './hooks';
import { ItemRow } from './ItemRow';
import type { ToolkitProgressApi } from './progress-store';
import { resolveItemRoute } from './ref-routing';
import { useToolkitSyncConsent } from './sync-consent';
import type { ItemProgress, ProgressMap, SelfRating, ToolkitItem, ToolkitItemKind } from './types';

const t = TOOLKITS_COPY;

// Display order for the grouped item sections.
const KIND_ORDER: readonly ToolkitItemKind[] = ['tool', 'article', 'strategy', 'term'];

const EMPTY_PROGRESS: ItemProgress = { opened_at: null, completed_at: null, self_rating: null };

type ToolkitDetailViewProps = {
  id: string;
  /**
   * Local-first progress store. Injected (not imported) so render tests pass an
   * in-memory double and never load the syncing singleton (which pulls in the
   * Supabase client). The route supplies the real getToolkitProgressStore().
   */
  store: ToolkitProgressApi;
};

// Toolkit detail — ADR-002 disclaimer, the consent-gated sync toggle (OFF by
// default), the intro, and items grouped by kind with optimistic per-item
// progress. Local writes are immediate; persistence + best-effort sync happen
// underneath via the injected store.
export function ToolkitDetailView({ id, store }: ToolkitDetailViewProps) {
  const { data: toolkit, isLoading } = useToolkit(id);
  const { toolkitProgressSyncConsent, setToolkitSyncConsent } = useToolkitSyncConsent();

  const [progress, setProgress] = useState<ProgressMap>({});

  // Seed optimistic progress from the store whenever the toolkit changes.
  useEffect(() => {
    setProgress(store.getForToolkit(id));
  }, [store, id]);

  const groups = useMemo(() => groupByKind(toolkit?.items ?? []), [toolkit?.items]);

  const patch = (itemId: string, next: Partial<ItemProgress>) => {
    setProgress((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? EMPTY_PROGRESS), ...next },
    }));
  };

  const onToggleDone = (item: ToolkitItem, done: boolean) => {
    patch(item.id, { completed_at: done ? nowIso() : null });
    store.setDone(item.toolkit_id, item.id, done);
  };

  const onRate = (item: ToolkitItem, rating: SelfRating) => {
    patch(item.id, { self_rating: rating });
    store.setRating(item.toolkit_id, item.id, rating);
  };

  const onOpen = (item: ToolkitItem) => {
    const route = resolveItemRoute(item);
    if (!route) return;
    patch(item.id, { opened_at: nowIso() });
    store.markOpened(item.toolkit_id, item.id);
    router.push(route);
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />

      <View className="flex-row items-center px-2">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="toolkit-detail-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </AnimatedPressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center" testID="toolkit-detail-loading">
          <AppLoader />
        </View>
      ) : !toolkit ? (
        <View className="flex-1 items-center justify-center px-6" testID="toolkit-detail-missing">
          <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
            {t.notFound}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <ToolkitsDisclaimer />

          <View className="gap-1.5">
            <Text variant="headingLg">{toolkit.theme_title}</Text>
            {toolkit.clinical_subtitle ? (
              <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
                {toolkit.clinical_subtitle}
              </Text>
            ) : null}
          </View>

          <SettingsToggleRow
            label={t.syncLabel}
            description={t.syncDescription}
            value={toolkitProgressSyncConsent}
            onValueChange={setToolkitSyncConsent}
            testID="toolkit-sync-consent-toggle"
          />

          {toolkit.intro_md ? (
            <View className="gap-1.5">
              <Text variant="bodyMedium">{t.introHeading}</Text>
              {toParagraphs(toolkit.intro_md).map((para) => (
                <Text
                  key={para}
                  variant="body"
                  className="text-text-secondary dark:text-text-secondary-dark"
                >
                  {para}
                </Text>
              ))}
            </View>
          ) : null}

          {groups.map(({ kind, items }) => (
            <View key={kind} className="gap-2">
              <Text variant="bodyMedium">{t.groupLabel[kind]}</Text>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  progress={progress[item.id]}
                  onOpen={onOpen}
                  onToggleDone={onToggleDone}
                  onRate={onRate}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function toParagraphs(md: string): string[] {
  return md
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function groupByKind(
  items: readonly ToolkitItem[],
): Array<{ kind: ToolkitItemKind; items: ToolkitItem[] }> {
  const byKind = new Map<ToolkitItemKind, ToolkitItem[]>();
  for (const item of items) {
    const bucket = byKind.get(item.kind);
    if (bucket) bucket.push(item);
    else byKind.set(item.kind, [item]);
  }
  return KIND_ORDER.filter((kind) => byKind.has(kind)).map((kind) => ({
    kind,
    items: byKind.get(kind) ?? [],
  }));
}
