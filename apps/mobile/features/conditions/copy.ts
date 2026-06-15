// Conditions library — UI copy.
//
// FIXTURE / PENDING CLINICAL REVIEW. Per root CLAUDE.md §7, any user-facing
// surface that MENTIONS conditions must be clinically reviewed by Dr. Lena
// Dobson before ship. These strings are generic, navigational chrome only — they
// make NO condition-specific or diagnostic claim (SR-2/SR-3) — but because the
// surface as a whole is condition-facing, the copy is flagged not-final and
// carries the same CT marker convention as the other copy fixtures until sign-off.
const FIXTURE = 'FIXTURE — not final copy (pending Dr. Dobson review)' as const;

export const CONDITIONS_COPY = {
  _fixture: 'CT' as const,
  _marker: FIXTURE,
  // List screen.
  title: 'Conditions',
  intro:
    'Plain-language topics about mental health, drawn from our reviewed library. This is educational — it is not a diagnosis.',
  // Detail screen (generic — shown under every topic name; no per-condition claim).
  detailIntro: 'Reviewed, plain-language articles on this topic.',
  coversLabel: 'What this covers',
  browseLabel: 'Browse articles in the library',
  relatedLabel: 'Related topics',
  // Shared.
  disclaimer:
    'Psychage is educational and does not diagnose or treat. If you need help now, tap Help now at the top.',
  notFound: 'We could not find that topic.',
  back: 'Back',
} as const;
