/**
 * Symptom Navigator — Hard-coded Constants
 *
 * Single source of truth for invariants enforced across the engine.
 *
 * CONFIDENCE_CAP is the Sacred Rule #1 ceiling: 0.75 absolute maximum.
 * No code path may produce a relevance score above this value, regardless
 * of what `MatchingConfig.confidence_cap` is set to in the knowledge base.
 *
 * Critical Finding #1 (audits/phase5-shared-lift-recon.md §1.5): config-driven
 * cap could be raised silently via a malformed Supabase response. CONFIDENCE_CAP
 * floors the effective cap at runtime via Math.min(config.confidence_cap, CONFIDENCE_CAP).
 *
 * Critical Finding #2: prior to lift, psychage-v2 had a second declaration at
 * src/lib/admin/constants.ts:67. This file is the lifted-package single source;
 * the psychage-v2 admin constant will be reconciled when that app migrates.
 */

export const CONFIDENCE_CAP = 0.75 as const;
