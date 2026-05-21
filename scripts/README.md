# scripts/

Workspace shell scripts. Bash-only, no Node dependency.

## Worktree scripts

Three thin wrappers around `git worktree` for parallel feature work:

- `worktree-create.sh <branch>` — creates a sibling worktree at `<parent-of-repo>/<repo-name>-<branch>/` and checks out `<branch>` (creating it from HEAD if it doesn't exist).
- `worktree-list.sh` — lists all worktrees with the current one marked.
- `worktree-remove.sh <branch>` — removes the sibling worktree directory and the git bookkeeping. Does not delete the branch itself.

### Layout

Sibling-directory layout, not `.worktrees/`. Each worktree lives at `<parent-of-repo>/<repo-name>-<branch>/`, so for a repo at `~/Documents/psychage-master-app/` and a branch `feat/foo`, the worktree lands at `~/Documents/psychage-master-app-feat-foo/`. Slashes in branch names become dashes to keep paths flat.

### When to use

Parallel feature work without `git stash` / `git checkout` ceremony. One session per worktree, each session pinned to a different branch, all sharing the same git history. Useful when reviewing one feature while continuing work on another, or running long test suites in the background without blocking new edits.

### Origin

Surfaced in Phase 5 Slice 3 close-out as the workspace's parallel-agent infrastructure. The 5-layer enforcement (spec-review intersection, worktree-add fail-closed install, pre-commit hook, CI intersection, pre-merge spec-review re-run) builds on this script trio.
