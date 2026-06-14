import { describe, expect, it } from 'vitest';

import { sanitizeNumber, smsUrl, telUrl } from '@/features/crisis/intents';

// PR-A gate: the dialer INTENT is formed (not that it actually dials in CI).
describe('crisis dialer intents', () => {
  it('forms tel: intents, stripping display formatting', () => {
    expect(telUrl('911')).toBe('tel:911');
    expect(telUrl('0-000-000-0001')).toBe('tel:00000000001');
    expect(telUrl('+44 808 000 0000')).toBe('tel:+448080000000');
  });

  it('forms sms: intents for text-capable numbers', () => {
    expect(smsUrl('741741')).toBe('sms:741741');
    expect(smsUrl('0-000-000-0001')).toBe('sms:00000000001');
  });

  it('keeps +, *, # (valid DTMF / short codes) and drops separators', () => {
    expect(sanitizeNumber('1-800-273-8255')).toBe('18002738255');
    expect(sanitizeNumber('+1 (800) 273 8255')).toBe('+18002738255');
    expect(sanitizeNumber('*123#')).toBe('*123#');
  });
});
