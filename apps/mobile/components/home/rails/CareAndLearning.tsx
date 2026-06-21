import type { ElementType } from 'react';
import { router } from 'expo-router';
import { BookOpen, ChevronRight, Stethoscope } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// "Care & learning" — the two outward doorways at the foot of Today. Each row is one
// accessible pressable into an existing destination (Find Care tab · Library). The
// provider count is framed as the NPI registry source — never "verified" by Psychage
// (P33): Psychage does not vet or endorse providers, matching the Find Care surface.
type DoorwayProps = {
  icon: ElementType;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
};

function Doorway({ icon: Icon, title, subtitle, onPress, testID }: DoorwayProps) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      testID={testID}
      className="min-h-[44px] flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm active:scale-[0.99] dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-accent/40 dark:bg-surface-accent-dark/20">
        <Icon size={20} color={c.primary} strokeWidth={1.75} />
      </View>
      <View className="flex-1">
        <Text variant="label" className="text-text-primary dark:text-text-primary-dark">
          {title}
        </Text>
        <Text variant="caption" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
          {subtitle}
        </Text>
      </View>
      <ChevronRight
        size={18}
        color={c.inkTertiary}
        strokeWidth={1.75}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

export function CareAndLearning() {
  return (
    <View className="mt-6 gap-3">
      <Text variant="h2" className="ml-1 mb-1">
        Care &amp; learning
      </Text>
      <Doorway
        icon={Stethoscope}
        title="Find professional care"
        subtitle="400,000+ providers from the NPI registry"
        onPress={() => router.push('/find')}
        testID="care-find"
      />
      <Doorway
        icon={BookOpen}
        title="Browse the Library"
        subtitle="Plain answers, reviewed by clinicians"
        onPress={() => router.push('/library')}
        testID="care-library"
      />
    </View>
  );
}
