import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import type { PasswordStrength, StrengthLevel } from '@/features/auth/validate';

// DISPLAY-ONLY meter (Amendment 2026-06-16 / rules/auth.md §9). It informs; it never
// gates — validatePassword (min length 8) is the only gate (NIST SP 800-63B). Four
// segments fill to `strength.score`; colour tracks the level. Calm, no animation
// (auth-is-calm). Hidden entirely when the field is empty so it never nags up-front.

const SEGMENTS = [0, 1, 2, 3] as const;

// Filled-segment colour per level. Track stays neutral. error → weak, warning → fair/good,
// success → strong (all semantic tokens carry light/dark variants).
const FILL_CLASS: Record<Exclude<StrengthLevel, 'empty'>, string> = {
  weak: 'bg-error dark:bg-error-dark',
  fair: 'bg-warning dark:bg-warning-dark',
  good: 'bg-warning dark:bg-warning-dark',
  strong: 'bg-success dark:bg-success-dark',
};

const LABEL: Record<Exclude<StrengthLevel, 'empty'>, string> = {
  weak: AUTH_COPY.strengthWeak,
  fair: AUTH_COPY.strengthFair,
  good: AUTH_COPY.strengthGood,
  strong: AUTH_COPY.strengthStrong,
};

export function PasswordStrengthMeter({ strength }: { strength: PasswordStrength }) {
  if (strength.level === 'empty') return null;
  const fill = FILL_CLASS[strength.level];
  const label = LABEL[strength.level];

  return (
    <View
      className="gap-1.5"
      accessibilityRole="text"
      accessibilityLabel={`${AUTH_COPY.strengthLabel}: ${label}`}
    >
      <View className="flex-row gap-1.5">
        {SEGMENTS.map((index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < strength.score ? fill : 'bg-border/50 dark:bg-border-dark/50'
            }`}
          />
        ))}
      </View>
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {AUTH_COPY.strengthLabel}: {label}
      </Text>
    </View>
  );
}
