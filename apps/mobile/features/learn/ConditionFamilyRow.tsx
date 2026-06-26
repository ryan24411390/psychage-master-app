import { ChevronDown } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import type { ConditionFamilyGroup } from '@/lib/conditions/types';
import { useHaptics } from '@/lib/haptic-context';
import { DURATION, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// One ICD-11 family in the Conditions accordion: a tappable header (family name +
// member count + chevron) and, when expanded, its member conditions. Header count
// is the member count (web parity). Each member routes to its condition guide. The
// chevron rotates 180° on expand (reduced-motion → snaps). Pure presentation; the
// open state + data are owned by the parent accordion.

type ConditionFamilyRowProps = {
  group: ConditionFamilyGroup;
  expanded: boolean;
  onToggle: () => void;
  onSelectCondition: (slug: string) => void;
};

export function ConditionFamilyRow({
  group,
  expanded,
  onToggle,
  onSelectCondition,
}: ConditionFamilyRowProps) {
  const tc = useThemeColors();
  const { fireHaptic } = useHaptics();
  const reduced = useReducedMotion();
  const rot = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    const next = expanded ? 1 : 0;
    rot.value = reduced ? next : withTiming(next, { duration: DURATION.swift });
  }, [expanded, reduced, rot]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 180}deg` }],
  }));

  return (
    <View className="border-b border-border-hairline dark:border-border-dark">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${group.family}, ${group.count} ${group.count === 1 ? 'condition' : 'conditions'}`}
        testID={`condition-family-${group.family}`}
        onPress={() => {
          fireHaptic('tab');
          onToggle();
        }}
        className="min-h-[56px] flex-row items-center gap-3 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text variant="bodyLarge" className="flex-1 text-text-primary dark:text-text-primary-dark">
          {group.family}
        </Text>
        <Text variant="body" className="text-text-tertiary dark:text-text-tertiary-dark">
          {group.count}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={tc.inkTertiary} strokeWidth={2} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <View className="pb-2">
          {group.members.map((m) => (
            <Pressable
              key={m.slug}
              accessibilityRole="button"
              accessibilityLabel={m.name}
              accessibilityHint="Opens this condition guide"
              testID={`condition-member-${m.slug}`}
              onPress={() => {
                fireHaptic('tab');
                onSelectCondition(m.slug);
              }}
              className="min-h-[44px] flex-row items-center justify-between gap-3 py-2.5 pl-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                variant="body"
                className="flex-1 text-text-secondary dark:text-text-secondary-dark"
              >
                {m.name}
              </Text>
              {m.icd11Code ? (
                <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                  {m.icd11Code}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
