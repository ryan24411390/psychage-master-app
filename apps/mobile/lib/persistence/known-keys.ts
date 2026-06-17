// The registry of every namespaced local storage key the app writes, so a
// "delete my record" (S48) can erase all of it through the {get,set,remove}
// storage seam — which has NO key enumeration.

// The Moments store's storage key. RE-DECLARED here, NOT imported: the shared barrel
// (packages/shared/engagement) deliberately does NOT export STORAGE_KEY, to stop a
// consumer WRITING past the store's validators. We only ever .remove() it (a delete,
// not a write), so that foot-gun does not apply.
export const MOMENTS_STORAGE_KEY = 'mobile:moments';

// Every namespaced key the app owns. Keep in sync when a new persisted key lands.
export const KNOWN_LOCAL_KEYS = [
  MOMENTS_STORAGE_KEY, // Moments engine entries (re-declared above)
  'mobile:tier-flags', // A1 lib/persistence/tier-flags
  'mobile:reflection-row-opened', // A1 lib/persistence/reflection-row
  'mobile:haptics-enabled', // A1 haptics (key reserved by the storage adapter)
  'mobile:reminder-settings', // B2 lib/persistence/reminder-settings
  'mobile:appearance', // B2 lib/persistence/appearance
  'mobile:personalization', // B2 lib/persistence/personalization
  'mobile:sync-consent', // settings lib/persistence/sync-consent (moment + check-in consent)
  'mobile:reading-text-size', // settings lib/persistence/reading-text-size
  'mobile:directory-location', // find lib/persistence/directory-location (home browse scope)
  'mobile:recently-viewed-providers', // find lib/persistence/recently-viewed (directory rail)
  'mobile:tour-seen', // first-run cross-tab tour flag (lib/persistence/tour)
  // Local-only assessment/tool result stores (SR-4). Each is also re-declared in its
  // own store module; these literals were previously MISSING here, so "delete my
  // record" left the data on disk — now closed. Coupling is by string match; a store
  // rename must update both sites.
  'mobile:clarity-results', // features/clarity/result-store (CLARITY_STORAGE_KEY)
  'mobile:navigator-results', // features/navigator/result-store (NAVIGATOR_STORAGE_KEY)
  'mobile:relationship-health-results', // features/relationship-health/result-store
  'mobile:mood-journal-moments', // shared mood-journal moment-store
  'mobile:sleep-architect-entries', // shared sleep record-store
] as const;

// The Moments store quarantines a corrupt blob under a dynamically-suffixed key
// `${MOMENTS_STORAGE_KEY}:quarantine:<iso>-<uuid>`. These have no static entry here,
// so wipeLocalData reaches them by enumerating getAllKeys() and removing any key
// carrying the `:quarantine:` segment.
export const QUARANTINE_KEY_PREFIX = `${MOMENTS_STORAGE_KEY}:quarantine:`;
