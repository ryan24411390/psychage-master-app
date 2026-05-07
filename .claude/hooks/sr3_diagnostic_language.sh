#!/usr/bin/env bash
# ============================================================
# SR-3 — No diagnostic language in user-facing copy
# ============================================================
# This is a PROMPT-TYPE hook. Output is a prompt string sent to Haiku.
# Haiku returns yes/no judgment; settings.json plumbing handles block decision.
#
# The hook reads the forbidden-phrase seed list from constitution.md and
# constructs a prompt that asks Haiku to identify diagnostic phrasing,
# including paraphrases the seed list doesn't cover.
# ============================================================

set -euo pipefail

CONSTITUTION="${CLAUDE_PROJECT_DIR:-$(pwd)}/constitution.md"
RULE_ID="SR-3"

# ---- Constitution must exist ----
if [[ ! -f "$CONSTITUTION" ]]; then
  cat <<'EOF'
{"decision":"block","reason":"constitution.md not found; cannot validate SR-3 (diagnostic language). Restore constitution.md before proceeding."}
EOF
  exit 0
fi

# ---- Read input JSON ----
INPUT_JSON=$(cat)

# ---- Extract content + file path; skip non-user-facing files ----
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

# ---- File-glob: only check user-facing files ----
should_check_file() {
  local f="$1"
  [[ -z "$f" ]] && return 1
  case "$f" in
    *.tsx|*.ts) ;;
    */i18n/*.json|*/translations/*.json|*/locales/*.json) ;;
    *) return 1 ;;
  esac
  case "$f" in
    *.test.*|*/__tests__/*|*/__fixtures__/*) return 1 ;;
  esac
  return 0
}

if ! should_check_file "$TARGET_FILE"; then
  # Not a user-facing file — emit allow decision
  cat <<'EOF'
{"decision":"allow","reason":"file does not contain user-facing copy"}
EOF
  exit 0
fi

# ---- Pull forbidden-phrase seeds from constitution ----
SEEDS=$(python3 <<EOF
import re, yaml
text = open("$CONSTITUTION").read()
match = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
if not match: exit(1)
yml = yaml.safe_load(match.group(1))
seeds = yml['sacred_rules']['$RULE_ID']['forbidden_phrase_seeds']
print('\n'.join(f'- "{s}"' for s in seeds))
EOF
)

# ---- Construct the prompt for Haiku ----
# Output goes to stdout; settings.json's prompt-type hook plumbing sends it
# to the configured model and interprets the response.

cat <<EOF
You are a diagnostic-language detector for a mental health education platform called Psychage. Your job is to evaluate a code diff and determine whether it introduces diagnostic phrasing into user-facing copy.

# What is forbidden

User-facing strings must use educational framing. Diagnostic phrasing — anything that asserts a clinical status to the user — is a Sacred Rule violation per constitution.md.

Forbidden seed phrases (and any paraphrase that has the same effect):
$SEEDS

The replacement pattern is invitational: "you might want to read about," "people experiencing similar things often find," "this is sometimes associated with."

# What is NOT forbidden

- Technical or developer-facing strings (variable names, log messages, error messages directed at devs)
- Test fixtures or test descriptions
- Comments in code
- Markdown documentation describing the rule itself
- Quoted user input being echoed back ("you said: ...")
- Educational descriptions of conditions that do NOT assert the user has them
- Clinical language inside imported scientific quotations or attributed sources (e.g., "the DSM-5 criteria for major depressive disorder include...")

# Diff to evaluate

File: $TARGET_FILE

\`\`\`
$TARGET_CONTENT
\`\`\`

# Your task

Decide whether the diff introduces diagnostic phrasing into user-facing copy.

Respond with EXACTLY one JSON object on a single line, with no other text:

{"decision":"allow","reason":"<one-sentence reason>"}

OR

{"decision":"block","reason":"<one-sentence reason naming the offending phrase and why it's diagnostic>"}

Be strict but fair. Err toward allow when the phrasing is technical, attributed, or genuinely educational. Block when the user is being told something about themselves clinically.
EOF
