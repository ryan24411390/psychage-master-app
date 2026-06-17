// CT4 FIXTURE — article reader chrome copy (S22). NOT final (pending Dr. Dobson
// review — the disclaimer is user-facing condition-adjacent copy).
export const CT4_CONTENT = {
  _fixture: 'CT4' as const,
  _marker: 'FIXTURE — not final copy (pending Dr. Dobson review)',
  back: 'Back',
  // CT4 §11 [VOICE][FINAL] revisit memory line — trailing period verbatim.
  readOn: (weekday: string): string => `You read this on ${weekday}.`,
  // SR-3 educational framing — no diagnostic language, person-first. Mirrors the
  // conditions surface; points at the always-present Help now (SR-2).
  disclaimer:
    'Psychage is educational and does not diagnose or treat. If you need help now, tap Help now at the top.',
  referencesTitle: 'References',
  viewSource: 'View source',
  // H1 content-loop forward actions (audit) — non-diagnostic, calm. CT4.
  relatedTitle: 'Related reading',
  nextStepTitle: 'Where to go next',
};
