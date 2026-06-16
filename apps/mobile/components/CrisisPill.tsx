import { router } from 'expo-router';
import { LifeBuoy } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// Crisis affordance (SR-2): crisis is reachable in <=1 tap from every surface.
// The one sanctioned use of the crisis color — an outline, never a red fill (not
// "red urgency"). Extracted from GlobalHeader so screens pushed OUTSIDE the tabs
// — which do NOT inherit the GlobalHeader (e.g. Sleep Architect, Toolkit) — can
// render their own pill. GlobalHeader now consumes this single source.
export function CrisisPill() {
  // Crisis ink/outline brighten to crisis-dark (#EF4444) on the true-black canvas so
  // the pill clears WCAG body contrast and keeps its urgency.
  const tc = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Help now"
      onPress={() => router.push('/crisis')}
      hitSlop={4}
      className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border border-crisis px-3 dark:border-crisis-dark"
    >
      <LifeBuoy size={18} color={tc.crisis} strokeWidth={1.75} />
      <Text variant="h6" className="text-[13px] text-crisis dark:text-crisis-dark">
        Help now
      </Text>
    </Pressable>
  );
}
