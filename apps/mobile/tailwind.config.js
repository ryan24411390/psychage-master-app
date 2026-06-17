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
// Type-scale, spacing, radius, and shadows are fully calibrated to provide a
// premium, dense, Apple-grade mobile experience. Typography binds to the token
// scale. Spacing relies on Tailwind's native 4pt grid which aligns perfectly with
// our 8pt baseline layout tokens.

module.exports = {
  // Class-driven dark mode: NativeWind toggles the `dark` class at runtime via
  // colorScheme.set(...) (apps/mobile/app/_layout.tsx ← persisted appearance mode).
  // Required for manual light/night/system control — media-gating throws on set.
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
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
          accent: c.surface.accent.light,
          'accent-dark': c.surface.accent.dark,
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
          disabled: c.text.disabled.light,
          'disabled-dark': c.text.disabled.dark,
          interactive: c.text.interactive.light,
          'interactive-dark': c.text.interactive.dark,
        },
        border: {
          DEFAULT: c.border.default.light,
          dark: c.border.default.dark,
          hover: c.border.hover.light,
          'hover-dark': c.border.hover.dark,
          accent: c.border.accent.light,
          'accent-dark': c.border.accent.dark,
          hairline: 'rgba(26,26,46,0.08)',
        },
        error: { DEFAULT: c.semantic.error.light, dark: c.semantic.error.dark },
        success: { DEFAULT: c.semantic.success.light, dark: c.semantic.success.dark },
        warning: { DEFAULT: c.semantic.warning.light, dark: c.semantic.warning.dark },
        crisis: { DEFAULT: c.crisis.red, dark: c.crisis.redDark },
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
        paper: {
          DEFAULT: '#FBF9F4',
          dark: '#FBF9F4', // Ensure dark mode respects paper if it gets triggered
        },
        intent: {
          now: { light: '#EAF4F1', deep: '#D6EAE5' },
          patterns: { light: '#F0EDF6', deep: '#E2DCEF' },
          understand: { light: '#EAEFF4', deep: '#D8E2EC' },
        },
      },
      borderRadius: {
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
        '2xl': tokens.radius['2xl'],
        full: tokens.radius.full,
      },
      fontSize: {
        xs: [`${tokens.type.size.xs}px`, { lineHeight: `${tokens.type.leading.normal}` }],
        sm: [`${tokens.type.size.sm}px`, { lineHeight: `${tokens.type.leading.normal}` }],
        base: [`${tokens.type.size.base}px`, { lineHeight: `${tokens.type.leading.normal}` }],
        lg: [`${tokens.type.size.lg}px`, { lineHeight: `${tokens.type.leading.normal}` }],
        xl: [`${tokens.type.size.xl}px`, { lineHeight: `${tokens.type.leading.tight}` }],
        '2xl': [`${tokens.type.size['2xl']}px`, { lineHeight: `${tokens.type.leading.tight}` }],
        '3xl': [`${tokens.type.size['3xl']}px`, { lineHeight: `${tokens.type.leading.tight}` }],
        '4xl': [`${tokens.type.size['4xl']}px`, { lineHeight: `${tokens.type.leading.none}` }],
        '5xl': [`${tokens.type.size['5xl']}px`, { lineHeight: `${tokens.type.leading.none}` }],
      },
      boxShadow: {
        sm: `0px ${tokens.shadow.sm.offset.height}px ${tokens.shadow.sm.radius}px rgba(0, 0, 0, ${tokens.shadow.sm.opacity})`,
        DEFAULT: `0px ${tokens.shadow.base.offset.height}px ${tokens.shadow.base.radius}px rgba(0, 0, 0, ${tokens.shadow.base.opacity})`,
        md: `0px ${tokens.shadow.md.offset.height}px ${tokens.shadow.md.radius}px rgba(0, 0, 0, ${tokens.shadow.md.opacity})`,
        lg: `0px ${tokens.shadow.lg.offset.height}px ${tokens.shadow.lg.radius}px rgba(0, 0, 0, ${tokens.shadow.lg.opacity})`,
        xl: `0px ${tokens.shadow.xl.offset.height}px ${tokens.shadow.xl.radius}px rgba(0, 0, 0, ${tokens.shadow.xl.opacity})`,
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
