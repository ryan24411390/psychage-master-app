#!/usr/bin/env bash
# ============================================================
# SR-4 — Symptom data must never appear in telemetry
# ============================================================
# Cross-product check: does any symptom-identifier name appear inside
# any telemetry call site in the staged content?
#
# This is the most algorithmically interesting hook because it has to
# correlate two pattern families. We use AWK to do bracket-aware extraction
# of telemetry call argument lists, then grep those for symptom names.
# ============================================================

set -euo pipefail

CONSTITUTION="${CLAUDE_PROJECT_DIR:-$(pwd)}/constitution.md"
RULE_ID="SR-4"
RULE_HUMAN="Symptom data must never appear in telemetry"

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

# ---- Extract symptom identifier seeds + telemetry call sites ----
# shellcheck source=./_parse-constitution.sh
. "$(dirname "$0")/_parse-constitution.sh"
SYMPTOM_NAMES=$(extract_constitution_list "$CONSTITUTION" "$RULE_ID" "symptom_identifier_seeds")
TELEMETRY_PATTERNS=$(extract_constitution_list "$CONSTITUTION" "$RULE_ID" "telemetry_call_sites")

if [[ -z "$SYMPTOM_NAMES" ]] || [[ -z "$TELEMETRY_PATTERNS" ]]; then
  echo "BLOCKED ($RULE_ID): could not parse SR-4 patterns from constitution.md" >&2
  exit 2
fi

# ---- Detection logic ----
# Strategy: for each telemetry call pattern, find lines that match it,
# then extract the call-argument region (current line + reasonable lookahead),
# then check if any symptom-name appears in that region.

VIOLATION_FOUND=0
VIOLATION_DETAILS=""

# Strip comments first
CLEANED=$(echo "$TARGET_CONTENT" | sed -E 's|//.*$||g; s|/\*.*\*/||g')

# Save symptom names + telemetry patterns to temp files for AWK
SYMPTOM_FILE=$(mktemp)
TELEMETRY_FILE=$(mktemp)
trap "rm -f $SYMPTOM_FILE $TELEMETRY_FILE" EXIT

echo "$SYMPTOM_NAMES" > "$SYMPTOM_FILE"
echo "$TELEMETRY_PATTERNS" > "$TELEMETRY_FILE"

# AWK script: for each line matching a telemetry pattern, look at that
# line + next 10 lines (call argument list) for symptom-name occurrences.
RESULT=$(echo "$CLEANED" | awk -v symfile="$SYMPTOM_FILE" -v telfile="$TELEMETRY_FILE" '
BEGIN {
  # Load symptom names
  while ((getline line < symfile) > 0) {
    if (line) symptoms[++sn] = line
  }
  close(symfile)
  # Load telemetry patterns
  while ((getline line < telfile) > 0) {
    if (line) telemetry[++tn] = line
  }
  close(telfile)
}

# Buffer all lines for lookback/lookahead
{ lines[NR] = $0 }

END {
  for (lineno = 1; lineno <= NR; lineno++) {
    line = lines[lineno]
    # Check if this line matches any telemetry call pattern
    for (i = 1; i <= tn; i++) {
      if (line ~ telemetry[i]) {
        # Found a telemetry call. Examine current line + next 10 lines
        # for symptom-name occurrences (typical call arg span).
        scan_end = (lineno + 10 > NR) ? NR : lineno + 10
        scan_block = line
        for (j = lineno + 1; j <= scan_end; j++) {
          scan_block = scan_block "\n" lines[j]
          # Stop at obvious end-of-call (closing paren on its own with no preceding open)
          if (lines[j] ~ /^\s*\)\s*[;,]?\s*$/) break
        }
        # Check if any symptom name appears in the scan block
        for (k = 1; k <= sn; k++) {
          if (scan_block ~ symptoms[k]) {
            print "VIOLATION: telemetry call (" telemetry[i] ") at line " lineno " contains symptom identifier (" symptoms[k] ")"
            print "Context: " line
            print "---"
          }
        }
      }
    }
  }
}
')

if [[ -n "$RESULT" ]]; then
  VIOLATION_FOUND=1
  VIOLATION_DETAILS="$RESULT"
fi

# ---- Decide ----
if [[ $VIOLATION_FOUND -eq 1 ]]; then
  cat >&2 <<MSG
BLOCKED ($RULE_ID): $RULE_HUMAN

File: $TARGET_FILE
Mode: $MODE

This change introduces a telemetry call (Sentry, analytics, etc.)
whose arguments include symptom-related identifiers. Symptom data
stays on device, per Sacred Rule SR-4 in constitution.md.

Raw symptom selections, severity ratings, durations, frequencies,
and mood selections must never leave the user's device. No Sentry
breadcrumb, analytics event, Supabase write, or third-party
transmission may contain this data.

Details:
$VIOLATION_DETAILS

How to fix:
1. Remove the symptom-identifier from the telemetry call entirely.
2. If you genuinely need to log that a symptom-related event
   occurred (without the data itself), use a generic event name like
   "symptom_navigator.completed" with no symptom-data payload.
3. If the false positive is real (e.g., "symptomNavigator" is the
   component name being logged for a UI render trace, with no symptom
   data attached), refactor to a name that doesn't contain "symptom",
   like "navigatorScreen".

To override (not recommended): Sacred Rule surfaces cannot use [bypass]
commits per constitution.md.
MSG
  exit 2
fi

exit 0
