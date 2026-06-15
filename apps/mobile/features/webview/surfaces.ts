// The 7 WebView surfaces (S23/S24/S26/S27/S29/S31/S32). One chrome component
// parameterized by slug. The 7 collapse onto 5 web origins + 2 sub-paths
// (library-search, provider) — same chrome, same handshake, different `/m/` path.
// `titleKey` resolves through the CT4 fixture, not a real i18n catalog.
//
// NOTE: 'relationship-health' (S30) was removed when the Relationship Health tool
// became a native, self-contained feature (app/tools/relationship-health.tsx).

export type SurfaceSlug =
  | 'library'
  | 'library-search'
  | 'directory'
  | 'provider'
  | 'sleep-architect'
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
  'sleep-architect': { path: '/m/sleep-architect', titleKey: 'sleep' }, // S29
  'med-tracker': { path: '/m/med-tracker', titleKey: 'medTracker' }, // S31
  'clarity-score': { path: '/m/clarity-score', titleKey: 'clarity' }, // S32
};
