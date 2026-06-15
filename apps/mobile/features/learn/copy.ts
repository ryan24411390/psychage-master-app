// CT4 FIXTURE — Learn tab copy (S6). NOT final.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_LEARN = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  intro: 'Plain-language guides on what you might be experiencing.',
  conditionsLabel: 'Browse conditions',
  libraryLabel: 'Browse the full library',
  // Shared list/hub fallbacks (no diagnostic language; report absence honestly).
  articlesFallback: 'Articles',
  listEmpty: 'No articles here yet.',
  listError: 'This could not be loaded right now. Please try again.',
} as const;
