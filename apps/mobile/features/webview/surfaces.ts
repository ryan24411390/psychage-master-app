// The 8 WebView surfaces (S23/S24/S26/S27/S29–S32). One chrome component
// parameterized by slug. The 8 collapse onto 6 web origins + 2 sub-paths
// (library-search, provider) — same chrome, same handshake, different `/m/` path.
// `titleKey` resolves through the CT4 fixture, not a real i18n catalog.

export type SurfaceSlug =
  | 'library'
  | 'library-search'
  | 'directory'
  | 'provider'
  | 'sleep-architect'
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
  'sleep-architect': { path: '/m/sleep-architect', titleKey: 'sleep' }, // S29
  'relationship-health': { path: '/m/relationship-health', titleKey: 'relationship' }, // S30
  'med-tracker': { path: '/m/med-tracker', titleKey: 'medTracker' }, // S31
  'clarity-score': { path: '/m/clarity-score', titleKey: 'clarity' }, // S32
};
