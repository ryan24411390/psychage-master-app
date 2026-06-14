import { describe, expect, it } from 'vitest';

import { WV_ORIGIN, buildWebViewUrl } from '@/features/webview/wv-url';

describe('buildWebViewUrl', () => {
  it('builds an HTTPS url with wvt, theme, lang in fixed order, encoded', () => {
    const url = buildWebViewUrl(WV_ORIGIN, '/m/library', { wvt: 'tok 1', theme: 'dark', lang: 'en' });
    expect(url).toBe('https://psychage.com/m/library?wvt=tok%201&theme=dark&lang=en');
  });

  it('omits wvt before it is issued', () => {
    const url = buildWebViewUrl(WV_ORIGIN, '/m/library', { theme: 'light', lang: 'en' });
    expect(url).toBe('https://psychage.com/m/library?theme=light&lang=en');
  });

  it('rejects a non-HTTPS origin', () => {
    expect(() => buildWebViewUrl('http://psychage.com', '/m/x', { theme: 'light', lang: 'en' })).toThrow();
  });

  it('carries a provider id in the path', () => {
    const url = buildWebViewUrl(WV_ORIGIN, '/m/directory/provider/p123', {
      theme: 'light',
      lang: 'en',
    });
    expect(url).toBe('https://psychage.com/m/directory/provider/p123?theme=light&lang=en');
  });
});
