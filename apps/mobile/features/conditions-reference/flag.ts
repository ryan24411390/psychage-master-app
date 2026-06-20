// Internal preview flag for the Conditions reference.
//
// OFF by default. When `EXPO_PUBLIC_CONDITIONS_PREVIEW=true`, the public verification
// gate is lifted so reviewers can see `unverified` rows before clinical sign-off.
// This MUST never be true in a store build — keep it out of the EAS production profile.
// Expo inlines EXPO_PUBLIC_* at build time, so a production bundle without the var set
// evaluates this to `false` and the gate stays closed.

export const CONDITIONS_PREVIEW = process.env.EXPO_PUBLIC_CONDITIONS_PREVIEW === 'true';
