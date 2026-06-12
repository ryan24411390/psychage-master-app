import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

// Typography primitive. Slice-8 calibration anchor — when type tokens land
// (tokens/mobile.tokens.json type.size/weight/leading/tracking, currently
// _omitted), the variant→class mapping below is the single edit point.
// Until then, primitives use interim Tailwind defaults. The font family is
// token-wired via tailwind.config.js fontFamily.

export type TextVariant =
  | 'body'
  | 'bodyMedium'
  | 'bodyBold'
  | 'bodySm'
  | 'heading'
  | 'headingLg'
  | 'caption';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
};

// Weight is selected by font family, not RN fontWeight — custom-cut fonts on iOS
// ignore numeric fontWeight, so weight-utility classes are no-ops here. The
// 500/700 IBM Plex faces are reached via the sans-medium/sans-bold families
// (tailwind.config.js → tokens type.family.sansMedium/sansBold). Display stays
// Fraunces 600 only — no additional Fraunces weight is loaded.
const variantClasses: Record<TextVariant, string> = {
  body: 'font-sans text-base text-text-primary dark:text-text-primary-dark',
  bodyMedium: 'font-sans-medium text-base text-text-primary dark:text-text-primary-dark',
  bodyBold: 'font-sans-bold text-base text-text-primary dark:text-text-primary-dark',
  bodySm: 'font-sans text-sm text-text-primary dark:text-text-primary-dark',
  caption: 'font-sans text-xs text-text-secondary dark:text-text-secondary-dark',
  heading: 'font-display text-xl text-text-primary dark:text-text-primary-dark',
  headingLg: 'font-display text-2xl text-text-primary dark:text-text-primary-dark',
};

export function Text({ variant = 'body', className, ...props }: TextProps) {
  const classes = className
    ? `${variantClasses[variant]} ${className}`
    : variantClasses[variant];
  return <RNText className={classes} {...props} />;
}
