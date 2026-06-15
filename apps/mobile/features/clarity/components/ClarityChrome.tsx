import { ArrowLeft, LifeBuoy } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// Chrome for every Clarity surface. The flow is a pushed route OUTSIDE the tabs, so
// there is no tab bar and no GlobalHeader — the crisis "Help now" pill must be carried
// here so it stays one tap away on EVERY screen of the flow (SR-2). An optional Back
// sits on the left (omitted on the intro, where Back exits via the system gesture).
// Pill pattern mirrors features/toolkit/components/ExerciseChrome.tsx.

export interface ClarityChromeProps {
  readonly children: ReactNode;
  readonly onHelp: () => void;
  readonly onBack?: () => void;
}

export function ClarityChrome({ children, onHelp, onBack }: ClarityChromeProps) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const crisis = colorScheme === 'dark' ? colors.crisis.dark : colors.crisis.light;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-4 pt-1">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            hitSlop={8}
            className="min-h-[44px] w-11 justify-center"
          >
            <ArrowLeft size={24} color={ink} strokeWidth={2} />
          </Pressable>
        ) : (
          <View className="w-11" />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help now"
          onPress={onHelp}
          hitSlop={4}
          className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border border-crisis px-3"
        >
          <LifeBuoy size={18} color={crisis} strokeWidth={1.75} />
          <Text variant="bodyMedium" className="text-[13px] text-crisis">
            Help now
          </Text>
        </Pressable>
      </View>

      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
