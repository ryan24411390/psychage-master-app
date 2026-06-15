// The WebView surfaces (S23/S24/S26/S27/S31/S32). One chrome component
// parameterized by slug. They collapse onto a few web origins + 2 sub-paths
// (library-search, provider) — same chrome, same handshake, different `/m/` path.
// `titleKey` resolves through the CT4 fixture, not a real i18n catalog.
//
// 'sleep-architect' (S29) and 'relationship-health' (S30) were RETIRED when those
// tools were ported native (app/tools/sleep.tsx → features/sleep-architect/;
// app/tools/relationship-health.tsx → features/relationship-health/). No surfaces
// remain for them.

export type SurfaceSlug =
  | 'library'
  | 'library-search'
  | 'directory'
  | 'provider'
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
  'med-tracker': { path: '/m/med-tracker', titleKey: 'medTracker' }, // S31
  'clarity-score': { path: '/m/clarity-score', titleKey: 'clarity' }, // S32
};
