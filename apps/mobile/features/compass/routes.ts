// The Compass landing's links into A2's pushed destinations. B2 owns ONLY the
// Compass tab shell (this landing); A2 owns the destination routes (S13 Navigator,
// S19 Toolkit). Both routes are now live on main (app/navigator.tsx, app/toolkit.tsx),
// so these tiles resolve to real screens. Declared as one constant so the boundary
// does not drift between waves.
export const COMPASS_ROUTES = {
  navigator: '/navigator', // A2 S13 — Symptom Navigator
  toolkit: '/toolkit', // A2 S19 — Toolkit
  clarity: '/tools/clarity', // S32 — Clarity Score (native flow)
} as const;
