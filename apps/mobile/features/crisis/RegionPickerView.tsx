import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchableList } from '@/components/SearchableList';
import { colors } from '@/lib/colors';

import type { RegionCode, RegionOption } from './helpline-schema';
import { CRISIS_DATASET } from './helplines.fixtures';

// S12 — the region picker (C-SEARCH-LIST), presentational. Crisis register: the
// search focus accent is INK, not teal. The choice persists and returns to S11
// (handled by the route). Rows are name-only, ≥44px, filter-as-you-type.
//
// The three chrome strings (placeholder / search label / no-match) are NOT in the
// Flow Book → clearly-flagged CT4 FIXTURES. Introduce no other strings.
const SEARCH_PLACEHOLDER = 'Search'; // FIXTURE chrome → CT4
const SEARCH_A11Y_LABEL = 'Search countries'; // FIXTURE chrome → CT4
const NO_MATCH_LABEL = 'No match'; // FIXTURE chrome → CT4

export interface RegionPickerViewProps {
  readonly regions: readonly RegionOption[];
  readonly currentRegion: RegionCode;
  readonly onSelect: (code: RegionCode) => void;
  readonly onBack: () => void;
}

export function RegionPickerView({
  regions,
  currentRegion,
  onSelect,
  onBack,
}: RegionPickerViewProps) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background px-4 dark:bg-background-dark"
    >
      <View className="pt-1 pb-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] w-11 justify-center"
        >
          <ArrowLeft size={24} color={ink} strokeWidth={2} />
        </Pressable>
      </View>

      <View className="flex-1 pt-2">
        <SearchableList
          items={regions}
          getKey={(r) => r.code}
          getLabel={(r) => r.name}
          getSecondaryLabel={(r) => {
            const count = CRISIS_DATASET.helplinesByRegion[r.code]?.length || 0;
            return count > 0 ? `${count} service${count === 1 ? '' : 's'}` : 'Emergency only';
          }}
          onSelect={(r) => onSelect(r.code)}
          accentColor={ink}
          searchPlaceholder={SEARCH_PLACEHOLDER}
          searchAccessibilityLabel={SEARCH_A11Y_LABEL}
          noMatchLabel={NO_MATCH_LABEL}
          selectedKey={currentRegion}
        />
      </View>
    </SafeAreaView>
  );
}
