# Repo conventions

Repo-wide conventions surfaced during phase work. Add new conventions here as they emerge.

## 1. Cross-platform color sync

When color tokens are edited on one platform, the equivalent edits must land on the other platform in the same PR. No two-PR drift on shared color identity.

**Applies to:**
- `tokens/web.tokens.json` — `color.*` values
- `tokens/mobile.tokens.json` — `color.*` values

**Exempt:**
- Platform-only tokens (e.g., `haptic.*` and `motion.breath` are mobile-only; no web equivalent)
- Single-platform additions (a new mobile-only color stays mobile-only)

**Rationale:** Shared brand color identity is a load-bearing brand commitment. A two-PR sync window invites drift — `#1A9B8C` on web while mobile temporarily reads `#1B9B8C` is exactly what the design system exists to prevent. Surfaced in Phase 4.B (see `learnings.md`).

**Enforcement:** PR review check. No CI rule yet; could be added if drift surfaces.

## 2. `workspace.json.phaseRoadmap[].closedSHAs`

`closedSHAs` tracks **all** commit SHAs that contributed to closing a phase — feat commits, chore commits, transition commits, fix commits — in chronological order.

**Appended:**
- In the same PR as the commit, when ordering allows.
- In a follow-up housekeeping commit when ordering doesn't allow (e.g., a chore close-out commit that ships in the same PR as a feat commit will need to be appended by a follow-up, since the chore SHA doesn't exist until the feat lands).

**Rationale:** Surfaced in Phase 4.B (PR #7). The schema previously didn't clarify whether feat-only or all commits — this convention closes the ambiguity.

## 3. Cross-repo lift — dependency-injection seam

When code is lifted from psychage-v2 (or any app-side repo) into `packages/shared/`, and the lifted code depends on an app-side adapter (feature flags, storage, analytics, config), break the dependency by **injecting the adapter behavior as a parameter** rather than importing the adapter directly.

**Pattern:**

```typescript
// In packages/shared/<module>/
export function someLiftedFunction(
  args: SomeArgs,
  isTierEnabled: (tier: string) => boolean = () => true,
) { ... }
```

**Rationale:** Lifted code cannot import app-side adapters without coupling `packages/shared` back to app-specific paths. Injecting adapter behavior as a parameter with a sensible default (typically `() => true` or `noop`) preserves both the lifted code's autonomy and the app's ability to plug in the real adapter.

**Surfaced:** Phase 5 Slice 2 (PR #11). Applied to `packages/shared/navigator/featureFlags.ts`'s `isTierEnabled` predicate (consumed transitively by `engine.ts` via `filterByFeatureFlags`).

**Enforcement:** Code-review check during future lifts.
