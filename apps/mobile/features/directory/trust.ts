// =============================================================================
// Provider Directory — trust-badge derivation
//
// Ported VERBATIM from psychage-v2/src/lib/providers/trust-badge.ts so the mobile
// directory derives the same badge / verification state the web shows. Framing is
// INFORMATIONAL: a badge reflects the provider's own DB status (verified / claimed /
// unclaimed), NOT a Psychage endorsement or referral.
// =============================================================================

import type { ProviderStatus } from './types';

export type TrustBadge = 'verified' | 'claimed' | 'unclaimed';

/**
 * Trust badge for a provider from their DB columns. Returns null for
 * submitted / suspended / rejected (no public badge).
 *
 * CRITICAL: Verified requires verified_at IS NOT NULL AND status IN
 * ('active','verified). Never OR — that would grant Verified to unverified
 * active providers.
 */
export function getTrustBadge(provider: {
  status: string;
  verified_at?: string | null;
}): TrustBadge | null {
  if (provider.verified_at != null && (provider.status === 'active' || provider.status === 'verified')) {
    return 'verified';
  }
  if (provider.status === 'claimed' && provider.verified_at == null) {
    return 'claimed';
  }
  if (provider.status === 'seeded') {
    return 'unclaimed';
  }
  return null;
}

/** Featured (premium) tiers — mirrors web shouldShowFeaturedBadge. */
export function isFeaturedTier(tier?: string | null): boolean {
  return tier === 'pro' || tier === 'elite';
}

/** Verification filter helper (corrected AND logic — matches web queries.ts). */
export function isProviderVerified(status: ProviderStatus, verifiedAt: string | null): boolean {
  return verifiedAt != null && (status === 'active' || status === 'verified');
}

/** Tier sort rank: elite (0) > pro (1) > everything else (2). */
export function tierRank(tier: string): number {
  return tier === 'elite' ? 0 : tier === 'pro' ? 1 : 2;
}
