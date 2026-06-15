// Runtime hex re-export from tokens/mobile.tokens.json.
//
// `tailwind.config.js` reads the same JSON for className-driven styling. This
// module exists for call sites that need a JS string value (lucide-react-native
// icon `color` prop, Expo Router `tabBarActiveTintColor`, navigation theming,
// etc.) — places where a Tailwind utility class is not applicable.
//
// Single source = the JSON. Defends rules/conventions.md #1 (cross-platform
// color sync) by ensuring no second source can drift.
//
// Reactivity: this module exports BOTH light and dark for themed leaves. Call
// sites that need a JS color string (lucide `color`, Switch `trackColor`,
// `placeholderTextColor`, SVG `fill`) must pick the active value by color scheme
// — either inline (`colorScheme === 'dark' ? colors.X.dark : colors.X.light`) or
// via the canonical `useThemeColors()` hook (lib/use-theme-colors.ts). Passing a
// `.light` value unconditionally leaves that surface stuck in light on the
// true-black canvas (a dark glyph on #000000 is ~invisible). Non-themed scales
// (charcoal, teal) carry one value per step and do NOT flip — pick a step that
// reads in both registers, or map to a themed leaf at the call site.

import tokens from '../../../tokens/mobile.tokens.json';

const c = tokens.color;

export const colors = {
  background: {
    light: c.background.light,
    dark: c.background.dark,
  },
  primary: {
    default: { light: c.primary.default.light, dark: c.primary.default.dark },
    hover: { light: c.primary.hover.light, dark: c.primary.hover.dark },
    light: { light: c.primary.light.light, dark: c.primary.light.dark },
  },
  text: {
    primary: { light: c.text.primary.light, dark: c.text.primary.dark },
    secondary: { light: c.text.secondary.light, dark: c.text.secondary.dark },
    tertiary: { light: c.text.tertiary.light, dark: c.text.tertiary.dark },
  },
  charcoal: {
    50: c.charcoal['50'],
    100: c.charcoal['100'],
    200: c.charcoal['200'],
    300: c.charcoal['300'],
    400: c.charcoal['400'],
    500: c.charcoal['500'],
    600: c.charcoal['600'],
    700: c.charcoal['700'],
    800: c.charcoal['800'],
    900: c.charcoal['900'],
    950: c.charcoal['950'],
  },
  teal: {
    50: c.teal['50'],
    100: c.teal['100'],
    400: c.teal['400'],
    500: c.teal['500'],
    600: c.teal['600'],
    700: c.teal['700'],
    900: c.teal['900'],
  },
  crisis: { light: c.crisis.red, dark: c.crisis.redDark },
} as const;
