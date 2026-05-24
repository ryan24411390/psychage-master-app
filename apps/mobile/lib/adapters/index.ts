// DI adapter barrel.
//
// Per rules/conventions.md #3 the seam is exercised by injecting adapter
// values at call sites; this barrel is the single import path for the four
// mobile-side conformances. featureFlags is real (typed predicate); storage,
// config, analytics are conformant stubs this slice — see each module's
// header for the slice that fills them in.

export { isTierEnabled, type IsTierEnabledFn } from './featureFlags';
export { storage, type Storage } from './storage';
export { config, type AppConfig } from './config';
export { analytics, type Analytics, type TrackEvent, type TrackProps } from './analytics';
