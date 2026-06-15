import { describe, expect, it } from 'vitest';

import { IAP_ENABLED, purchaseContribution } from '@/lib/iap/contribute';

// The IAP call boundary is a flagged no-op in B2 — no native bridge, no network.
describe('purchaseContribution (platform stub)', () => {
  it('IAP infra is not enabled in B2', () => {
    expect(IAP_ENABLED).toBe(false);
  });

  it('resolves a settled not-purchased/not-available result without touching native', async () => {
    const result = await purchaseContribution('supporter_medium');
    expect(result).toEqual({ purchased: false, available: false });
  });
});
