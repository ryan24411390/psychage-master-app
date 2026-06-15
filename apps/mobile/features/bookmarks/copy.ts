/**
 * Bookmarks copy (EN). Verbatim from .specs/bookmarks/design.md §"Copy strings (EN)".
 *
 * SR-3: every string is educational, person-first, content-neutral, and non-medical —
 * no clinical self-assertions, no condition references. App Store 1.4.1.
 * EN-only at ship; PT/ES/SV/FR land when `packages/i18n` exists (CLAUDE.md §2).
 */

export const BOOKMARKS_COPY = {
  save: {
    article: 'Save this article',
    provider: 'Save this provider',
    tool: 'Save this tool',
  },
  saved: {
    aria: 'Saved. Tap to remove.',
  },
  error: {
    save: "Couldn't save — check your connection and try again.",
    load: "Couldn't load your saved items.",
  },
  signin: {
    title: 'Keep this for later',
    body: "Sign in to save articles, providers, and tools to your account, so they're here whenever you come back — on any device.",
    cta: 'Sign in to save',
    dismiss: 'Not now',
  },
  list: {
    title: 'Saved',
  },
  filter: {
    all: 'All',
    articles: 'Articles',
    providers: 'Providers',
    tools: 'Tools',
  },
  row: {
    unavailable: 'No longer available',
    remove: 'Remove',
  },
  empty: {
    title: 'Nothing saved yet',
    body: 'Tap the bookmark on any article, provider, or tool to keep it here.',
    cta: 'Explore Learn',
  },
} as const;
