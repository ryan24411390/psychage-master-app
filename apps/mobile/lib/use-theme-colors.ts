// Canonical scheme-resolved color hook for JS color props.
//
// `dark:` Tailwind variants cover className styling, but lucide `color`, Switch
// `trackColor`, `placeholderTextColor`, and SVG `fill` take raw strings that a
// className can't reach. This hook resolves the themed semantic leaves against
// NativeWind's active color scheme so those props flip on the true-black canvas.
//
// Returns light values verbatim (so light mode is unchanged) and the dark leaves
// on the dark register. Older call sites use the equivalent inline form
// (`colorScheme === 'dark' ? colors.X.dark : colors.X.light`); both are fine —
// this is the boilerplate-free version for new/updated sites.

import { useColorScheme } from 'nativewind';

import { colors } from '@/lib/colors';

export interface ThemeColors {
  /** Primary ink — #0a0a0a light / #FFFFFF dark. */
  readonly ink: string;
  /** Secondary ink — de-emphasized glyphs/labels. */
  readonly inkSecondary: string;
  /** Tertiary ink — placeholders, faint glyphs. */
  readonly inkTertiary: string;
  /** Brand teal accent (themed). */
  readonly primary: string;
  /** Crisis red — #DC2626 light / #EF4444 dark (legible + urgent on black). */
  readonly crisis: string;
}

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  return {
    ink: dark ? colors.text.primary.dark : colors.text.primary.light,
    inkSecondary: dark ? colors.text.secondary.dark : colors.text.secondary.light,
    inkTertiary: dark ? colors.text.tertiary.dark : colors.text.tertiary.light,
    primary: dark ? colors.primary.default.dark : colors.primary.default.light,
    crisis: dark ? colors.crisis.dark : colors.crisis.light,
  };
}
