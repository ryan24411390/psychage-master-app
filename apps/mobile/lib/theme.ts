// Appearance → NativeWind color-scheme bridge.
//
// The persisted appearance `mode` ('light' | 'night' | 'system') records the
// user's intent in MMKV (lib/persistence/appearance.ts). NativeWind's runtime
// color scheme is the thing that actually flips `dark:` classes once
// tailwind.config.js runs `darkMode: 'class'`. This pure map is the single
// translation point between the two vocabularies, kept side-effect-free so it is
// the unit under test; the imperative `colorScheme.set(...)` call lives in the
// RootLayout effect (apps/mobile/app/_layout.tsx).

import type { AppearanceMode } from '@/lib/persistence/appearance';

/** NativeWind color-scheme target accepted by `colorScheme.set()`. */
export type ColorSchemeName = 'light' | 'dark' | 'system';

/**
 * Map the persisted appearance mode to the NativeWind color scheme.
 * 'night' is Psychage's user-facing name for dark; 'system' defers to the OS.
 */
export function resolveColorScheme(mode: AppearanceMode): ColorSchemeName {
  switch (mode) {
    case 'light':
      return 'light';
    case 'night':
      return 'dark';
    case 'system':
      return 'system';
  }
}
