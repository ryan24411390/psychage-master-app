import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type BodyVariant, readingBodySizeClass } from '@/lib/persistence/reading-text-size';
import { useReadingScale } from '@/lib/reading-text-size-context';

// Typography primitive. Slice-8 calibration anchor — when type tokens land
// (tokens/mobile.tokens.json type.size/weight/leading/tracking, currently
// _omitted), the variant→class mapping below is the single edit point.
// Until then, primitives use interim Tailwind defaults. The font family is
// token-wired via tailwind.config.js fontFamily.

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button';

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
  display: 'font-display text-5xl tracking-tighter text-text-primary dark:text-text-primary-dark',
  h1: 'font-display text-4xl tracking-tighter text-text-primary dark:text-text-primary-dark',
  h2: 'font-display text-3xl tracking-tight text-text-primary dark:text-text-primary-dark',
  h3: 'font-display text-2xl tracking-tight text-text-primary dark:text-text-primary-dark',
  h4: 'font-sans-medium text-xl leading-tight tracking-normal text-text-primary dark:text-text-primary-dark',
  h5: 'font-sans-medium text-lg leading-tight tracking-normal text-text-primary dark:text-text-primary-dark',
  h6: 'font-sans-medium text-base tracking-normal text-text-primary dark:text-text-primary-dark',
  bodyLarge: 'font-sans text-text-primary dark:text-text-primary-dark',
  body: 'font-sans text-text-primary dark:text-text-primary-dark',
  bodySmall: 'font-sans text-text-primary dark:text-text-primary-dark',
  caption: 'font-sans text-xs tracking-wider text-text-secondary dark:text-text-secondary-dark',
  button: 'font-sans-medium text-base tracking-normal text-text-primary dark:text-text-primary-dark',
};

const BODY_VARIANTS: readonly TextVariant[] = ['bodyLarge', 'body', 'bodySmall'];

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
