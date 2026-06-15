import { ChevronLeft, LifeBuoy } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { CT4_RELATIONSHIP } from '../copy';

// Chrome for the Relationship Health flow. The flow is a pushed route OUTSIDE the
// tabs, so there is no GlobalHeader — the Help-now pill is carried here so crisis
// support stays reachable on EVERY screen of the flow (SR-2). Back (left) returns
// one step within the flow; Help-now (right) routes to /crisis.

export interface RelationshipChromeProps {
  readonly children: ReactNode;
  readonly onBack: () => void;
  readonly onHelp: () => void;
  /** Hide the back affordance (e.g. on the landing screen the back exits the flow). */
  readonly backLabel?: string;
}

export function RelationshipChrome({ children, onBack, onHelp, backLabel }: RelationshipChromeProps) {
  const t = CT4_RELATIONSHIP;
  const tc = useThemeColors();
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-4 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel ?? t.back}
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] flex-row items-center gap-1 pr-2"
        >
          <ChevronLeft size={22} color={tc.inkSecondary} strokeWidth={1.75} />
          <Text variant="bodyMedium" className="text-[15px] text-text-secondary dark:text-text-secondary-dark">
            {backLabel ?? t.back}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.helpNow}
          onPress={onHelp}
          hitSlop={4}
          className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border border-crisis px-3"
        >
          <LifeBuoy size={18} color={tc.crisis} strokeWidth={1.75} />
          <Text variant="bodyMedium" className="text-[13px] text-crisis">
            {t.helpNow}
          </Text>
        </Pressable>
      </View>

      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
