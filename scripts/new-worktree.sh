#!/usr/bin/env bash
#
# new-worktree.sh — create an isolated git worktree for a parallel agent session.
#
# Each running agent gets its own working directory + branch so concurrent
# sessions never race on the same checkout (see CLAUDE.md §9 and PARALLEL.md).
#
# Usage:
#   scripts/new-worktree.sh <group>
#
# Creates  ../psychage-wt-<group>  from a fresh fetch of origin/main on a new
# branch  feature/<group>,  then runs `pnpm install` inside it.
#
# Safe by design: never force, never delete, never touch main. If the branch or
# directory already exists, it stops rather than clobbering anything.

set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "${1:-}" ]; then
  echo "usage: scripts/new-worktree.sh <group>" >&2
  echo "  e.g. scripts/new-worktree.sh daily-checkin  →  ../psychage-wt-daily-checkin (feature/daily-checkin)" >&2
  exit 1
fi

group="$1"
branch="feature/${group}"

# Resolve repo root so relative paths are stable regardless of cwd.
repo_root="$(git rev-parse --show-toplevel)"
parent_dir="$(dirname "$repo_root")"
worktree_path="${parent_dir}/psychage-wt-${group}"

if [ -e "$worktree_path" ]; then
  echo "ERROR: $worktree_path already exists — pick another group name or remove it first." >&2
  exit 1
fi

if git -C "$repo_root" show-ref --verify --quiet "refs/heads/${branch}"; then
  echo "ERROR: branch ${branch} already exists. Use a different group or delete the branch first." >&2
  exit 1
fi

echo "→ Fetching origin/main…"
git -C "$repo_root" fetch origin main

echo "→ Creating worktree ${worktree_path} on ${branch} (from origin/main)…"
git -C "$repo_root" worktree add -b "$branch" "$worktree_path" origin/main

echo "→ Installing dependencies (pnpm install)…"
( cd "$worktree_path" && pnpm install )

echo
echo "✓ Worktree ready:"
echo "    path:   $worktree_path"
echo "    branch: $branch"
echo
echo "Open ONE agent in this directory. When ${branch} merges, remove it with:"
echo "    git worktree remove $worktree_path"
