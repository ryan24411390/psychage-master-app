import { describe, expect, it } from 'vitest';

import type { AppearanceMode } from '@/lib/persistence/appearance';
import { resolveColorScheme } from '@/lib/theme';

// The appearance `mode` vocabulary ('night') differs from NativeWind's ('dark').
// This map is the single translation point the RootLayout effect feeds to
// colorScheme.set(...); a wrong mapping silently strands the app in the wrong
// register, so it is pinned here.
describe('resolveColorScheme', () => {
  it('maps light → light', () => {
    expect(resolveColorScheme('light')).toBe('light');
  });

  it("maps night → dark (Psychage's user-facing name for dark)", () => {
    expect(resolveColorScheme('night')).toBe('dark');
  });

  it('maps system → system (defers to the OS)', () => {
    expect(resolveColorScheme('system')).toBe('system');
  });

  it('is total over every AppearanceMode', () => {
    const modes: readonly AppearanceMode[] = ['light', 'night', 'system'];
    for (const mode of modes) {
      expect(['light', 'dark', 'system']).toContain(resolveColorScheme(mode));
    }
  });
});
