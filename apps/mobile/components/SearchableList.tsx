import { FlashList } from '@shopify/flash-list';
import { Check, Search, XCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useMemo, useState, useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/lib/colors';
import { useReducedMotion } from '@/lib/motion';

// C-SEARCH-LIST (Wave A2, wave-owned). A searchable, filter-as-you-type list of
// name-only rows. The focus accent is PARAMETERIZED: the crisis region picker (S12)
// passes INK (not teal — no teal in the crisis register); the Navigator's "Something
// else" search (S14) passes tealDeep. Generic over the row type so both screens reuse
// it without a shared cross-wave file.
//
// Backed by FlashList (per stack rule: FlashList for any list >20 items) now that the
// CT3 region roster carries ~70 countries. Rows ≥44px. No match-highlighting (plain
// substring filter). Tapping a row selects. `searchPlaceholder` / `noMatchLabel` are
// chrome strings the Flow Book does not supply — callers pass clearly-flagged CT4
// fixtures.

export interface SearchableListProps<T> {
  readonly items: readonly T[];
  readonly getKey: (item: T) => string;
  readonly getLabel: (item: T) => string;
  readonly getSecondaryLabel?: (item: T) => string;
  readonly onSelect: (item: T) => void;
  /** Focus-ring color (resolved string). Crisis = ink; Navigator = tealDeep. */
  readonly accentColor: string;
  readonly searchPlaceholder: string;
  readonly searchAccessibilityLabel: string;
  readonly noMatchLabel: string;
  readonly selectedKey?: string;
}

export function SearchableList<T>({
  items,
  getKey,
  getLabel,
  onSelect,
  accentColor,
  searchPlaceholder,
  searchAccessibilityLabel,
  noMatchLabel,
  selectedKey,
  getSecondaryLabel,
}: SearchableListProps<T>) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { colorScheme } = useColorScheme();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, query, getLabel]);

  // Focus color transition
  const focusAnim = useSharedValue(0);
  const defaultBorder = colorScheme === 'dark' ? '#3f3f46' : '#e7e5e4';

  useEffect(() => {
    focusAnim.value = withTiming(focused ? 1 : 0, { duration: 150 });
  }, [focused, focusAnim]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [defaultBorder, accentColor]
      ),
    };
  });

  return (
    <View className="flex-1">
      <Animated.View
        className="mb-3 flex-row items-center gap-2 rounded-lg border bg-surface px-3 dark:bg-surface-dark"
        style={animatedContainerStyle}
      >
        <Search size={18} color={colors.charcoal[400]} strokeWidth={1.75} />
        <TextInput
          accessibilityLabel={searchAccessibilityLabel}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.charcoal[400]}
          autoCorrect={false}
          autoCapitalize="none"
          className="min-h-[44px] flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark"
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery('')}
            hitSlop={8}
            className="p-1"
          >
            <XCircle size={18} color={colors.charcoal[400]} strokeWidth={1.75} />
          </Pressable>
        )}
      </Animated.View>

      <FlashList
        data={filtered}
        // @ts-expect-error - FlashList JSX children typing mismatch under React 19
        estimatedItemSize={44}
        keyExtractor={getKey}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-10 px-4">
            <Search size={32} color={colors.charcoal[300]} strokeWidth={1.5} className="mb-3 opacity-50" />
            <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
              {noMatchLabel}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const selected = selectedKey !== undefined && getKey(item) === selectedKey;
          const entering =
            !reduced && index < 8
              ? FadeInDown.delay(index * 35).duration(200)
              : undefined;

          return (
            <Animated.View entering={entering}>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(item)}
                className="min-h-[44px] flex-row items-center justify-between border-b border-border py-3 dark:border-border-dark gap-3"
                scaleTo={0.98}
                springPreset="subtle"
                style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="flex-1 flex-row items-center justify-between pr-2">
                  <Text variant={selected ? 'bodyLarge' : 'body'} className="flex-shrink">
                    {getLabel(item)}
                  </Text>
                  {getSecondaryLabel ? (
                    <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark flex-shrink-0 ml-2">
                      {getSecondaryLabel(item)}
                    </Text>
                  ) : null}
                </View>
                {selected ? <Check size={18} color={accentColor} strokeWidth={2} /> : <View style={{ width: 18 }} />}
              </AnimatedPressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}
