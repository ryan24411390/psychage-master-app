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

# Optional --base-ref=<ref> switches Stop mode to scan branch diff
# (<ref>...HEAD, added lines only) instead of staged diff.
MODE="pretool"
BASE_REF=""
for arg in "$@"; do
  case "$arg" in
    --mode=stop) MODE="stop" ;;
    --base-ref=*) BASE_REF="${arg#--base-ref=}" ;;
  esac
done

# ---- Determine target ----
if [[ "$MODE" == "pretool" ]]; then
  INPUT_JSON=$(cat)
  TARGET_FILE=$(echo "$INPUT_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
print(tool_input.get('file_path') or tool_input.get('path') or '')
" 2>/dev/null || echo "")
  TARGET_CONTENT=$(echo "$INPUT_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
print(tool_input.get('content') or tool_input.get('new_string') or '')
" 2>/dev/null || echo "")
  [[ -z "$TARGET_FILE" ]] && exit 0
elif [[ "$MODE" == "stop" ]]; then
  if [[ -n "$BASE_REF" ]]; then
    if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
      echo "BLOCKED ($RULE_ID): base ref '$BASE_REF' not found" >&2
      exit 2
    fi
    TARGET_FILE="<branch-diff:${BASE_REF}...HEAD>"
    TARGET_CONTENT=$(git diff --unified=0 "${BASE_REF}...HEAD" 2>/dev/null \
      | { grep '^+' || true; } \
      | { grep -v '^+++' || true; } \
      | sed 's/^+//')
  else
    TARGET_FILE="<all-staged-files>"
    TARGET_CONTENT=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "")
  fi
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

# ---- Stop mode: narrow TARGET_CONTENT to files matching this rule's globs ----
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

# ---- Extract patterns ----
PATTERNS=$(python3 <<EOF
import re, yaml
text = open("$CONSTITUTION").read()
match = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
if not match: exit(1)
yml = yaml.safe_load(match.group(1))
for p in yml['sacred_rules']['$RULE_ID']['patterns']['forbidden_regex']:
    print(p)
EOF
)

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
  if grep -E -i -q -- "$pattern" <<< "$CLEANED"; then
    VIOLATION_FOUND=1
    MATCH=$(grep -E -i -- "$pattern" <<< "$CLEANED" | head -3)
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
