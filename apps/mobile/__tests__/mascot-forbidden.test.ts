import { describe, expect, it } from 'vitest';

// Imports the PURE surface resolver directly (not the @/features/mascot barrel) so the
// manifest's PNG require()s never load in the node test env. mascot.surfaces only
// `import type`s MascotState, which is erased at compile — nothing runtime-heavy here.
import {
  isMascotForbidden,
  MASCOT_BY_ROUTE,
  MASCOT_FORBIDDEN,
  resolveMascotState,
} from '@/features/mascot/mascot.surfaces';

describe('Sacred Rule — mascot never renders on forbidden surfaces', () => {
  it('lists crisis, Symptom Navigator, and delete-account as forbidden', () => {
    expect(MASCOT_FORBIDDEN).toContain('/crisis');
    expect(MASCOT_FORBIDDEN).toContain('/crisis-region');
    expect(MASCOT_FORBIDDEN).toContain('/navigator');
    expect(MASCOT_FORBIDDEN).toContain('/dev-navigator');
    expect(MASCOT_FORBIDDEN).toContain('/settings/delete');
    expect(MASCOT_FORBIDDEN).toContain('/settings/delete-confirm');
  });

  it('returns null on EVERY forbidden route, even when forced with an explicit state', () => {
    for (const route of MASCOT_FORBIDDEN) {
      // bare route-auto
      expect(resolveMascotState({ pathname: route })).toBeNull();
      // forced explicit state — must STILL be null (the prop cannot override the rule)
      expect(resolveMascotState({ pathname: route, state: 'hi' })).toBeNull();
      expect(resolveMascotState({ pathname: route, state: 'encouraging' })).toBeNull();
      // even with the Today overrides present
      expect(
        resolveMascotState({ pathname: route, state: 'neutral', hour: 8, isDark: true }),
      ).toBeNull();
    }
  });

  it('treats nested paths under a forbidden root as forbidden', () => {
    expect(isMascotForbidden('/crisis/region')).toBe(true);
    expect(isMascotForbidden('/navigator/results')).toBe(true);
    expect(resolveMascotState({ pathname: '/crisis/anything', state: 'hi' })).toBeNull();
  });

  it('does not over-match sibling paths', () => {
    // '/settings/delete' must not swallow an unrelated sibling
    expect(isMascotForbidden('/settings/delete-account-help')).toBe(false);
    expect(isMascotForbidden('/settings')).toBe(false);
  });
});

describe('Storm Check sub-state guard', () => {
  it('suppressed wins over everything, including an explicit state on an allowed route', () => {
    expect(resolveMascotState({ pathname: '/settings', suppressed: true })).toBeNull();
    expect(
      resolveMascotState({ pathname: '/', state: 'listening', suppressed: true }),
    ).toBeNull();
  });
});

describe('route-driven presence', () => {
  it('auto-selects the bound state for mapped routes', () => {
    expect(resolveMascotState({ pathname: '/onboarding/welcome' })).toBe('hi');
    expect(resolveMascotState({ pathname: '/onboarding/record' })).toBe('thoughtful');
    expect(resolveMascotState({ pathname: '/settings' })).toBe('friendly');
  });

  it('returns null for an unmapped, non-forbidden route with no explicit state', () => {
    expect(resolveMascotState({ pathname: '/learn' })).toBeNull();
    expect(resolveMascotState({ pathname: '/tools/mindmate' })).toBeNull();
  });

  it('honors an explicit state on an unmapped allowed route (contextual sites)', () => {
    expect(resolveMascotState({ pathname: '/tools/mindmate', state: 'listening' })).toBe('listening');
    expect(resolveMascotState({ pathname: '/+not-found', state: 'oops' })).toBe('oops');
  });
});

describe('Today runtime override', () => {
  it('renders night under dark theme', () => {
    expect(resolveMascotState({ pathname: '/', isDark: true })).toBe('night');
    expect(resolveMascotState({ pathname: '/today', isDark: true, hour: 8 })).toBe('night');
  });

  it('renders morning between 05:00 and 11:59', () => {
    expect(resolveMascotState({ pathname: '/', hour: 5 })).toBe('morning');
    expect(resolveMascotState({ pathname: '/', hour: 11 })).toBe('morning');
  });

  it('renders neutral otherwise', () => {
    expect(resolveMascotState({ pathname: '/', hour: 12 })).toBe('neutral');
    expect(resolveMascotState({ pathname: '/', hour: 23 })).toBe('neutral');
    expect(resolveMascotState({ pathname: '/' })).toBe('neutral');
  });

  it('keeps the Today route bound to neutral in the config', () => {
    expect(MASCOT_BY_ROUTE['/']).toBe('neutral');
  });
});
