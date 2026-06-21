# Running parallel agent sessions safely

Multiple agents sharing one working directory **race**: they revert each other's
uncommitted edits and `HEAD` switches mid-operation. The fix is isolation — one git
worktree per running agent. This file is the operational runbook; the underlying rule
lives in [`CLAUDE.md`](./CLAUDE.md) §9 ("Worktrees for parallel work").

## Rules

1. **One worktree per running agent.** Never point two agents at the same working directory.
2. **Launch via the helper.** Don't hand-roll worktrees:

   ```bash
   scripts/new-worktree.sh <group>
   ```

   This creates `../psychage-wt-<group>` from a fresh `origin/main` on a new
   `feature/<group>` branch and runs `pnpm install`. It refuses to clobber an existing
   directory or branch.
3. **Declare file ownership.** Per `CLAUDE.md` §9, no two parallel tasks touch the same
   file. Split work so each worktree owns a disjoint set of paths.
4. **Prune when the branch merges.** Once `feature/<group>` is merged, remove its worktree:

   ```bash
   git worktree remove ../psychage-wt-<group>
   git worktree prune          # clears any stale metadata
   ```

5. **Never run two agents in the main checkout** (`~/dev/psychage-fresh`). Keep it for
   `main`, reviews, and maintenance only.

## Why

A previous multi-agent run shared a single checkout: two sessions reverted each other's
working-tree edits, and a long-running commit landed on the wrong `HEAD` because another
agent switched branches mid-operation. Worktrees give each agent its own index, `HEAD`,
and working tree — the only thing they share is the object store, which is append-only and
safe to share.

## Quick reference

```bash
# start a new isolated session
scripts/new-worktree.sh symptom-navigator

# list active worktrees
git worktree list

# finish: after the branch merges
git worktree remove ../psychage-wt-symptom-navigator
git worktree prune
```
