#!/usr/bin/env bash
# ============================================================
# SR-3 — No clinical assertions in user-facing copy
# ============================================================
# Reads forbidden_phrase_seeds from constitution.md YAML front-matter.
# Hook input: PreToolUse JSON via stdin.
# Exit codes: 0 = allow, 2 = block.
#
# Phase 6 close-out repaired this from a prompt-type hook (which Claude Code
# does not support invoking via script-as-prompt-generator) to a command-type
# hook that performs a deterministic case-insensitive seed-phrase scan.
#
# Known gap: paraphrase coverage (the original Haiku layer) is OFF. Re-enable
# by adding an inline ANTHROPIC API call from this script once a vendor /
# secret-distribution decision exists. See learnings.md (Phase 6 close-out).
# ============================================================

set -euo pipefail

CONSTITUTION="${CLAUDE_PROJECT_DIR:-$(pwd)}/constitution.md"
RULE_ID="SR-3"
RULE_HUMAN="Clinical-assertion phrasing in user-facing copy"

# ---- Bail-out: if constitution.md doesn't exist, fail closed ----
if [[ ! -f "$CONSTITUTION" ]]; then
  echo "BLOCKED ($RULE_ID): constitution.md not found at $CONSTITUTION" >&2
  echo "Sacred Rules cannot be validated without constitution.md. Restore it before proceeding." >&2
  exit 2
fi

# ---- Mode selection: PreToolUse (default) or Stop ----
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
    exit 0
  fi
elif [[ "$MODE" == "stop" ]]; then
  TARGET_FILE="<all-staged-files>"
  if [[ -n "$BASE_REF" ]]; then
    TARGET_CONTENT=$(git diff --unified=0 "$BASE_REF"...HEAD 2>/dev/null \
      | { grep '^+' || true; } \
      | { grep -v '^+++' || true; } \
      | sed 's/^+//')
  else
    TARGET_CONTENT=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "")
  fi
fi

# ---- File-glob: only check user-facing copy surfaces ----
should_check_file() {
  local f="$1"
  [[ -z "$f" ]] && return 1
  case "$f" in
    *.tsx|*.ts) ;;
    */i18n/*.json|*/translations/*.json|*/locales/*.json) ;;
    *) return 1 ;;
  esac
  case "$f" in
    *.test.*|*.spec.*|*/__tests__/*|*/__fixtures__/*) return 1 ;;
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

# ---- Pull seed phrases from constitution.md YAML front-matter ----
# shellcheck source=./_parse-constitution.sh
. "$(dirname "$0")/_parse-constitution.sh"
SEEDS=$(extract_constitution_list "$CONSTITUTION" "$RULE_ID" "forbidden_phrase_seeds")

if [[ -z "$SEEDS" ]]; then
  echo "BLOCKED ($RULE_ID): could not parse forbidden_phrase_seeds from constitution.md" >&2
  exit 2
fi

# ---- Strip JS/TS comments to avoid false positives in commented-out code ----
CLEANED=$(echo "$TARGET_CONTENT" | sed -E 's|//.*$||g; s|/\*.*\*/||g')

# ---- Case-insensitive substring match for each seed ----
VIOLATION_FOUND=0
VIOLATION_DETAILS=""

while IFS= read -r seed; do
  [[ -z "$seed" ]] && continue
  # Escape regex metacharacters in the seed for fixed-string grep
  if grep -F -i -q -- "$seed" <<< "$CLEANED"; then
    VIOLATION_FOUND=1
    MATCH=$(grep -F -i -- "$seed" <<< "$CLEANED" | head -3)
    VIOLATION_DETAILS+="Seed: \"$seed\"\nMatched lines:\n$MATCH\n---\n"
  fi
done <<< "$SEEDS"

# ---- Decide ----
if [[ $VIOLATION_FOUND -eq 1 ]]; then
  cat >&2 <<MSG
BLOCKED ($RULE_ID): $RULE_HUMAN

File: $TARGET_FILE
Mode: $MODE

This change introduces a forbidden seed phrase into user-facing copy.
SR-3 forbids clinical-assertion phrasing — anything that tells the user
something about themselves clinically. Use invitational/educational
framing instead: "you might want to read about," "people experiencing
similar things often find," "this is sometimes associated with."

Details:
$VIOLATION_DETAILS

How to fix: rewrite the offending string with invitational phrasing.
If this is a comment, test fixture, or attributed clinical source, move
the file to a path that matches the exclude globs (test files, fixtures)
or use educational framing.

To override (not recommended): commit with [bypass] tag in subject line,
only if change is <20 lines and has no behavior change.
MSG
  exit 2
fi

# ---- Pass ----
exit 0
