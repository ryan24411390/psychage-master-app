#!/usr/bin/env bash
# ============================================================
# SR-1 — Navigator confidence cap (0.75 absolute max)
# ============================================================
# Reads patterns from constitution.md YAML front-matter.
# Hook input: PreToolUse JSON via stdin (or --mode=stop for belt-and-suspenders).
# Exit codes: 0 = allow, 2 = block (hard fail).
#
# This script is POSIX-compatible bash (no jq required for fallback path,
# though jq is preferred when available).
# ============================================================

set -euo pipefail

CONSTITUTION="${CLAUDE_PROJECT_DIR:-$(pwd)}/constitution.md"
RULE_ID="SR-1"
RULE_NAME="navigator_confidence_cap"
RULE_HUMAN="Navigator confidence cap (0.75 absolute max)"

# ---- Bail-out: if constitution.md doesn't exist, fail closed ----
if [[ ! -f "$CONSTITUTION" ]]; then
  echo "BLOCKED ($RULE_ID): constitution.md not found at $CONSTITUTION" >&2
  echo "Sacred Rules cannot be validated without constitution.md. Restore it before proceeding." >&2
  exit 2
fi

# ---- Mode selection: PreToolUse (default) or Stop ----
# Optional --base-ref=<ref> switches Stop mode to scan branch diff
# (<ref>...HEAD, added lines only) instead of staged diff. Husky calls
# --mode=stop with no flag; CI adds --base-ref=origin/main.
MODE="pretool"
BASE_REF=""
for arg in "$@"; do
  case "$arg" in
    --mode=stop) MODE="stop" ;;
    --base-ref=*) BASE_REF="${arg#--base-ref=}" ;;
  esac
done

# ---- Determine which file(s) to scan ----
if [[ "$MODE" == "pretool" ]]; then
  # PreToolUse: read JSON from stdin, extract file path
  INPUT_JSON=$(cat)
  TARGET_FILE=$(echo "$INPUT_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
# Different tool inputs have file path under different keys
tool_input = data.get('tool_input', {})
file_path = tool_input.get('file_path') or tool_input.get('path') or ''
print(file_path)
" 2>/dev/null || echo "")

  # Determine the content being written/edited
  TARGET_CONTENT=$(echo "$INPUT_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
content = tool_input.get('content') or tool_input.get('new_string') or ''
print(content)
" 2>/dev/null || echo "")

  if [[ -z "$TARGET_FILE" ]]; then
    # No file path = nothing to check (e.g., a Read or Bash call that matched the regex)
    exit 0
  fi
elif [[ "$MODE" == "stop" ]]; then
  if [[ -n "$BASE_REF" ]]; then
    # Branch-diff mode: validate ref exists — fail closed if not.
    if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
      echo "BLOCKED ($RULE_ID): base ref '$BASE_REF' not found" >&2
      exit 2
    fi
    TARGET_FILE="<branch-diff:${BASE_REF}...HEAD>"
    # Added lines only: --unified=0 trims context; ^+ keeps additions;
    # ^+++ excludes file headers; sed strips leading +.
    # `|| true` on grep stages so empty matches don't trip pipefail.
    TARGET_CONTENT=$(git diff --unified=0 "${BASE_REF}...HEAD" 2>/dev/null \
      | { grep '^+' || true; } \
      | { grep -v '^+++' || true; } \
      | sed 's/^+//')
  else
    # Stop: scan the entire diff against HEAD
    TARGET_FILE="<all-staged-files>"
    TARGET_CONTENT=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "")
  fi
fi

# ---- File-glob check: skip test fixtures, skip non-code files ----
should_check_file() {
  local f="$1"
  [[ -z "$f" ]] && return 1
  # Match include patterns
  case "$f" in
    *.ts|*.tsx|*.js|*.jsx) ;;
    *) return 1 ;;
  esac
  # Reject excludes
  case "$f" in
    *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) return 1 ;;
    */__tests__/*|*/__fixtures__/*) return 1 ;;
  esac
  return 0
}

if [[ "$MODE" == "pretool" ]] && ! should_check_file "$TARGET_FILE"; then
  exit 0  # Not a file we check; allow.
fi

# ---- Stop mode: narrow TARGET_CONTENT to files matching this rule's globs ----
# Without this, stop-mode would scan added lines from ALL changed files
# (including .md docs, configs, fixtures), bypassing file_globs_exclude.
if [[ "$MODE" == "stop" ]]; then
  if [[ -n "$BASE_REF" ]]; then
    DIFF_RANGE=("${BASE_REF}...HEAD")
  else
    DIFF_RANGE=(--cached)
  fi
  FILTERED=""
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    if should_check_file "$f"; then
      added=$(git diff --unified=0 "${DIFF_RANGE[@]}" -- "$f" 2>/dev/null \
        | { grep '^+' || true; } | { grep -v '^+++' || true; } | sed 's/^+//')
      FILTERED+="$added"$'\n'
    fi
  done <<< "$(git diff --name-only "${DIFF_RANGE[@]}" 2>/dev/null)"
  TARGET_CONTENT="$FILTERED"
fi

# ---- Extract forbidden patterns from constitution.md YAML front-matter ----
PATTERNS=$(python3 <<EOF
import re, yaml
text = open("$CONSTITUTION").read()
match = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
if not match:
    exit(1)
yml = yaml.safe_load(match.group(1))
patterns = yml['sacred_rules']['$RULE_ID']['patterns']['forbidden_regex']
for p in patterns:
    print(p)
EOF
)

if [[ -z "$PATTERNS" ]]; then
  echo "BLOCKED ($RULE_ID): could not parse forbidden patterns from constitution.md" >&2
  exit 2
fi

# ---- Run each pattern against the target content ----
VIOLATION_FOUND=0
VIOLATION_DETAILS=""

while IFS= read -r pattern; do
  [[ -z "$pattern" ]] && continue
  # Strip comments from content first (avoid false positives in commented code)
  CLEANED=$(echo "$TARGET_CONTENT" | sed -E 's|//.*$||g; s|/\*.*\*/||g')
  if grep -E -q -- "$pattern" <<< "$CLEANED"; then
    VIOLATION_FOUND=1
    MATCH=$(grep -E -- "$pattern" <<< "$CLEANED" | head -3)
    VIOLATION_DETAILS+="Pattern: $pattern\nMatched lines:\n$MATCH\n---\n"
  fi
done <<< "$PATTERNS"

# ---- Decide ----
if [[ $VIOLATION_FOUND -eq 1 ]]; then
  cat >&2 <<MSG
BLOCKED ($RULE_ID): $RULE_HUMAN

File: $TARGET_FILE
Mode: $MODE

This change introduces a confidence value above 0.75 in non-test code.
The Symptom Navigator's confidence ceiling is enforced three times in
the codebase (geometric mean ceiling, post-modifier ceiling, output
ceiling) and is a Sacred Rule per constitution.md.

Confidence values in (0.75, 1.0] read as diagnosis to users; the gap
between 0.75 and 1.0 exists specifically to communicate "this is a
guide, not a verdict."

Details:
$VIOLATION_DETAILS

How to fix: cap any confidence value at 0.75. If you believe this
violation is a false positive (e.g., the value is in a comment or
test fixture), the file may need to move to a directory that matches
the exclude globs in constitution.md.

To override (not recommended): commit with [bypass] tag in subject
line, but only if change is <20 lines and has no behavior change.
Bypass commits exceeding 30% of total are flagged for workflow review.
MSG
  exit 2
fi

# ---- Pass ----
exit 0
