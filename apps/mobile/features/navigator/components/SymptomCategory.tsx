import { ChevronDown } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// Collapsible symptom-category section — mobile port of web SymptomCategory. Header
// shows the category name + selected/total count and a Select-all / Clear quick action;
// tapping the header expands/collapses the chip list. Defaults open (web parity).

export interface SymptomCategoryProps {
  readonly title: string;
  readonly total: number;
  readonly selectedCount: number;
  readonly defaultOpen?: boolean;
  readonly onSelectAll: () => void;
  readonly onClear: () => void;
  readonly children: ReactNode;
}

export function SymptomCategory({
  title,
  total,
  selectedCount,
  defaultOpen = true,
  onSelectAll,
  onClear,
  children,
}: SymptomCategoryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const tc = useThemeColors();
  const allSelected = selectedCount === total && total > 0;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${title}, ${selectedCount} of ${total} selected`}
          onPress={() => setOpen((o) => !o)}
          hitSlop={6}
          className="min-h-[44px] flex-1 flex-row items-center gap-2"
        >
          <ChevronDown
            size={18}
            color={tc.inkSecondary}
            strokeWidth={2}
            style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}
          />
          <Text variant="label">{title}</Text>
          {selectedCount > 0 ? (
            <Text variant="caption" className="text-primary dark:text-primary-dark">
              {selectedCount}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={allSelected ? `Clear ${title}` : `Select all in ${title}`}
          onPress={allSelected ? onClear : onSelectAll}
          hitSlop={6}
          className="min-h-[44px] justify-center"
        >
          <Text variant="caption" className="text-text-secondary underline dark:text-text-secondary-dark">
            {allSelected ? 'Clear' : 'Select all'}
          </Text>
        </Pressable>
      </View>
      {open ? <View className="gap-2">{children}</View> : null}
    </View>
  );
}
