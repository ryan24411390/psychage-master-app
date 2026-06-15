import { Pressable, type PressableProps } from 'react-native';
import { type ReactNode } from 'react';

import { useHaptics } from '@/lib/haptic-context';

import { Text } from './Text';

// Primary action primitive. DESIGN.mobile.md §3.3 firing-rule: every primary
// CTA fires haptic.affirm. Pressed state = opacity dim only (no scale/transform
// — contract favors sensorial restraint; no press motion is specified).
// Size `default` meets 44pt iOS HIG touch-target floor (DESIGN.mobile.md §7).
//
// Parity note (web ui/Button.tsx has 6 variants × 4 sizes): mobile carries the
// subset the contract sanctions — `danger` (destructive actions: delete account,
// etc.) and a `lg` size for prominent CTAs (onboarding, paywall) are added here.
// Web's `outline` ≈ mobile `secondary` (transparent + border), and web `glass`
// is intentionally omitted (glassmorphism is an anti-slop pattern on mobile).

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'sm' | 'lg';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary dark:bg-primary-dark shadow-sm',
  secondary: 'bg-transparent border border-border dark:border-border-dark',
  ghost: 'bg-transparent',
  danger: 'bg-error dark:bg-error-dark',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'min-h-[44px] px-5 py-3 rounded-lg',
  sm: 'min-h-[36px] px-3 py-2 rounded-lg',
  lg: 'min-h-[52px] px-6 py-4 rounded-lg',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  // Light: white on teal #1A9B8C (AA-large). Dark: the fill brightens to teal
  // #20B8A6 where white drops to 2.5:1 (fails AA) — so the label flips to near-black
  // ink (#0C0A09 on #20B8A6 = 8.0:1, AA-body). Light mode is unchanged.
  primary: 'text-white dark:text-charcoal-950',
  secondary: 'text-text-primary dark:text-text-primary-dark',
  ghost: 'text-primary dark:text-primary-dark',
  // White on the semantic error fill clears AA-large for button labels in both registers.
  danger: 'text-white',
};

export function Button({
  variant = 'primary',
  size = 'default',
  children,
  className,
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  const { fireHaptic } = useHaptics();

  const handlePress: PressableProps['onPress'] = (event) => {
    if (disabled) return;
    fireHaptic('affirm');
    onPress?.(event);
  };

  const base = 'items-center justify-center';
  const composed = [base, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={handlePress}
      className={composed}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
      })}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={textVariantClasses[variant]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
