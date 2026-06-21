// The Compass landing's links into A2's pushed destinations. B2 owns ONLY the
// Compass tab shell (this landing); A2 owns the destination routes (S13 Navigator,
// S19 Toolkit). Both routes are now live on main (app/navigator.tsx, app/toolkit.tsx),
// so these tiles resolve to real screens. Declared as one constant so the boundary
// does not drift between waves.
export const COMPASS_ROUTES = {
  navigator: '/navigator', // A2 S13 — Symptom Navigator
  toolkit: '/toolkit', // A2 S19 — Toolkit
  relationship: '/tools/relationship-health', // native Relationship Health tool
  mindmate: '/tools/mindmate', // S-MM — MindMate AI companion (native chat)
  clarity: '/tools/clarity', // S32 — Clarity Score (native flow)
  clarityHistory: '/tools/clarity-history', // past Clarity snapshots (local-only)
  relationshipHistory: '/tools/relationship-history', // past Relationship results (local-only)
  moodJournal: '/tools/mood-journal', // Mood Journal — patterns & triggers
  sleep: '/tools/sleep', // S29 Sleep Architect (native)
  insights: '/insights', // cross-tool patterns dashboard (root full-screen). Was an
  // orphan — only the Home "Your tools" card linked here; this is its second door.
} as const;
