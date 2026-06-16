// Mascot ↔ surface binding — the SINGLE committed place where "which mascot goes where"
// lives. Route-driven presence + the forbidden list + the runtime resolver. Contextual
// placements (empty/error/loading/MindMate/etc.) pass an explicit `state` prop at the
// render site, because they are conditions, not routes. All paths are real expo-router
// pathnames in THIS app (see Phase 0 recon). Confirmed by founder 2026-06-16.

import type { MascotState } from './manifest';

// The Today/home root. expo-router strips (group) folders, so the (tabs)/(today)/index
// screen resolves to '/' (and '/today' as a defensive alias). Carries the runtime
// time-of-day / dark-theme override below.
export const TODAY_ROUTES: readonly string[] = ['/', '/today'];

// Route-driven presence: a bare <Mascot /> (no props) auto-selects by active pathname.
export const MASCOT_BY_ROUTE: Record<string, MascotState> = {
  '/onboarding/welcome': 'hi',
  // record.tsx hosts the "note how you are" step (thoughtful, route-auto) AND the first
  // check-in imprint moment — the imprint passes an explicit state="accomplished" prop.
  '/onboarding/record': 'thoughtful',
  '/settings': 'friendly',
  '/': 'neutral',
  '/today': 'neutral',
};

// FORBIDDEN surfaces — the mascot NEVER renders here, in ANY state, even with an explicit
// `state` prop. Sacred Rule territory: crisis + Symptom Navigator must stay in the plain
// register; delete-account is irreversible-action chrome. Paywall is OMITTED — there is no
// real payment surface yet (settings/supporter is supporter tiers, not a paywall).
//
// Storm Check is intentionally absent: it has no standalone route (it lives inside the
// relationship-health tool). It is enforced instead via the <Mascot suppressed> sub-state
// guard — see resolveMascotState + the relationship-health screen.
export const MASCOT_FORBIDDEN: readonly string[] = [
  '/crisis',
  '/crisis-region',
  '/navigator',
  '/dev-navigator',
  '/settings/delete',
  '/settings/delete-confirm',
];

// Contextual placements — conditions, not routes, so the render site passes the state as
// an explicit prop. This map is the COMMITTED source of truth for which mascot belongs at
// each contextual surface (not inferred at the call site). Keys are referenced as
// MASCOT_CONTEXTUAL.<key> where the mascot is rendered.
export const MASCOT_CONTEXTUAL = {
  emptyLibrary: 'looking-up', // empty saved / bookmarks
  emptySearch: 'searching', // empty search / no results
  emptyHistory: 'looking-down', // empty check-in history
  emptyGeneric: 'open', // generic / first-run empty (AnimatedEmptyState default)
  error404: 'oops', // +not-found
  loadingSleep: 'resting', // loading + sleep content
  mindmateIdle: 'listening', // MindMate idle/listening surface
  toolkitCalm: 'meditating', // toolkit / breathing / calm tool
  findCareCta: 'reaching-out', // Find Care / support CTA
  progressComplete: 'encouraging', // progress / completion / Clarity result
  calmSecondary: 'seated', // calm secondary presence / offline
  homeSaveReturn: 'tilt', // check-in save + lapse-return (realized as tiltSignal motion)
} satisfies Record<string, MascotState>;

export function isMascotForbidden(pathname: string): boolean {
  return MASCOT_FORBIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isTodayRoute(pathname: string): boolean {
  return TODAY_ROUTES.includes(pathname);
}

export interface ResolveArgs {
  /** Active route from usePathname(). */
  pathname: string;
  /** Explicit state for contextual render sites; overrides route-auto (but not forbidden). */
  state?: MascotState;
  /** Storm Check (and any future) sub-state suppression — wins over everything. */
  suppressed?: boolean;
  /** Local hour 0–23, for the Today morning override. */
  hour?: number;
  /** Dark theme active, for the Today night override. */
  isDark?: boolean;
}

// The one resolver the <Mascot> component delegates to. Pure + side-effect-free so the
// forbidden-route invariant is unit-testable without rendering React Native.
//
// Precedence (Sacred Rules first):
//   1. suppressed         → null
//   2. forbidden route    → null  (regardless of explicit `state`)
//   3. explicit `state`   → that state (contextual sites)
//   4. route-auto         → MASCOT_BY_ROUTE[pathname], with Today time/theme override
//   5. unmapped route     → null
export function resolveMascotState(args: ResolveArgs): MascotState | null {
  const { pathname, state, suppressed, hour, isDark } = args;

  if (suppressed) return null;
  if (isMascotForbidden(pathname)) return null;
  if (state) return state;

  const routeState = MASCOT_BY_ROUTE[pathname];
  if (!routeState) return null;

  if (isTodayRoute(pathname)) {
    if (isDark) return 'night';
    if (hour !== undefined && hour >= 5 && hour < 12) return 'morning';
  }
  return routeState;
}
