import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type BodyVariant, readingBodySizeClass } from '@/lib/persistence/reading-text-size';
import { useReadingScale } from '@/lib/reading-text-size-context';

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
//
// Size is split out of the base so the four body variants can scale with the
// reading-text-size setting INSIDE a ReadingTextSizeProvider; every other variant,
// and any Text outside a provider, keeps its fixed size (the map below produces the
// exact prior classes at the 'default' size).
const variantBase: Record<TextVariant, string> = {
  body: 'font-sans text-text-primary dark:text-text-primary-dark',
  bodyMedium: 'font-sans-medium text-text-primary dark:text-text-primary-dark',
  bodyBold: 'font-sans-bold text-text-primary dark:text-text-primary-dark',
  bodySm: 'font-sans text-text-primary dark:text-text-primary-dark',
  caption: 'font-sans text-xs text-text-secondary dark:text-text-secondary-dark',
  heading: 'font-display text-xl text-text-primary dark:text-text-primary-dark',
  headingLg: 'font-display text-2xl text-text-primary dark:text-text-primary-dark',
};

const BODY_VARIANTS: readonly TextVariant[] = ['body', 'bodyMedium', 'bodyBold', 'bodySm'];

function isBodyVariant(variant: TextVariant): variant is BodyVariant {
  return BODY_VARIANTS.includes(variant);
}

export function Text({ variant = 'body', className, ...props }: TextProps) {
  const scale = useReadingScale();
  const base = variantBase[variant];
  const sized = isBodyVariant(variant)
    ? `${base} ${readingBodySizeClass(variant, scale)}`
    : base;
  const classes = className ? `${sized} ${className}` : sized;
  return <RNText className={classes} {...props} />;
}
