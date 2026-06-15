// Check-in sheet copy (Flow 1–2, S4) — VERBATIM from PSYCHAGE_MOBILE_CT4_COPY.md §3
// (sheet) and §6 (edit title) and §18 (save failure). Externalized from the
// CheckInSheet render site (CT4 copy-application task). Curly apostrophes match the
// shipped render + the RNTL assertions. EN-only at ship.
//
// Two CT4 reconciliations applied here vs the prior inline copy (logged in
// COPY_CONFLICTS_APPLIED.md):
//   • notePlaceholder: deck §3 [FINAL] "One word, if you want." (was "A word about it — optional")
//   • editTitle:       deck §6 "Edit this entry" — no trailing period (was "Edit this entry.")
export const CHECK_IN_COPY = {
  title: 'How are you right now?', // §3 [UI][FINAL]
  subline: 'There’s no wrong answer.', // §3 [VOICE][FINAL]
  editTitle: 'Edit this entry', // §6 [UI]
  notePlaceholder: 'One word, if you want.', // §3 [UI][FINAL]
  save: 'Save today’s entry', // §3 [UI][FINAL]
  editSave: 'Save', // §18 btn.save
  whisper: 'Stays on your phone.', // §3 [VOICE][FINAL]
  saveFailed: 'We couldn’t save that. Try once more.', // §18 generic save failure
  close: 'Close',
} as const;
