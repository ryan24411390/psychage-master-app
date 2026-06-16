// Mascot feature module. Import surface: @/features/mascot
//
// The <Mascot> component itself lives at @/components/home/Mascot (its three existing
// consumers import it from there); this barrel re-exports it alongside the manifest and
// the surface-binding config so callers can reach everything from one place.
export { Mascot } from '@/components/home/Mascot';
export {
  type MascotAsset,
  type MascotState,
  MASCOT_IDLE_STATES,
  MASCOT_SOURCES,
  MASCOT_STATES,
} from './manifest';
export {
  type ResolveArgs,
  isMascotForbidden,
  MASCOT_BY_ROUTE,
  MASCOT_CONTEXTUAL,
  MASCOT_FORBIDDEN,
  resolveMascotState,
  TODAY_ROUTES,
} from './mascot.surfaces';
