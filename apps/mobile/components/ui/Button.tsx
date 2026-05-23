import { Pressable, type PressableProps } from 'react-native';
import { type ReactNode } from 'react';

import { useHaptics } from '@/lib/haptic-context';

import { Text } from './Text';

// Primary action primitive. DESIGN.mobile.md §3.3 firing-rule: every primary
// CTA fires haptic.affirm. Pressed state = opacity dim only (no scale/transform
// — contract favors sensorial restraint; no press motion is specified).
// Size `default` meets 44pt iOS HIG touch-target floor (DESIGN.mobile.md §7).

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'default' | 'sm';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary dark:bg-primary-dark',
  secondary: 'bg-transparent border border-border dark:border-border-dark',
  ghost: 'bg-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'min-h-[44px] px-5 py-3 rounded-lg',
  sm: 'min-h-[36px] px-3 py-2 rounded-lg',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-text-primary dark:text-text-primary-dark',
  ghost: 'text-primary dark:text-primary-dark',
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
      style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}
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
