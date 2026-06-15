// CT4 FIXTURE — Toolkits consumer copy (index + detail). NOT final copy.
// Educational framing (SR-3): no diagnostic language, no "you have / you are",
// "common" not "normal", no absolutes, ~8th-grade reading level. Toolkit titles
// + subtitles come from the clinically-gated DB content, NOT from this file.
// Clinically reviewed (Dr. Dobson, root CLAUDE.md §7) before ship — the detail
// surface touches condition-adjacent themes.
//
// The disclaimer string is RATIFIED VERBATIM in ADR-002 (2026-06-15) and must not
// be reworded.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const TOOLKITS_COPY = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  // Index
  title: 'Toolkits',
  intro:
    'Small sets of tools and reading, grouped by what you might be going through. Use what feels useful — leave the rest.',
  loading: 'Loading toolkits…',
  empty: 'No toolkits are published yet. Please check back soon.',
  back: 'Back',

  // Detail
  notFound: 'This toolkit is not available right now.',
  // ADR-002 — clinically ratified, VERBATIM. Do not edit.
  disclaimer:
    "Educational — not a clinical record, and not a substitute for the clinician's own assessment.",
  introHeading: 'About this set',
  syncLabel: 'Back up my progress',
  syncDescription:
    'Off by default. Turn this on to save which items you open or finish to your account. You can turn it off any time.',

  // Item rows
  open: 'Open',
  comingSoon: 'Coming soon',
  markDone: 'Mark as done',
  done: 'Done',
  helpfulPrompt: 'Was this helpful?',
  helpfulALittle: 'A little',
  helpfulNotYet: 'Not yet',

  // Item kind labels (educational, plain words) — per-item badge.
  kindLabel: {
    tool: 'Tool',
    article: 'Read',
    term: 'Plain words',
    strategy: 'Strategy',
  } as const,

  // Section headers when items are grouped by kind on the detail screen.
  groupLabel: {
    tool: 'Tools',
    article: 'Reading',
    term: 'Plain words',
    strategy: 'Strategies',
  } as const,
} as const;
