#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <branch-name>" >&2
  echo "" >&2
  echo "Creates a sibling worktree at <parent-of-repo>/<repo-name>-<branch-name>/" >&2
  echo "and checks out <branch-name>. If the branch does not exist, it is created" >&2
  echo "from the current HEAD." >&2
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

if [[ -e "${target_path}" ]]; then
  echo "error: target path already exists: ${target_path}" >&2
  echo "remove it first (./scripts/worktree-remove.sh ${branch}) or pick a different branch name." >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${branch}"; then
  git worktree add "${target_path}" "${branch}"
else
  git worktree add -b "${branch}" "${target_path}"
fi

echo ""
echo "worktree created:"
echo "  branch: ${branch}"
echo "  path:   ${target_path}"
echo ""
echo "cd into it:"
echo "  cd \"${target_path}\""
