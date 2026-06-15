import { Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { CT4_RELATIONSHIP } from '../copy';
import type { RelationshipHealthResult } from '../types';

export interface HistoryViewProps {
  readonly history: RelationshipHealthResult[];
  readonly onSelect: (result: RelationshipHealthResult) => void;
  readonly onDelete: (id: string) => void;
  readonly onStartNew: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function HistoryView({ history, onSelect, onDelete, onStartNew }: HistoryViewProps) {
  const t = CT4_RELATIONSHIP.history;

  if (history.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text variant="heading" className="text-center" accessibilityRole="header">
          {t.title}
        </Text>
        <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark leading-6">
          {t.empty}
        </Text>
        <Button variant="primary" onPress={onStartNew}>
          {t.startNew}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="gap-3 pb-12 pt-2"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-baseline justify-between pt-2">
        <Text variant="heading" className="text-lg" accessibilityRole="header">
          {t.title}
        </Text>
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {t.onDevice}
        </Text>
      </View>

      {history.map((r) => (
        <Pressable
          key={r.id}
          accessibilityRole="button"
          accessibilityLabel={`${formatDate(r.createdAt)}, overall ${r.compositeScore}`}
          onPress={() => onSelect(r)}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
              {r.compositeScore}
            </Text>
          </View>
          <View className="flex-1">
            <Text variant="bodyMedium" className="text-[15px]">
              {formatDate(r.createdAt)}
            </Text>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark" numberOfLines={1}>
              {r.tierLabel}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.delete} ${formatDate(r.createdAt)}`}
            onPress={() => onDelete(r.id)}
            hitSlop={10}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
          >
            <Trash2 size={18} color={colors.charcoal[500]} strokeWidth={1.75} />
          </Pressable>
        </Pressable>
      ))}

      <Button variant="ghost" onPress={onStartNew} className="mt-2 self-center">
        {t.startNew}
      </Button>
    </ScrollView>
  );
}
