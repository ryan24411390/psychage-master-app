// DI adapter barrel.
//
// Per rules/conventions.md #3 the seam is exercised by injecting adapter
// values at call sites; this barrel is the single import path for the four
// mobile-side conformances. featureFlags is real (typed predicate); storage,
// config, analytics are conformant stubs this slice — see each module's
// header for the slice that fills them in.

export { type Analytics, analytics, type TrackEvent, type TrackProps } from "./analytics";
export { type AppConfig, config } from "./config";
export { type IsTierEnabledFn, isTierEnabled } from "./featureFlags";
export { type Storage, storage } from "./storage";
