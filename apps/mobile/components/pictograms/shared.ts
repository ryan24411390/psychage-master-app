// Shared contract for the four tab pictograms (C0.2). Each is a react-native-svg
// vector on a 34×34 viewBox with exactly ONE teal dot. The body "ink" follows
// the tab tint (active → text.primary, inactive → text.secondary) via the
// `color` prop the custom tab bar passes; active/inactive render the SAME glyph
// (state is the pill + ink weight, never a different icon, never a badge). The
// teal dot is constant (color.primary.default, themed so night swaps it) and is
// resolved here so all four stay identical.

import { useColorScheme } from 'nativewind';

import { colorForScheme, tabBarTokens } from '@/lib/a1-tokens';

export const PICTOGRAM_VIEWBOX = '0 0 34 34';

export type PictogramProps = {
  /** Body ink — the active/inactive tab tint passed by the tab bar. */
  color: string;
  /** Rendered square size in dp. Defaults to the tab icon size (24). */
  size?: number;
  testID?: string;
};

/** The constant teal dot color for the current OS color scheme. */
export function useTealDot(): string {
  const { colorScheme } = useColorScheme();
  return colorForScheme(tabBarTokens.color.iconTealDot, colorScheme);
}
