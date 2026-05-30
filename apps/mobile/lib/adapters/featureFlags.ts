// Feature-flag adapter — Slice 7 stub.
//
// `() => true` constant predicate behind the `IsTierEnabledFn` seam (per
// rules/conventions.md #3 — dependency-injection at the navigator call
// site). Every tier surfaces while no toggle UI exists. Slice 8 swaps this
// constant for a read against persisted TierFlags hydrated through the
// storage adapter.

import type { IsTierEnabledFn } from '@psychage/shared/navigator';

export type { IsTierEnabledFn };

export const isTierEnabled: IsTierEnabledFn = () => true;
