import type { ContributionTierId } from '@/lib/iap/contribute';

// The voluntary contribution tiers. `priceLabel` is a CT4 FIXTURE — at runtime the
// real, localized price comes from the store product (StoreKit / Play Billing);
// these placeholders only shape the surface until the platform IAP infra lands.

export type SupporterTier = {
  id: ContributionTierId;
  nameKey: ContributionTierId;
  priceLabel: string; // CT4 FIXTURE — replaced by the store product price at runtime
};

export const SUPPORTER_TIERS: readonly SupporterTier[] = [
  { id: 'supporter_small', nameKey: 'supporter_small', priceLabel: '$2.99' },
  { id: 'supporter_medium', nameKey: 'supporter_medium', priceLabel: '$5.99' },
  { id: 'supporter_large', nameKey: 'supporter_large', priceLabel: '$11.99' },
];
