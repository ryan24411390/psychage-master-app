// Pure WebView URL builder (the SYS-S8 deep-link). HTTPS-only. Manual query
// assembly (no URLSearchParams — Hermes support is uneven) with a fixed param
// order: wvt, theme, lang. Vitest-testable; never logs the token.

export const WV_ORIGIN = 'https://psychage.com';

export type WvTheme = 'light' | 'dark';

export interface WvUrlParams {
  /** The short-lived WebView token (auth handshake). Omitted until issued. */
  wvt?: string;
  theme: WvTheme;
  lang: string;
}

export function buildWebViewUrl(origin: string, path: string, params: WvUrlParams): string {
  if (!origin.startsWith('https://')) {
    throw new Error('WebView origin must be HTTPS');
  }
  const parts: string[] = [];
  if (params.wvt) parts.push(`wvt=${encodeURIComponent(params.wvt)}`);
  parts.push(`theme=${encodeURIComponent(params.theme)}`);
  parts.push(`lang=${encodeURIComponent(params.lang)}`);
  return `${origin}${path}?${parts.join('&')}`;
}
