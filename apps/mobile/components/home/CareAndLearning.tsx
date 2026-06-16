import { Link } from 'expo-router';
import { BookOpen, ChevronRight, HeartHandshake } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// "Care and learning" — two calm doorways (v6-r3 dest-rows). These mirror the Find
// and Learn tabs, surfaced on Today for discovery: a reading or a booking is never
// framed as immediate help (Help now stays in the header). Routes are real navigation.
type Door = {
  href: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  sub: string;
  label: string;
};

const DOORS: readonly Door[] = [
  {
    href: '/find',
    Icon: HeartHandshake,
    title: 'Find professional care',
    sub: 'Verified providers, licensed in your state',
    label: 'Find professional care',
  },
  {
    href: '/learn/browse',
    Icon: BookOpen,
    title: 'Browse the Library',
    sub: 'Plain answers, reviewed by clinicians',
    label: 'Browse the Library',
  },
];

export function CareAndLearning() {
  const c = useThemeColors();
  return (
    <View className="mt-2 gap-3">
      <Text
        variant="caption"
        className="ml-1 uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
      >
        Care and learning
      </Text>

      {DOORS.map((d) => (
        <Link key={d.href} href={d.href as any} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={d.label}
            className="min-h-[64px] flex-row items-center gap-4 rounded-xl border border-border/40 bg-surface p-4 shadow-sm active:scale-[0.99] dark:border-border-dark/40 dark:bg-surface-dark"
          >
            <d.Icon size={26} color={c.primary} />
            <View className="flex-1">
              <Text variant="h3" className="text-lg">
                {d.title}
              </Text>
              <Text
                variant="caption"
                className="mt-0.5 text-text-secondary dark:text-text-secondary-dark"
              >
                {d.sub}
              </Text>
            </View>
            <ChevronRight size={20} color={c.inkTertiary} />
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
