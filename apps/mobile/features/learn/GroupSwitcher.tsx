import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';

// Horizontal segmented switcher for the Learn topic index. One pill per category
// group; the active pill is brand-filled. The group labels come verbatim from the
// taxonomy classifier (@psychage/shared/peaf) — never authored here. Those labels
// are long ("Conditions & Disorders"…), so an equal-thirds control would truncate;
// the row scrolls horizontally instead. Group selection is local UI state (not
// server data), owned by the parent's useState.

type GroupSwitcherProps = {
  groups: readonly string[];
  value: string;
  onChange: (group: string) => void;
};

export function GroupSwitcher({ groups, value, onChange }: GroupSwitcherProps) {
  const { fireHaptic } = useHaptics();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {groups.map((g) => {
        const selected = g === value;
        return (
          <Pressable
            key={g}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={g}
            onPress={() => {
              if (selected) return;
              fireHaptic('tab');
              onChange(g);
            }}
            className={[
              'min-h-[40px] items-center justify-center rounded-full border px-4',
              selected
                ? 'border-border-hairline bg-surface dark:border-border-dark dark:bg-surface-dark'
                : 'border-transparent bg-surface-active dark:bg-surface-active-dark',
            ].join(' ')}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text
              variant="body"
              numberOfLines={1}
              className={
                selected
                  ? 'font-sans-medium text-text-primary dark:text-text-primary-dark'
                  : 'font-sans-medium text-text-secondary dark:text-text-secondary-dark'
              }
            >
              {g}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
