import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { useHaptics } from '@/lib/haptic-context';

import { TOOLKITS_COPY } from './copy';
import { resolveItemRoute } from './ref-routing';
import type { ItemProgress, SelfRating, ToolkitItem } from './types';

const t = TOOLKITS_COPY;

type ItemRowProps = {
  item: ToolkitItem;
  progress: ItemProgress | undefined;
  onOpen: (item: ToolkitItem) => void;
  onToggleDone: (item: ToolkitItem, done: boolean) => void;
  onRate: (item: ToolkitItem, rating: SelfRating) => void;
};

// One toolkit item: a done toggle, the label + kind, an Open action (disabled
// "Coming soon" when no mobile surface exists yet), and a gentle, non-numeric
// "was this helpful?" self-rating. All progress is optimistic — the parent updates
// local state immediately and persists/syncs underneath.
export function ItemRow({ item, progress, onOpen, onToggleDone, onRate }: ItemRowProps) {
  const { colorScheme } = useColorScheme();
  // Glyph ink on the teal "done" fill, mirroring Button's primary-label contract:
  // near-white in light, charcoal in dark (where the teal fill brightens).
  const onPrimary = colorScheme === 'dark' ? colors.charcoal[950] : colors.charcoal[50];
  const { fireHaptic } = useHaptics();
  const route = resolveItemRoute(item);
  const comingSoon = route === null;
  const done = Boolean(progress?.completed_at);
  const rating = progress?.self_rating ?? null;

  const toggleDone = () => {
    fireHaptic('affirm');
    onToggleDone(item, !done);
  };

  return (
    <View
      testID={`toolkit-item-${item.id}`}
      className="gap-3 rounded-xl border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? t.done : t.markDone}
          onPress={toggleDone}
          hitSlop={8}
          testID={`toolkit-item-done-${item.id}`}
          className={`h-6 w-6 items-center justify-center rounded-full border ${
            done
              ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
              : 'border-border dark:border-border-dark'
          }`}
        >
          {done ? <Check size={14} color={onPrimary} strokeWidth={3} /> : null}
        </Pressable>

        <View className="flex-1 gap-1">
          <Text variant="bodyMedium" numberOfLines={2}>
            {item.label}
          </Text>
          <Badge variant="neutral">{t.kindLabel[item.kind]}</Badge>
        </View>

        <Button
          variant="secondary"
          size="sm"
          disabled={comingSoon}
          onPress={() => onOpen(item)}
          testID={`toolkit-item-open-${item.id}`}
        >
          {comingSoon ? t.comingSoon : t.open}
        </Button>
      </View>

      <View className="flex-row items-center gap-2">
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {t.helpfulPrompt}
        </Text>
        <RatingChip
          label={t.helpfulALittle}
          selected={rating === 'a_little'}
          onPress={() => onRate(item, 'a_little')}
          testID={`toolkit-item-rate-a-little-${item.id}`}
        />
        <RatingChip
          label={t.helpfulNotYet}
          selected={rating === 'not_yet'}
          onPress={() => onRate(item, 'not_yet')}
          testID={`toolkit-item-rate-not-yet-${item.id}`}
        />
      </View>
    </View>
  );
}

function RatingChip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { fireHaptic } = useHaptics();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        fireHaptic('affirm');
        onPress();
      }}
      testID={testID}
      className={`min-h-[36px] justify-center rounded-full px-3 py-1.5 ${
        selected
          ? 'bg-primary-light dark:bg-primary-light-dark'
          : 'border border-border dark:border-border-dark'
      }`}
    >
      <Text
        variant="caption"
        className={
          selected
            ? 'font-sans-medium text-primary dark:text-primary-dark'
            : 'text-text-secondary dark:text-text-secondary-dark'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
