import { LifeBuoy, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

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
  // Close glyph → secondary ink (flips to a visible light grey on black); crisis
  // ink/outline → crisis-dark on the true-black canvas (legible + urgent).
  const tc = useThemeColors();
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-4 pt-1">
        {onClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}
            className="min-h-[44px] w-11 justify-center active:scale-[0.96]"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <X size={22} color={tc.inkSecondary} strokeWidth={1.75} />
          </Pressable>
        ) : (
          <View className="w-11" />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help now"
          onPress={onHelp}
          hitSlop={8}
          className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border border-crisis px-4 active:scale-[0.96] dark:border-crisis-dark"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <LifeBuoy size={18} color={tc.crisis} strokeWidth={1.75} />
          <Text variant="h6" className="text-[13px] text-crisis dark:text-crisis-dark">
            Help now
          </Text>
        </Pressable>
      </View>

      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
