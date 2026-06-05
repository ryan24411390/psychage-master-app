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

## 4. `.phase` semantics

`.claude/workspace.json.phase` tracks the **currently-active (in-flight) phase**. It flips at kickoff — i.e., at the start of that phase's first slice — not at the close of the prior phase. `phaseRoadmap[N].status` (`"pending"` / `"in-progress"` / `"complete"`) is the per-phase lifecycle truth.

**Sequence at Phase N kickoff:**

- `.phase = N`
- `phaseRoadmap[N].status = "in-progress"`
- `.phaseLabel` updated to a short slug reflecting phase N (mirrors prior precedent; the verbose roadmap label remains in `phaseRoadmap[N].label`)

**Sequence at Phase N close:**

- `phaseRoadmap[N].status = "complete"` only
- `.phase` does NOT change; it bumps at the next phase's kickoff

**Sub-phases (N.A, N.B):** do not bump `.phase`. The parent phase remains active across sub-phases.

**Rationale:** Phases 4.A, 4.B, and 5 all closed without bumping `.phase` or `.phaseLabel`, leaving the field stale relative to `phaseRoadmap`. Recon Slice 1 of Phase 6 (§5.2) surfaced three resolution options; option (a) chosen because it matches human-language intuition ("we're in phase 6") and is future-proof against tooling that may consume `.phase` (status-line scripts, SessionStart hooks).

**Surfaced:** Phase 6 Slice 1 recon (PR #14). Applied retroactively in Phase 6 Slice 2.

**Enforcement:** Convention. No CI rule; PR-review check at phase-kickoff and phase-close commits.

## 5. Spec-workflow commit format

Commits produced by a spec-workflow phase (`/spec-discovery` → `/spec-implement`) use the `docs(spec)` type and tag the phase:

```text
docs(spec): <feature-slug> <artifact> [phase-N]
```

**Example:** `docs(spec): daily-check-in discovery brief [phase-11]` (commit `05b30c6`).

**Rationale:** The `[phase-N]` tag makes spec-artifact commits scannable against `phaseRoadmap`, and the `docs(spec)` type distinguishes specification artifacts (brief, requirements, design, tasks) from the `feat`/`chore` commits that implement them.

**Surfaced:** Phase 11 daily-check-in discovery.

**Enforcement:** Convention. PR-review check on spec-artifact commits.
