// CT4 FIXTURE — honest offline/empty copy (S25, S28, WebView fallback). NOT final.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_OFFLINE = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  offline: {
    title: "You're offline",
    body: 'This needs an internet connection. Your record is safe on your device.',
  },
  empty: {
    title: 'Nothing here yet',
    body: 'When there is something to show, it will appear here.',
  },
  retry: 'Try again',
} as const;
