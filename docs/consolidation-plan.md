# Consolidation & recovery plan — psychage-master-app

**Date:** 2026-06-15 · **Author:** consolidation sweep (Claude Code)
**Baseline `origin/main` at sweep:** `e5f3108` → moved to `c1fb1ca` → `5831903` *during* the sweep (the repo was being actively merged in parallel).

## Why this document exists

The `~/Documents` checkout is iCloud-synced; files get evicted to "dataless"
stubs. **Committing a dataless file commits emptiness** — that is how work was
believed lost before. Prior session reports could not be trusted, so the sweep
established git ground truth from **objects** (`git show` / `git cat-file`, which
are eviction-immune) — never the working tree — then reconciled it against the
attempted-work history and safely durably-pushed every piece of real work to
`origin`.

**Headline finding:** almost nothing was actually lost. The "lost #72/#74"
premise was **stale**. While the audit ran, a parallel active session merged the
entire open-PR stack to `main`. The sweep's net new actions were small: preserve
two unpushed branches and fix the red `main`.

## Method / guarantees

- Ground truth from objects, not the working tree (dataless-immune).
- **Preserving an existing commit = pushing existing objects** → cannot push a
  phantom. Only *new* commits risk capturing dataless content; the one new branch
  here (`fix/main-typecheck`) was authored in a fresh worktree with verified-real
  files and a clean `tsc`.
- Every push **verified on the remote** (`git show origin/<ref>:<path>` returns
  real bytes), not locally.
- **No merges to `main`** were performed (it was red + moving + review-gated).
  Never raced the active session; never touched its branches/working tree.

---

## Reconciliation table (attempted work → real state → action)

| Item | Real git state | Action taken | Verified |
|---|---|---|---|
| PRs **#24–#73** | on `origin/main` | none (done) | content real, 0 phantom |
| PRs **#74,75,77,78,79,80,81,82,83** | merged to `origin/main` **by the active session during the sweep** (via `tmp-*` integration branches to resolve overlap) | none (already preserved) | spot-checked blobs non-empty; **0 zero-byte tracked files** in `origin/main` |
| PR **#41** docs/adr | merged to `origin/main` during sweep | none | — |
| **`feat/sleep-architect`** (5 commits, native Sleep Architect port; was **no PR, no remote**) | finished, unpushed — genuine loss risk | **pushed → `origin/feat/sleep-architect`; PR #84** (preservation; *do not merge as-is*, needs rebase: was 5 ahead / 28 behind) | `git show origin/feat/sleep-architect:packages/shared/sleep/index.ts` = 2973 B; 43 files / 4059 insertions real |
| **`chore/verify-checkin-rls`** (`scripts/verify-checkin-rls.ts`, 18 953 B RLS harness; **absent from main**) | finished, unpushed | **pushed → `origin/chore/verify-checkin-rls`** (backup branch; landing it needs cherry-picking just the script — the branch also carries a superseded dup sleep-spine commit; no PR opened) | script 18 953 B real on remote |
| **`main` RED** — `typecheck + test` job fails at Typecheck | 2 type errors from overlapping-snapshot merges (`#74×#83`, `#77×#81`) | **`fix/main-typecheck`; PR #85** — `tsc --noEmit` clean locally (*do not merge until reviewed*) | both fixes confirmed on `origin/fix/main-typecheck`; diff = exactly 2 files |
| **`feat/relationship-health-native`** (`d4f7bd0`, real ~30-file native port, unpushed) | **ACTIVE session** — advanced `f73f270 → d4f7bd0` live during the audit | **left entirely alone** (per owner). Flagged: owning session must push/PR it | n/a |
| **`feat/mindmate-mobile` (#76)** + `tmp-mindmate` | open PR, **red CI**; active session integrating | left alone, flagged | n/a |
| dangling `git fsck` commits | all "WIP on \<already-merged/branched\>" autosave debris | none | no unique lost feature |
| stale/superseded/debris | `feat/visual-redesign` (dup sleep spine), `backup/pre-merge-train-2026-06-11`, `chore/version-hygiene-docs-a9`, `feat/phase-11-daily-checkin` (brief landed via #35), `feat/phase-6-slice-8-persisted-tier-toggle`, `feature/crisis-dataset-supabase` (crisis landed via #65/#73), `ci/verify-sr-redtest` + `sr-smoke-redtest` (intentional SR-violation test debris — never merge), ~25 already-merged `phase-*`/`recon/`/`docs/` branches, `feat-safety-enforcement` worktree (dataless but tip already in `main`) | none (ignore/cleanup) | — |

### Phantom / lost = **NONE**
No real work was unrecoverable. No phantom/zero-byte file was committed by anyone
(checked across the full `origin/main` tree). Nothing needs re-doing.

---

## Branch-overlap note (why `main` went red)

The "open PR" cluster (#74,75,77,78,82,83) were **near-duplicate full-tree
snapshots** — each ~150 files, sharing 87–146 files with every other — because
each feature worktree was branched from a shared dirty checkout carrying all the
in-flight features. They were individually clean vs `main` but **not cleanly
stackable**. The active session landed them with `tmp-*` integration branches;
the residue was the two type errors fixed in PR #85. **Do not attempt to re-land
or re-slice that cluster** — it is owned and already merged.

---

## Open follow-ups (NOT done here — gated/owned)

1. **Merge PR #85** to restore green `main` (after review).
2. **Rebase + review PR #84** (sleep) onto current `main`, then merge; clinical
   review where applicable.
3. **Land the RLS script** from `origin/chore/verify-checkin-rls` via a clean
   cherry-pick of `scripts/verify-checkin-rls.ts` (drop the dup sleep commit).
4. **Owning session** to push/PR `feat/relationship-health-native`.
5. **mindmate #76** — fix red CI; owned by the active session.
6. Branch cleanup: delete the ~25 merged + debris/test branches and the stale
   worktrees (`feat-safety-enforcement`, etc.).

## Status legend
- **Preserved on `origin`, awaiting merge:** #84 (sleep), `chore/verify-checkin-rls`, #85 (fix).
- **Flagged / left alone (active or red):** `feat/relationship-health-native`, #76 mindmate, red `main` (until #85).
- **Phantom / lost:** none.
