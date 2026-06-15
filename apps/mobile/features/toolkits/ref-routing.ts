// Toolkits — item ref_id → mobile route resolution.
//
// Web items carry a `ref_id` (`tool:<slug>`, `article:<cat>/<slug>`, `term:<slug>`,
// `strategy:<slug>`). The web router maps these to web paths; mobile re-maps the
// ones whose surface EXISTS as an Expo Router route today. Anything unmapped —
// unbuilt tools, every `term:` / `strategy:` (Plain Words + Coping Finder are not
// built on mobile) — resolves to null, which the UI renders as a disabled
// "Coming soon" row. We never fabricate a destination.

import type { ToolkitItem } from './types';

// Web tool slug → mobile Expo Router path. Only slugs with a real mobile screen
// are listed; the rest fall through to "coming soon".
const TOOL_ROUTES: Readonly<Record<string, string>> = {
  'symptom-navigator': '/navigator',
  'clarity-score': '/tools/clarity',
  'mood-journal': '/tools/mood-journal',
  'sleep-architect': '/tools/sleep',
  'relationship-health': '/tools/relationship-health',
  'medication-tracker': '/tools/med-tracker',
  mindmate: '/tools/mindmate',
  crisis: '/crisis',
};

/** Split `scheme:rest` once; rest keeps any further `/` segments intact. */
function splitRef(ref: string): readonly [string, string] {
  const idx = ref.indexOf(':');
  if (idx === -1) return [ref, ''];
  return [ref.slice(0, idx), ref.slice(idx + 1)];
}

/**
 * The mobile route an item opens to, or null when no built surface exists yet.
 * `article:<cat>/<slug>` → `/article/<slug>` (the reader keys on the article slug,
 * the trailing segment).
 */
export function resolveItemRoute(item: ToolkitItem): string | null {
  const [scheme, rest] = splitRef(item.ref_id);
  if (!rest) return null;

  switch (scheme) {
    case 'tool':
      return TOOL_ROUTES[rest] ?? null;
    case 'article': {
      const slug = rest.includes('/') ? rest.slice(rest.lastIndexOf('/') + 1) : rest;
      return slug ? `/article/${slug}` : null;
    }
    // Plain Words (term) and Coping Finder (strategy) surfaces are not built on
    // mobile yet — disabled until they ship.
    default:
      return null;
  }
}
