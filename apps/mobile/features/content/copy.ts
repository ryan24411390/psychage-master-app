// CT4 FIXTURE — article reader chrome copy (S22). NOT final.
export const CT4_CONTENT = {
  _fixture: 'CT4' as const,
  _marker: 'FIXTURE — not final copy',
  back: 'Back',
  readOn: (weekday: string): string => `You read this on ${weekday}`,
};
