// The Compass landing's links into A2's pushed destinations. B2 owns ONLY the
// Compass tab shell (this landing); A2 owns the destination routes (S13 Navigator,
// S19 Toolkit), which do not exist in the tree yet. These tiles push to these
// paths as STUBS — they resolve to route-not-found until A2 lands the screens.
// Declared as one constant so A2 imports the SAME paths rather than the boundary
// drifting between waves.
export const COMPASS_ROUTES = {
  navigator: '/compass/navigator', // A2 S13 — Symptom Navigator
  toolkit: '/compass/toolkit', // A2 S19 — Toolkit
} as const;
