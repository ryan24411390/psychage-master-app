import { describe, expect, it } from 'vitest';

import {
  directionsUrl,
  formatAddress,
  mailtoUrl,
  smsUrl,
  telUrl,
  webUrl,
} from '@/features/directory/contact';
import type { ProviderLocation } from '@/features/directory/types';

const loc = (over: Partial<ProviderLocation>): ProviderLocation => ({
  id: 'l1',
  provider_id: 'p1',
  address_line1: null,
  address_line2: null,
  city: null,
  state_province: null,
  postal_code: null,
  country_code: 'US',
  latitude: null,
  longitude: null,
  is_primary: true,
  ...over,
});

describe('directory contact intents', () => {
  it('re-uses the crisis dialer builders for tel/sms', () => {
    expect(telUrl('818-971-9446')).toBe('tel:8189719446');
    expect(smsUrl('741741')).toBe('sms:741741');
  });

  it('builds mailto from a real email, trimming only whitespace', () => {
    expect(mailtoUrl('  dr@clinic.org ')).toBe('mailto:dr@clinic.org');
  });

  it('adds https scheme only when missing; never alters host/path', () => {
    expect(webUrl('drsmith.com')).toBe('https://drsmith.com');
    expect(webUrl('http://x.org/a')).toBe('http://x.org/a');
    expect(webUrl('https://x.org')).toBe('https://x.org');
    expect(webUrl('  spaced.com ')).toBe('https://spaced.com');
  });

  it('returns null for empty/absent website (never fabricates a link)', () => {
    expect(webUrl(null)).toBeNull();
    expect(webUrl(undefined)).toBeNull();
    expect(webUrl('   ')).toBeNull();
  });

  it('prefers coordinates for directions when present', () => {
    expect(directionsUrl(loc({ latitude: 34.05, longitude: -118.24 }))).toBe(
      'https://www.google.com/maps/search/?api=1&query=34.05,-118.24',
    );
  });

  it('falls back to the address string for directions', () => {
    const url = directionsUrl(loc({ address_line1: '1 Main St', city: 'Reseda', state_province: 'CA' }));
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=1%20Main%20St%2C%20Reseda%2C%20CA');
  });

  it('returns null directions when neither coords nor address exist', () => {
    expect(directionsUrl(loc({}))).toBeNull();
    expect(directionsUrl(null)).toBeNull();
  });

  it('formats a single-line address from present fields only', () => {
    expect(formatAddress(loc({ city: 'Reseda', state_province: 'CA', postal_code: '91335' }))).toBe(
      'Reseda, CA, 91335',
    );
    expect(formatAddress(loc({}))).toBe('');
  });
});
