#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <branch-name>" >&2
  echo "" >&2
  echo "Removes the sibling worktree at <parent-of-repo>/<repo-name>-<branch-name>/." >&2
  echo "Does NOT delete the branch itself — only the worktree directory and its" >&2
  echo "git-internal bookkeeping. Use 'git branch -D <branch-name>' separately if" >&2
  echo "you also want the branch gone." >&2
  exit 2
}

if [[ $# -ne 1 ]]; then
  usage
fi

branch="$1"

if [[ -z "${branch}" ]]; then
  usage
fi

repo_root="$(git rev-parse --show-toplevel)"
repo_name="$(basename "${repo_root}")"
parent_dir="$(dirname "${repo_root}")"
sanitized_branch="${branch//\//-}"
target_path="${parent_dir}/${repo_name}-${sanitized_branch}"

if [[ ! -d "${target_path}" ]]; then
  echo "error: no worktree directory at ${target_path}" >&2
  echo "list active worktrees with ./scripts/worktree-list.sh" >&2
  exit 1
fi

git worktree remove "${target_path}"

echo "worktree removed: ${target_path}"
echo "branch '${branch}' still exists — delete with 'git branch -D ${branch}' if desired."
