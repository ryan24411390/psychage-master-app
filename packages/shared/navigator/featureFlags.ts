/**
 * Symptom Navigator — Feature Flags (shared)
 *
 * Controls phased rollout of new conditions via a runtime check supplied
 * by the consuming app. The original 16 conditions (no tier assignment)
 * are always enabled.
 *
 * The psychage-v2 web app reads `VITE_NAV_TIER{1..6}_ENABLED` from
 * `import.meta.env`. Mobile will read from `expo-constants`. Neither is
 * present in this shared package, so a consumer-supplied
 * `isTierEnabled(tier)` predicate is injected; absent injection, all
 * tiered conditions pass through (safe default for tests + apps that
 * want every condition active).
 *
 * Per Sacred Rule #4 / recon §1.3: env access lives in the app, not in
 * shared.
 */

import type { ConditionWithMappings } from "./types";

type Tier = 1 | 2 | 3 | 4 | 5 | 6;

const TIER_MAP: Record<string, Tier> = {
  // Tier 1
  SCZ: 1,
  BPD: 1,
  BN: 1,
  PGD: 1,
  // Tier 2
  ASD: 2,
  BDD: 2,
  DPDR: 2,
  SPP: 2,
  PMDD: 2,
  // Tier 3
  SADD: 3,
  HD: 3,
  SSD: 3,
  IAD: 3,
  AVPD: 3,
  SEPA: 3,
  // Tier 4 (Phase 4 — personality & high clinical severity)
  NPD: 4,
  ASPD: 4,
  CPTSD: 4,
  DID: 4,
  // Tier 5 (Phase 4 — moderate-high complexity)
  DPD: 5,
  SZPD: 5,
  OSDD: 5,
  ASD_ACUTE: 5,
  TTM: 5,
  SPD_EXCOR: 5,
  // Tier 6 (Phase 4 — extensions)
  IED: 6,
  HYPER: 6,
  ARFID: 6,
  CYC: 6,
};

export type IsTierEnabledFn = (tier: Tier) => boolean;

/**
 * Filter conditions based on feature flag tiers.
 *
 * @param conditions  Knowledge-base conditions.
 * @param isTierEnabled  Optional consumer-supplied predicate. When omitted,
 *   every tier is treated as enabled (safe default for the shared package's
 *   own tests and for callers that explicitly want all conditions).
 */
export function filterByFeatureFlags(
  conditions: ConditionWithMappings[],
  isTierEnabled?: IsTierEnabledFn,
): ConditionWithMappings[] {
  return conditions.filter((c) => {
    const tier = TIER_MAP[c.id];
    if (!tier) return true;
    if (!isTierEnabled) return true;
    return isTierEnabled(tier);
  });
}

/** Tiers currently considered enabled by the supplied predicate (UI/debug). */
export function getEnabledTiers(isTierEnabled?: IsTierEnabledFn): Tier[] {
  const tiers: Tier[] = [1, 2, 3, 4, 5, 6];
  if (!isTierEnabled) return tiers;
  return tiers.filter(isTierEnabled);
}
