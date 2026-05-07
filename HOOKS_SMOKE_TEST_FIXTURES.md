# Sacred Rules Hook — Smoke Test Fixtures

> **Status:** Smoke-test corpus for the four Sacred Rule hooks. Run before merging the Phase 4 close commit. Re-run any time `constitution.md`'s YAML front-matter or any hook script changes.
>
> **Invocation:** Each hook reads `CLAUDE_PROJECT_DIR/constitution.md` for its patterns. Set `CLAUDE_PROJECT_DIR` to the workspace root before running.
>
> **Pass criteria:** Each "should BLOCK" case must exit 2. Each "should ALLOW" case must exit 0. SR-3 (prompt-type) cannot be unit-tested without invoking Haiku; its evaluation is in §SR-3.4 below.

---

## Setup

```bash
export CLAUDE_PROJECT_DIR="$(pwd)"
chmod +x .claude/hooks/sr*.sh
```

---

## SR-1 — Navigator Confidence Cap

### SR-1.1 — should BLOCK: confidence > 0.75 in production code

```bash
cat <<'EOF' | .claude/hooks/sr1_navigator_confidence_cap.sh
{"tool_name":"Write","tool_input":{"file_path":"src/navigator/scoring.ts","content":"const result = { confidence: 0.9, label: 'high' };"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-1.2 — should BLOCK: setConfidence(0.85)

```bash
cat <<'EOF' | .claude/hooks/sr1_navigator_confidence_cap.sh
{"tool_name":"Edit","tool_input":{"file_path":"src/navigator/output.ts","new_string":"setConfidence(0.85);"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-1.3 — should BLOCK: CONFIDENCE_MAX = 1.0

```bash
cat <<'EOF' | .claude/hooks/sr1_navigator_confidence_cap.sh
{"tool_name":"Write","tool_input":{"file_path":"src/navigator/constants.ts","content":"export const CONFIDENCE_MAX = 1.0;"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-1.4 — should ALLOW: confidence ≤ 0.75

```bash
cat <<'EOF' | .claude/hooks/sr1_navigator_confidence_cap.sh
{"tool_name":"Write","tool_input":{"file_path":"src/navigator/scoring.ts","content":"const result = { confidence: 0.75, label: 'high' };"}}
EOF
echo "Exit: $?"  # MUST be 0
```

### SR-1.5 — should ALLOW: violating value in test fixture

```bash
cat <<'EOF' | .claude/hooks/sr1_navigator_confidence_cap.sh
{"tool_name":"Write","tool_input":{"file_path":"src/navigator/__tests__/scoring.test.ts","content":"const result = { confidence: 0.99, label: 'high' };"}}
EOF
echo "Exit: $?"  # MUST be 0 (test files exempt)
```

### SR-1.6 — should ALLOW: violating value in commented code

```bash
cat <<'EOF' | .claude/hooks/sr1_navigator_confidence_cap.sh
{"tool_name":"Write","tool_input":{"file_path":"src/navigator/scoring.ts","content":"// const result = { confidence: 0.9, label: 'high' };  // old code\nconst result = { confidence: 0.7 };"}}
EOF
echo "Exit: $?"  # MUST be 0 (comments stripped before grep)
```

---

## SR-2 — Crisis Bypass Detector

### SR-2.1 — should BLOCK: env-flag bypass

```bash
cat <<'EOF' | .claude/hooks/sr2_crisis_bypass_detector.sh
{"tool_name":"Write","tool_input":{"file_path":"src/crisis/handler.ts","content":"if (process.env.SKIP_CRISIS) { return { skipped: true }; }"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-2.2 — should BLOCK: config disable

```bash
cat <<'EOF' | .claude/hooks/sr2_crisis_bypass_detector.sh
{"tool_name":"Write","tool_input":{"file_path":"src/config.ts","content":"const config = { crisisDetection: false };"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-2.3 — should BLOCK: feature flag

```bash
cat <<'EOF' | .claude/hooks/sr2_crisis_bypass_detector.sh
{"tool_name":"Write","tool_input":{"file_path":"src/flags.ts","content":"const flags = { feature_flag_crisis: false, mode: 'production' };"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-2.4 — should ALLOW: enabled config

```bash
cat <<'EOF' | .claude/hooks/sr2_crisis_bypass_detector.sh
{"tool_name":"Write","tool_input":{"file_path":"src/config.ts","content":"const config = { crisisDetection: 'always-on', mode: 'production' };"}}
EOF
echo "Exit: $?"  # MUST be 0
```

### SR-2.5 — should ALLOW: violating value in test

```bash
cat <<'EOF' | .claude/hooks/sr2_crisis_bypass_detector.sh
{"tool_name":"Write","tool_input":{"file_path":"src/__tests__/crisis.test.ts","content":"const config = { crisisDetection: false }; // testing fallback"}}
EOF
echo "Exit: $?"  # MUST be 0
```

---

## SR-3 — Diagnostic Language

This is a `prompt`-type hook. Its output is a prompt sent to Claude Haiku, which returns a JSON allow/block decision. Smoke-testing requires invoking Haiku.

### SR-3.1 — manual evaluation harness

Save the output of the hook script and submit it to Haiku via the Anthropic API:

```bash
cat <<'EOF' | .claude/hooks/sr3_diagnostic_language.sh > /tmp/sr3_prompt.txt
{"tool_name":"Write","tool_input":{"file_path":"src/i18n/en.json","content":"{\"navigator\": {\"result\": \"You have moderate depression.\"}}"}}
EOF

# Submit to Haiku and check decision
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d @<(jq -n --rawfile p /tmp/sr3_prompt.txt '{
    model: "claude-haiku-4-5",
    max_tokens: 200,
    messages: [{role:"user",content:$p}]
  }') | jq -r '.content[0].text'
# Expected: {"decision":"block","reason":"phrase 'You have moderate depression' is diagnostic"}
```

### SR-3.2 — Test cases for evaluation

| # | Input phrase | Expected decision | Reasoning |
|---|---|---|---|
| 1 | "You have moderate depression." | **block** | Direct diagnostic assertion |
| 2 | "You're suffering from anxiety." | **block** | Direct diagnostic assertion |
| 3 | "Your diagnosis is depression." | **block** | Direct diagnostic assertion |
| 4 | "This means you're experiencing depression." | **block** | Diagnostic via "this means" |
| 5 | "You might find articles about depression helpful." | **allow** | Invitational; no clinical assertion |
| 6 | "People experiencing similar things often find..." | **allow** | Educational framing |
| 7 | "Depression is associated with low mood." | **allow** | Educational definition; no user assertion |
| 8 | "console.log('user has selected mood 3');" | **allow** | Developer log, not user-facing |
| 9 | "// Note: 'you have' is forbidden in user copy" | **allow** | Comment about the rule itself |
| 10 | "The DSM-5 defines major depression as..." | **allow** | Attributed clinical source; not user assertion |

Run each through the hook + Haiku pipeline. ≥9/10 correct decisions = pass. <9/10 = the prompt template needs sharpening.

### SR-3.3 — known limitations

- Heavy paraphrase like "It's clear that you're going through depression" may be missed by Haiku without further prompt tuning. Tighten the prompt and retest.
- Mixed-language strings (Portuguese, Spanish, Swedish, French) may behave differently. Add language-specific test cases when i18n surfaces are added.

---

## SR-4 — Symptom Telemetry

### SR-4.1 — should BLOCK: Sentry with symptomData

```bash
cat <<'EOF' | .claude/hooks/sr4_no_symptom_telemetry.sh
{"tool_name":"Write","tool_input":{"file_path":"src/telemetry.ts","content":"function logCheckin(symptomData) { Sentry.captureMessage('checkin', { extra: { symptomData } }); }"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-4.2 — should BLOCK: analytics.track with symptomSelection

```bash
cat <<'EOF' | .claude/hooks/sr4_no_symptom_telemetry.sh
{"tool_name":"Write","tool_input":{"file_path":"src/track.ts","content":"analytics.track('mood_logged', { symptomSelection: data.selected });"}}
EOF
echo "Exit: $?"  # MUST be 2
```

### SR-4.3 — should BLOCK: multiline call with symptomData on next line

```bash
cat <<'EOF' | .claude/hooks/sr4_no_symptom_telemetry.sh
{"tool_name":"Write","tool_input":{"file_path":"src/track.ts","content":"posthog.capture(\n  'checkin_completed',\n  { properties: { symptomSeverity: 5 } }\n);"}}
EOF
echo "Exit: $?"  # MUST be 2 (multiline-aware detection)
```

### SR-4.4 — should ALLOW: telemetry with safe metadata

```bash
cat <<'EOF' | .claude/hooks/sr4_no_symptom_telemetry.sh
{"tool_name":"Write","tool_input":{"file_path":"src/track.ts","content":"function logEvent() { Sentry.captureMessage('navigator_completed', { tags: { app_version: '1.0', screen: 'navigator' } }); }"}}
EOF
echo "Exit: $?"  # MUST be 0
```

### SR-4.5 — should ALLOW: symptom variable not in telemetry call

```bash
cat <<'EOF' | .claude/hooks/sr4_no_symptom_telemetry.sh
{"tool_name":"Write","tool_input":{"file_path":"src/handler.ts","content":"const symptomData = getSymptoms();\nstoreLocally(symptomData);\nSentry.captureMessage('storage_event');"}}
EOF
echo "Exit: $?"  # MUST be 0 (symptomData is local; not in Sentry call)
```

---

## Stop hook

The Stop hook re-runs SR-1, SR-2, and SR-4 against the entire staged diff (`git diff --cached`). SR-3 is omitted from the Stop hook because its prompt-type cost ($0.001/check, ~5s latency) makes it expensive to run on every session stop.

### Stop.1 — should BLOCK: violating change in any staged file

```bash
# Stage a violating change first
git checkout -b smoke-test-stop
echo "const x = { confidence: 0.99 };" > violating.ts
git add violating.ts

# Run the stop-mode hook
.claude/hooks/sr1_navigator_confidence_cap.sh --mode=stop
echo "Exit: $?"  # MUST be 2

# Cleanup
git reset --hard HEAD
git checkout main
git branch -D smoke-test-stop
```

---

## Pass criteria for the Phase 4 close commit

All cases above except SR-3 must produce the expected exit code. SR-3 must produce ≥9/10 correct decisions on its 10-case rubric.

If any case fails:

1. Don't merge. Don't bypass.
2. Inspect the hook script — usually a regex tightening fix.
3. Update `constitution.md` patterns if the rule itself needs adjustment.
4. Re-run the entire smoke-test corpus.
5. When all pass, the Phase 4 close commit can land.

---

## Maintenance

When adding a new Sacred Rule (e.g., SR-5 in Phase 11):

1. Add the rule's YAML block to `constitution.md` front-matter.
2. Add a hook script at `.claude/hooks/srN_<name>.sh` modeled on the closest existing hook.
3. Add the hook to `.claude/settings.json` PreToolUse and Stop entries.
4. Add a section to this file with ≥3 BLOCK fixtures and ≥2 ALLOW fixtures.
5. Run the full corpus before merging.

Patterns drift. The fixtures here are the canary.
