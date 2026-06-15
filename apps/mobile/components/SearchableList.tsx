import { FlashList } from '@shopify/flash-list';
import { Check, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

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
}: SearchableListProps<T>) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, query, getLabel]);

  return (
    <View className="flex-1">
      <View
        className="mb-3 flex-row items-center gap-2 rounded-lg border border-border bg-surface px-3 dark:border-border-dark dark:bg-surface-dark"
        style={focused ? { borderColor: accentColor } : undefined}
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
      </View>

      <FlashList
        data={filtered}
        keyExtractor={getKey}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text variant="body" className="px-1 py-3 text-text-secondary dark:text-text-secondary-dark">
            {noMatchLabel}
          </Text>
        }
        renderItem={({ item }) => {
          const selected = selectedKey !== undefined && getKey(item) === selectedKey;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(item)}
              className="min-h-[44px] flex-row items-center justify-between border-b border-border py-2 dark:border-border-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text variant={selected ? 'bodyMedium' : 'body'}>{getLabel(item)}</Text>
              {selected ? <Check size={18} color={accentColor} strokeWidth={2} /> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
