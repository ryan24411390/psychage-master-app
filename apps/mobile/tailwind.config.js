/** @type {import('tailwindcss').Config} */

const tokens = require('../../tokens/mobile.tokens.json');
const c = tokens.color;

// Themed leaves are flattened into `<name>` (light) + `<name>-dark` Tailwind utility
// keys. Primitives compose with NativeWind's `dark:` media variant — e.g.
// `bg-background dark:bg-background-dark`. Non-themed scales (charcoal, teal,
// relevance, crisis, mood) carry a single value per step. See plan §3 for the
// "OS-driven dark via flattened pairs" decision and §4 for the rationale against
// HSL CSS-var theming (RNR default template).
//
// Type-scale and spacing are NOT extended — `tokens/mobile.tokens.json` ships
// `type._omitted` and `spacing._omitted` until first-screen calibration in
// Slice 8. Primitives use interim Tailwind defaults until then.

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: c.background.light,
          dark: c.background.dark,
        },
        surface: {
          DEFAULT: c.surface.default.light,
          dark: c.surface.default.dark,
          hover: c.surface.hover.light,
          'hover-dark': c.surface.hover.dark,
          active: c.surface.active.light,
          'active-dark': c.surface.active.dark,
        },
        primary: {
          DEFAULT: c.primary.default.light,
          dark: c.primary.default.dark,
          hover: c.primary.hover.light,
          'hover-dark': c.primary.hover.dark,
          light: c.primary.light.light,
          'light-dark': c.primary.light.dark,
        },
        text: {
          primary: c.text.primary.light,
          'primary-dark': c.text.primary.dark,
          secondary: c.text.secondary.light,
          'secondary-dark': c.text.secondary.dark,
          tertiary: c.text.tertiary.light,
          'tertiary-dark': c.text.tertiary.dark,
        },
        border: {
          DEFAULT: c.border.default.light,
          dark: c.border.default.dark,
          hover: c.border.hover.light,
          'hover-dark': c.border.hover.dark,
        },
        error: { DEFAULT: c.semantic.error.light, dark: c.semantic.error.dark },
        success: { DEFAULT: c.semantic.success.light, dark: c.semantic.success.dark },
        warning: { DEFAULT: c.semantic.warning.light, dark: c.semantic.warning.dark },
        crisis: c.crisis.red,
        relevance: {
          high: c.relevance.high,
          moderate: c.relevance.moderate,
          explore: c.relevance.explore,
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
        mood: {
          1: c.mood['1'].light,
          2: c.mood['2'].light,
          3: c.mood['3'].light,
          4: c.mood['4'].light,
          5: c.mood['5'].light,
        },
      },
      borderRadius: {
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
        full: tokens.radius.full,
      },
      transitionDuration: {
        swift: `${tokens.motion.duration.swift}ms`,
        base: `${tokens.motion.duration.base}ms`,
        calm: `${tokens.motion.duration.calm}ms`,
        breath: `${tokens.motion.duration.breath}ms`,
      },
      fontFamily: {
        sans: [tokens.type.family.sans],
        'sans-medium': [tokens.type.family.sansMedium],
        'sans-bold': [tokens.type.family.sansBold],
        display: [tokens.type.family.display],
      },
    },
  },
  plugins: [],
};
