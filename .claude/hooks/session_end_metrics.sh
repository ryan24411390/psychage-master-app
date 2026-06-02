#!/usr/bin/env bash
# session_end_metrics.sh
#
# SessionEnd hook. Appends one JSON line per session to _metrics.jsonl at
# workspace root. Observability only — never blocks session end.
#
# Fail-open by design: any error (missing tools, stdin parse failure, git
# unavailable, write failure) exits 0 with no output. Metrics are not
# enforcement; they must not delay or prevent session termination.
#
# Schema (one object per session):
#   ts          ISO-8601 UTC timestamp
#   schema      this script's schema version
#   reason      session-end reason from hook payload (e.g. clear, logout, prompt_input_exit)
#   session_id  Claude Code session id from hook payload
#   cwd         working directory
#   branch      current git branch (or "" if not in a git repo / detached)
#   head        current HEAD short SHA (or "")
#   phase       .claude/workspace.json .phase value (or null if unreadable)
#
# Registered as SessionEnd in .claude/settings.json. Output file
# `_metrics.jsonl` is gitignored.

set +e  # never let any subcommand failure propagate

OUT_FILE="${CLAUDE_PROJECT_DIR:-$(pwd)}/_metrics.jsonl"

# Read hook payload from stdin (JSON). Per Claude Code SessionEnd contract,
# fields include session_id, transcript_path, cwd, reason. Parse with jq if
# available; otherwise fall back to empty strings.
PAYLOAD=""
if [ -t 0 ]; then
  PAYLOAD="{}"
else
  PAYLOAD="$(cat 2>/dev/null || echo '{}')"
fi

if command -v jq >/dev/null 2>&1; then
  REASON="$(printf '%s' "$PAYLOAD" | jq -r '.reason // ""' 2>/dev/null)"
  SESSION_ID="$(printf '%s' "$PAYLOAD" | jq -r '.session_id // ""' 2>/dev/null)"
  CWD="$(printf '%s' "$PAYLOAD" | jq -r '.cwd // ""' 2>/dev/null)"
else
  REASON=""
  SESSION_ID=""
  CWD=""
fi

[ -z "$CWD" ] && CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")"
BRANCH="$(git -C "$CWD" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
HEAD_SHA="$(git -C "$CWD" rev-parse --short HEAD 2>/dev/null || echo "")"

PHASE="null"
WORKSPACE_JSON="$CWD/.claude/workspace.json"
if [ -f "$WORKSPACE_JSON" ] && command -v jq >/dev/null 2>&1; then
  P="$(jq -r '.phase // empty' "$WORKSPACE_JSON" 2>/dev/null)"
  [ -n "$P" ] && PHASE="$P"
fi

# Build JSON line. Use jq to ensure proper escaping if available; otherwise
# emit a minimal fallback (still valid JSON, but with empty strings if any
# field is unset).
LINE=""
if command -v jq >/dev/null 2>&1; then
  LINE="$(jq -cn \
    --arg ts "$TS" \
    --arg reason "$REASON" \
    --arg session_id "$SESSION_ID" \
    --arg cwd "$CWD" \
    --arg branch "$BRANCH" \
    --arg head "$HEAD_SHA" \
    --argjson phase "$PHASE" \
    '{ts: $ts, schema: 1, reason: $reason, session_id: $session_id, cwd: $cwd, branch: $branch, head: $head, phase: $phase}' \
    2>/dev/null)"
fi

if [ -z "$LINE" ]; then
  LINE="{\"ts\":\"$TS\",\"schema\":1,\"reason\":\"\",\"session_id\":\"\",\"cwd\":\"$CWD\",\"branch\":\"\",\"head\":\"\",\"phase\":null}"
fi

printf '%s\n' "$LINE" >> "$OUT_FILE" 2>/dev/null

exit 0
