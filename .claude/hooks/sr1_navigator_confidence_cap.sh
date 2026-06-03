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
MODE="pretool"
if [[ "${1:-}" == "--mode=stop" ]]; then
  MODE="stop"
fi

# ---- Determine which file(s) to scan ----
if [[ "$MODE" == "pretool" ]]; then
  # PreToolUse: read JSON from stdin, extract file path + content via node
  # (node is already a husky prereq; no extra runtime dependency).
  INPUT_JSON=$(cat)
  TARGET_FILE=$(printf '%s' "$INPUT_JSON" | node -e '
const j = JSON.parse(require("fs").readFileSync(0, "utf8"));
const t = j.tool_input || {};
process.stdout.write(t.file_path || t.path || "");
' 2>/dev/null || echo "")

  TARGET_CONTENT=$(printf '%s' "$INPUT_JSON" | node -e '
const j = JSON.parse(require("fs").readFileSync(0, "utf8"));
const t = j.tool_input || {};
process.stdout.write(t.content || t.new_string || "");
' 2>/dev/null || echo "")

  if [[ -z "$TARGET_FILE" ]]; then
    # No file path = nothing to check (e.g., a Read or Bash call that matched the regex)
    exit 0
  fi
elif [[ "$MODE" == "stop" ]]; then
  # Stop: scan the entire diff against HEAD
  TARGET_FILE="<all-staged-files>"
  TARGET_CONTENT=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "")
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

# ---- Extract forbidden patterns from constitution.md YAML front-matter ----
# shellcheck source=./_parse-constitution.sh
. "$(dirname "$0")/_parse-constitution.sh"
PATTERNS=$(extract_constitution_list "$CONSTITUTION" "$RULE_ID" "forbidden_regex")

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
  if echo "$CLEANED" | grep -E -q -- "$pattern"; then
    VIOLATION_FOUND=1
    MATCH=$(echo "$CLEANED" | grep -E -- "$pattern" | head -3)
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
