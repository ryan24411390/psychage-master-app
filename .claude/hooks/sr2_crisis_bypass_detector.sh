#!/usr/bin/env bash
# ============================================================
# SR-2 — Crisis detection cannot be bypassed
# ============================================================
# Reads patterns from constitution.md YAML front-matter.
# Detects any code that disables, gates, or feature-flags crisis detection.
# Exit codes: 0 = allow, 2 = block.
# ============================================================

set -euo pipefail

CONSTITUTION="${CLAUDE_PROJECT_DIR:-$(pwd)}/constitution.md"
RULE_ID="SR-2"
RULE_NAME="crisis_bypass_detector"
RULE_HUMAN="Crisis detection cannot be bypassed"

# ---- Bail-out: constitution.md must exist ----
if [[ ! -f "$CONSTITUTION" ]]; then
  echo "BLOCKED ($RULE_ID): constitution.md not found at $CONSTITUTION" >&2
  exit 2
fi

MODE="pretool"
if [[ "${1:-}" == "--mode=stop" ]]; then
  MODE="stop"
fi

# ---- Determine target ----
if [[ "$MODE" == "pretool" ]]; then
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
  [[ -z "$TARGET_FILE" ]] && exit 0
elif [[ "$MODE" == "stop" ]]; then
  TARGET_FILE="<all-staged-files>"
  TARGET_CONTENT=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "")
fi

# ---- File-glob check ----
should_check_file() {
  local f="$1"
  [[ -z "$f" ]] && return 1
  case "$f" in
    *.ts|*.tsx|*.js|*.jsx) ;;
    *) return 1 ;;
  esac
  case "$f" in
    *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) return 1 ;;
    */__tests__/*|*/__fixtures__/*) return 1 ;;
  esac
  return 0
}

if [[ "$MODE" == "pretool" ]] && ! should_check_file "$TARGET_FILE"; then
  exit 0
fi

# ---- Extract patterns ----
# shellcheck source=./_parse-constitution.sh
. "$(dirname "$0")/_parse-constitution.sh"
PATTERNS=$(extract_constitution_list "$CONSTITUTION" "$RULE_ID" "forbidden_regex")

if [[ -z "$PATTERNS" ]]; then
  echo "BLOCKED ($RULE_ID): could not parse patterns from constitution.md" >&2
  exit 2
fi

# ---- Scan ----
VIOLATION_FOUND=0
VIOLATION_DETAILS=""

while IFS= read -r pattern; do
  [[ -z "$pattern" ]] && continue
  # Use case-insensitive match for crisis-bypass detection (variable casing varies)
  CLEANED=$(echo "$TARGET_CONTENT" | sed -E 's|//.*$||g; s|/\*.*\*/||g')
  if echo "$CLEANED" | grep -E -i -q -- "$pattern"; then
    VIOLATION_FOUND=1
    MATCH=$(echo "$CLEANED" | grep -E -i -- "$pattern" | head -3)
    VIOLATION_DETAILS+="Pattern: $pattern\nMatched lines:\n$MATCH\n---\n"
  fi
done <<< "$PATTERNS"

# ---- Decide ----
if [[ $VIOLATION_FOUND -eq 1 ]]; then
  cat >&2 <<MSG
BLOCKED ($RULE_ID): $RULE_HUMAN

File: $TARGET_FILE
Mode: $MODE

This change introduces code that disables, gates, feature-flags, or
otherwise bypasses crisis detection. Crisis-symptom detection halts
the Symptom Navigator at any severity and is a Sacred Rule per
constitution.md.

There is no flag, branch, environment variable, configuration, or
feature gate that may disable this. Adding one is a Sacred Rule
violation regardless of the stated rationale (testing, A/B, "temp
only," staging-only, etc).

Details:
$VIOLATION_DETAILS

How to fix: remove the bypass logic. If your intent is to test
crisis-flow behavior, use a dedicated test fixture under
__tests__/ or __fixtures__/ — those directories are excluded from
this rule per constitution.md's file_globs_exclude list.

To override (not recommended): bypass commits CANNOT bypass Sacred
Rule surface per constitution.md. This rule cannot be bypassed.
MSG
  exit 2
fi

exit 0
