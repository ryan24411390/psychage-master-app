// Feature-flag adapter.
//
// Slice 7 shipped a `() => true` constant predicate behind the
// `IsTierEnabledFn` seam. Slice 8 swaps that constant for a read against
// persisted TierFlags: a default-seeded `{ 1..6: true }` shape stamped at
// SCHEMA_VERSION 1 (Sacred Rule #13) lives at `mobile:tier-flags` in the
// platform Storage. The default keeps Slice 7's all-tiers-surface semantics
// — the seam test (`navigator-seam.test.ts`) passes unchanged.
//
// The persisted shape is read once at module load via `loadTierFlags()`,
// which runs the migrator (default-seed if absent, forward-walk transforms
// if older) and stamps the current version back to storage. The flags
// reference is then frozen for the process lifetime — future toggle UI
// (out of scope this slice) will need to invalidate + re-read.

import type { IsTierEnabledFn } from "@psychage/shared/navigator";

import { loadTierFlags, type Tier } from "@/lib/persistence/tier-flags";

import { storage } from "./storage";

export type { IsTierEnabledFn };

const flags = loadTierFlags(storage);

export const isTierEnabled: IsTierEnabledFn = (tier) => flags[tier as Tier];
