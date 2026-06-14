import { LifeBuoy, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// Chrome-minimal exercise surface (D-10). The flow is a pushed route OUTSIDE the tabs,
// so there is no tab bar; the only persistent chrome is the Help-now pill (crisis stays
// reachable on every exercise surface). An optional quiet close (X) finishes the
// session. Wave-owned minimal pill (A1's GlobalHeader is read-only).

export interface ExerciseChromeProps {
  readonly children: ReactNode;
  readonly onHelp: () => void;
  readonly onClose?: () => void;
}

export function ExerciseChrome({ children, onHelp, onClose }: ExerciseChromeProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-4 pt-1">
        {onClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}
            className="min-h-[44px] w-11 justify-center"
          >
            <X size={22} color={colors.charcoal[600]} strokeWidth={1.75} />
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
          <LifeBuoy size={18} color={colors.crisis} strokeWidth={1.75} />
          <Text variant="bodyMedium" className="text-[13px] text-crisis">
            Help now
          </Text>
        </Pressable>
      </View>

      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
