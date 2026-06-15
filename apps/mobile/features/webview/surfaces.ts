// The WebView surfaces (S23/S24/S26/S27/S30–S32). One chrome component
// parameterized by slug. They collapse onto a few web origins + 2 sub-paths
// (library-search, provider) — same chrome, same handshake, different `/m/` path.
// `titleKey` resolves through the CT4 fixture, not a real i18n catalog.
//
// 'sleep-architect' (S29) was RETIRED when Sleep Architect was ported native
// (app/tools/sleep.tsx → features/sleep-architect/). No surface remains for it.

export type SurfaceSlug =
  | 'library'
  | 'library-search'
  | 'directory'
  | 'provider'
  | 'relationship-health'
  | 'med-tracker'
  | 'clarity-score';

export interface SurfaceDef {
  readonly path: string;
  readonly titleKey: string;
}

export const SURFACES: Record<SurfaceSlug, SurfaceDef> = {
  library: { path: '/m/library', titleKey: 'library' }, // S23
  'library-search': { path: '/m/library/search', titleKey: 'librarySearch' }, // S24
  directory: { path: '/m/directory', titleKey: 'directory' }, // S26
  provider: { path: '/m/directory/provider', titleKey: 'provider' }, // S27 (+ /:id)
  'relationship-health': { path: '/m/relationship-health', titleKey: 'relationship' }, // S30
  'med-tracker': { path: '/m/med-tracker', titleKey: 'medTracker' }, // S31
  'clarity-score': { path: '/m/clarity-score', titleKey: 'clarity' }, // S32
};
