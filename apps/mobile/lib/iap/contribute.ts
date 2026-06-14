// S50 supporter — the IAP call boundary. PLATFORM hand-off: the real purchase
// flow is StoreKit (iOS) / Play Billing (Android), wired by the platform layer. No
// IAP library is added in Wave B2 (per the wave constraints); this is the seam the
// surface calls, and the infra is flagged.
//
// U4 invariants this module helps enforce: a contribution is VOLUNTARY, never tied
// to a feature, and never recorded on the user's record. Nothing here touches the
// RecordStore, analytics, or the network.

export type ContributionTierId = 'supporter_small' | 'supporter_medium' | 'supporter_large';

// Platform IAP infra is not wired in B2. When the platform layer lands, this flips
// true and the functions below call StoreKit / Play Billing.
export const IAP_ENABLED = false;

export class IapUnavailableError extends Error {
  constructor() {
    super('In-app purchase is not available (platform IAP infra not wired in B2).');
    this.name = 'IapUnavailableError';
  }
}

/**
 * STUB(platform): begin a voluntary contribution purchase for `tierId`.
 * No native bridge, no network in B2 — returns a settled "not purchased" result
 * so the calm surface never blocks or errors loudly. `purchased:false` +
 * `available:false` distinguishes "infra not wired" from a user cancel.
 */
export async function purchaseContribution(
  _tierId: ContributionTierId,
): Promise<{ purchased: boolean; available: boolean }> {
  if (!IAP_ENABLED) {
    // TODO(platform): StoreKit `Product.purchase()` / Play Billing `launchBillingFlow`.
    return { purchased: false, available: false };
  }
  // Future: resolve the store product for tierId, request the purchase, verify.
  return { purchased: false, available: true };
}
