import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

// Surface primitive — mobile port of web components/ui/Card.tsx (parity remediation).
// Web anatomy kept 1:1 (rounded-xl, p-6, Header/Body/Footer/Icon sub-components),
// with two deliberate mobile adaptations:
//   • ELEVATION = border, not shadow. tokens/mobile.tokens.json ships no shadow family
//     (DESIGN.mobile.md §1.4/§1.6 — mobile elevates via motion/haptic, not visual layering),
//     so web's `shadow-sm` becomes bg-surface + border-border. Dark stays true-black.
//   • NO hover/`glass` variant. Touch has no hover; web `glass` (glassmorphism) is an
//     anti-slop pattern on mobile. Web's 4th variant maps to `accent` (tinted surface).
// Radius `xl` per DESIGN.mobile.md §1.4 (cards/surfaces/panels = xl).

export type CardVariant = 'default' | 'elevated' | 'accent' | 'outline' | 'ghost';

type CardProps = ViewProps & {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
};

// Variants match the mobile app's established inline card grammar so adoption is
// visually lossless: `default` = the plain surface card (border-border, no shadow),
// `elevated` = the softer raised tile (border/50 + shadow-sm) used by Learn/Compass
// and most tap targets. Padding default is `p-4` (mobile 8pt-grid card density);
// callers pass px-/py- overrides for the few denser/looser one-offs.
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface dark:bg-surface-dark border border-border dark:border-border-dark',
  elevated:
    'bg-surface dark:bg-surface-dark border border-border/50 dark:border-border-dark/50 shadow-sm',
  accent:
    'bg-surface-accent dark:bg-surface-accent-dark border border-border dark:border-border-dark',
  outline: 'bg-transparent border border-border dark:border-border-dark',
  ghost: 'bg-transparent',
};

export function Card({ variant = 'default', children, className, ...props }: CardProps) {
  const composed = ['rounded-xl p-4', variantClasses[variant], className].filter(Boolean).join(' ');
  return (
    <View className={composed} {...props}>
      {children}
    </View>
  );
}

// flex-row: web CardHeader/Footer are `flex items-center` (row); RN View defaults to column.
export function CardHeader({ children, className, ...props }: ViewProps & { children: ReactNode }) {
  const composed = ['flex-row items-center gap-3 mb-4', className].filter(Boolean).join(' ');
  return (
    <View className={composed} {...props}>
      {children}
    </View>
  );
}

export function CardBody({ children, className, ...props }: ViewProps & { children: ReactNode }) {
  const composed = ['flex-1', className].filter(Boolean).join(' ');
  return (
    <View className={composed} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className, ...props }: ViewProps & { children: ReactNode }) {
  const composed = ['flex-row items-center gap-3 mt-4 pt-4 border-t border-border dark:border-border-dark', className]
    .filter(Boolean)
    .join(' ');
  return (
    <View className={composed} {...props}>
      {children}
    </View>
  );
}

// Icon chest — web uses a color-mix teal tint; mobile uses the themed primary-light token.
export function CardIcon({ children, className, ...props }: ViewProps & { children: ReactNode }) {
  const composed = [
    'w-10 h-10 rounded-xl items-center justify-center shrink-0 bg-primary-light dark:bg-primary-light-dark',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <View className={composed} {...props}>
      {children}
    </View>
  );
}
