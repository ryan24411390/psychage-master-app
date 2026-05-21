#!/usr/bin/env bash
set -euo pipefail

# Lists all git worktrees for this repo. Wrapper around `git worktree list`
# with light formatting so the current worktree stands out and paths are easy
# to scan when several parallel sessions are active.

repo_root="$(git rev-parse --show-toplevel)"
current_worktree="${repo_root}"

git worktree list --porcelain | awk -v current="${current_worktree}" '
  /^worktree / { wt = substr($0, 10); next }
  /^HEAD /     { head = substr($0, 6); next }
  /^branch /   { branch = substr($0, 8); sub("refs/heads/", "", branch); next }
  /^detached/  { branch = "(detached)"; next }
  /^bare/      { branch = "(bare)"; next }
  /^$/ {
    if (wt != "") {
      marker = (wt == current) ? "*" : " "
      printf "%s  %-60s  %s\n", marker, wt, branch
      wt = ""; head = ""; branch = ""
    }
  }
  END {
    if (wt != "") {
      marker = (wt == current) ? "*" : " "
      printf "%s  %-60s  %s\n", marker, wt, branch
    }
  }
'
