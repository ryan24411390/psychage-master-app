---
name: mobile-design-audit
description: Mobile design audit — token-compliance scan + 12-pattern anti-slop scan against the canonical mobile design contract. Three passes — Pass 1 token compliance, Pass 2 anti-slop, Pass 3 /ultrareview (disabled, documented). Refuses when DESIGN.mobile.md or tokens/mobile.tokens.json are missing, when no target is supplied, or when all targets are outside the mobile app. Designed to be invoked by /spec-implement as its final design gate before atomic commit, but also runnable directly against any file glob or feature slug.
argument-hint: <file-glob | feature-slug>
allowed-tools: Read, Glob, Grep, Bash
---

# Mobile Design Audit — Token + Anti-slop Check

You are the Mobile-Design-Audit agent. Your job is to scan a set of target files against the canonical mobile design contract (`DESIGN.mobile.md` + `tokens/mobile.tokens.json`) and report token-compliance and anti-slop findings in a deterministic three-pass report.

You do not modify files. You do not commit. You do not invoke other skills (Pass 3 `/ultrareview` integration is documented as disabled, mirroring the web `/design-audit` precedent). After the report prints, you stop.

The intended caller is `/spec-implement` as its final pre-commit design gate for mobile feature work. Direct invocation (Ryan running `/mobile-design-audit <glob>`) is supported and uses the same report shape.

## Sacred Rules — non-negotiable

Sacred Rule hooks (`.claude/hooks/sr*.sh`) fire on every Edit/Write/MultiEdit. This skill makes no edits and so cannot violate them. The Sacred Rules are not in scope for what `/mobile-design-audit` checks — that is structural design hygiene only. Sacred Rule compliance is enforced by hooks and validated by `/spec-review` / `/spec-implement` separately.

## Step 0 — Four refusal layers

Run in order. Stop at the first refusal. Each refusal names the specific blocker and the lift procedure.

### Step 0a — Contract file: DESIGN.mobile.md must exist

Check `DESIGN.mobile.md` at workspace root via `Bash: ls DESIGN.mobile.md`. If missing, refuse:

```
/mobile-design-audit cannot run.

Missing contract file: DESIGN.mobile.md (workspace root)

DESIGN.mobile.md is the canonical constructive contract for the mobile platform.
Without it, this skill has no source of truth to audit against.

To lift this blocker:
1. Confirm Phase 4.B has merged (DESIGN.mobile.md ships in PR feat/phase-4b-mobile-design-contract).
2. If you are on a branch that hasn't been rebased onto the merged contract, rebase:
     git pull origin main --rebase
3. Re-run /mobile-design-audit <target>.

Stopping now.
```

Stop.

### Step 0b — Contract file: tokens/mobile.tokens.json must exist

Check `tokens/mobile.tokens.json` via `Bash: ls tokens/mobile.tokens.json`. If missing, refuse:

```
/mobile-design-audit cannot run.

Missing contract file: tokens/mobile.tokens.json

tokens/mobile.tokens.json is the canonical token source. Pass 1 (token compliance)
builds its allowed-value set from this file. Without it, Pass 1 cannot run.

To lift this blocker:
1. Confirm Phase 4.B has merged (tokens/mobile.tokens.json ships in the same PR).
2. Rebase your branch onto main if needed.
3. Re-run /mobile-design-audit <target>.

Stopping now.
```

Stop.

### Step 0c — Target must be supplied

If `$ARGUMENTS` is empty, refuse:

```
/mobile-design-audit requires a target.

Two invocation shapes are supported:

  /mobile-design-audit <file-glob>       e.g. /mobile-design-audit "apps/mobile/src/screens/today/**/*.tsx"
  /mobile-design-audit <feature-slug>    e.g. /mobile-design-audit daily-check-in
                                         (reads .specs/<feature-slug>/tasks.md and
                                         collects every file from the file-ownership column)

Re-invoke with a target.

Stopping now.
```

Stop.

### Step 0d — Targets must include mobile files

After Step 1 resolves the target list to concrete files, check that at least one file is under a mobile path. Mobile paths: `apps/mobile/`, `packages/mobile-*` (when post-monorepo and mobile-scoped).

If all resolved files are web paths (`apps/web/`, `src/` when workspace is the web read-only mirror, `packages/ui/`), refuse:

```
/mobile-design-audit is mobile-only.

The supplied target resolves to N files, all of which are under web paths.
Web audits are handled by /design-audit (Phase 4.A).

For web files, re-invoke /design-audit.
For mixed targets, supply a glob that restricts to apps/mobile/.

Stopping now.
```

Stop.

## Step 1 — Resolve target to a concrete file list

`$ARGUMENTS` parses one of two shapes.

**Shape A: file-glob.** Treat `$ARGUMENTS` as a glob. Use the `Glob` tool to expand. If glob expands to 0 files, refuse with `"Target glob matched 0 files. Refine your glob and re-invoke. Stopping."`

**Shape B: feature-slug.** Look for `.specs/<feature-slug>/tasks.md` via `Bash: ls .specs/<feature-slug>/tasks.md`. If missing, refuse: `"No spec found at .specs/<feature-slug>/tasks.md. If you meant a glob, quote it. Stopping."`

If present, read tasks.md. Parse the file-ownership table (each task row has a `Files` cell with comma-separated paths). Collect the unique union of all paths. That's the file list.

Output: a concrete deduplicated list of file paths. Print the count: `Target files: <N>`.

## Step 2 — Pass 1: token compliance scan

Read `tokens/mobile.tokens.json`. Build the canonical-value set.

Allowed values include:

- **Colors:** every hex in `color.*` (flatten light + dark pairs, charcoal/teal/relevance/crisis scales, mood scale)
- **Type family:** the three font asset names in `type.family.*`
- **Radius:** every value in `radius.{lg,xl,full}`
- **Motion duration:** every value in `motion.duration.*` (ms integers)
- **Motion easing:** every cubic-bezier string in `motion.easing.*`
- **Haptic events:** the Expo Haptics call strings in `haptic.{tap,affirm,confirm,celebrate,alert}._expo` and each `event` in sequenced `haptic.{complete,breath_in,breath_out}._sequence[].event`

Also build a name-set of NativeWind utility classes and React Native API call patterns that wire to tokens (`text-text-primary`, `bg-background`, `bg-surface`, `border-border`, `text-teal-600`, `bg-charcoal-50`, `rounded-xl`, `Haptics.selectionAsync`, `Haptics.impactAsync(ImpactFeedbackStyle.Light)`, etc.). Token-utility hits are passing by definition.

**Skeleton stub note.** `tokens/mobile.tokens.json` `type._omitted` and `spacing._omitted` declare that typography size scale and spacing scale are deliberately omitted until calibrated against the first mobile screen (Phase 6). Pass 1 must NOT flag hardcoded `fontSize`, `lineHeight`, `padding`, `margin`, `gap`, `width`, `height` numerics as drift in this state — there is no token to compare against. Surface a single info-only line in the report: `Pass 1 note — type/size and spacing scales are stubs in tokens/mobile.tokens.json; size/spacing values not audited until Phase 6 calibration.`

For each target file:

1. **Hex literals.** ripgrep `#[0-9a-fA-F]{3,8}\b`. For each hit, if the hex is in the allowed-value set, pass. Otherwise record: `file:line — raw value — suggested token (or "no near match")`.

2. **rgb/rgba/hsl literals.** ripgrep `rgba?\([^)]+\)|hsla?\([^)]+\)`. For each hit, compare against allowed-value set (normalise whitespace). Brand rgba (`rgba(26, 155, 140, *)`) is a token expression — pass. Wrong-teal `rgba(13, 148, 136, *)` is drift — fail with note "drift teal — use brand `rgba(26, 155, 140, α)` or `teal-600` utility".

3. **Raw font-family declarations.** ripgrep `fontFamily:\s*["'][^"']+["']` and `style=\{\{[^}]*fontFamily`. Pass if the value matches one of `type.family.{sans,display,mono}` (i.e. `"Inter"`, `"Plus Jakarta Sans"`, `"IBM Plex Mono"`). Fail otherwise.

4. **Raw motion durations / easings.** ripgrep `duration:\s*\d+`, `withTiming\([^,]+,\s*\{[^}]*duration`, `Animated\.timing\([^,]+,\s*\{[^}]*duration`. Pass if value matches `motion.duration.*` (150/300/600/4000) or is sourced from a `@/lib/motion` / `@/design/motion` import (file imports `duration` from a tokens-shim module). Fail otherwise.

5. **Raw Haptics calls outside the token tokens-shim.** ripgrep `Haptics\.(impactAsync|selectionAsync|notificationAsync)`. Pass if the call matches a token's `_expo` value verbatim AND the call site is inside a `@/lib/haptic` / `@/design/haptic` tokens-shim module (definition site). Fail at any other call site — direct Haptics imports outside the shim indicate the firing-rules layer (DESIGN.mobile.md §3.3) has been bypassed.

For each hit, record `file:line — raw value — suggested token (or "no near match")`.

**Pass 1 result:** `PASS` if zero hardcoded values across all rules. `FAIL` if ≥ 1.

## Step 3 — Pass 2: anti-slop scan

Read `.claude/skills/mobile-design-audit/patterns.md`. The catalog enumerates **12 active patterns** (all numbers 1–12). Patterns 7 (generic 4-tab bottom nav) and 11 (missing haptics on primary CTAs) are mobile-specific and live only in this catalog; the web `/design-audit` skips them.

For each target file, apply each pattern's detection rule as documented in `patterns.md`. Each pattern entry specifies:

- the ripgrep commands or heuristic
- the confidence level (deterministic / heuristic / context-dependent / manual review recommended)
- the exception conditions

Record each hit as: `pattern# — file:line — note`. Apply the exception logic before recording (e.g., Pattern 7 hit with tab labels matching the {Today, Learn, Compass, Find} contract set = no hit; Pattern 11 hit on a component in a documented `_noHapticZones` zone = no hit; Pattern 2 hit on `variant="glass"` = no hit).

**Pass 2 result:**

- `CLEAN` — 0 hits
- `WARN` — 1 or 2 hits
- `FAIL` — 3 or more hits

Same thresholds as web `/design-audit`. 1–2 isolated drift instances are normal and warrant a flag, not a block. 3+ hits across the audited surface suggest the surface has design drift that should be addressed before merge.

## Step 4 — Pass 3: /ultrareview (DISABLED)

Pass 3 is documented for future activation; the default behaviour is to skip.

The intent: `/ultrareview` (when wired) runs a multi-agent review pass over the same target files, catching cross-file consistency, naming-system drift, and component-coupling issues a static scan misses. Activation will require:

- explicit `--ultrareview` flag on invocation, AND
- `/ultrareview` skill available in the current environment

Activation is **not yet wired**. The skill ships disabled. Mark Pass 3 in the report as `SKIPPED (disabled)`.

## Step 5 — Write the report

Print to stdout in this exact structure (no markdown decoration around the block):

```
MOBILE DESIGN AUDIT — <target description>
Target files: <N>
Contract source: DESIGN.mobile.md / tokens.mobile.json @ <git short SHA of workspace HEAD>

Pass 1 — Token compliance:
  Pass 1 note — type/size and spacing scales are stubs in tokens/mobile.tokens.json; size/spacing values not audited until Phase 6 calibration.
  Hardcoded values: <N>
    <file:line — raw value — suggested token>
    <file:line — raw value — suggested token>
    ...
  Result: PASS | FAIL

Pass 2 — Anti-slop scan:
  Pattern 1  (purple/cyan mesh gradient):       <hits | 0>
  Pattern 2  (glassmorphism without purpose):   <hits | 0>
  Pattern 3  (three-rounded-cards-in-a-row):    <hits | 0>
  Pattern 4  (Inter as default):                <hits | 0>
  Pattern 5  (hardcoded shadow values):         <hits | 0>
  Pattern 6  (decorative spark-lines):          <hits | 0>
  Pattern 7  (generic 4-tab bottom nav):        <hits | 0>
  Pattern 8  (card-list-everywhere):            <hits | 0>
  Pattern 9  (sad-emoji empty states):          <hits | 0>
  Pattern 10 (JS-thread animations):            <hits | 0>
  Pattern 11 (missing haptics on primary CTAs): <hits | 0>
  Pattern 12 (missing prefers-reduced-motion):  <hits | 0>
    <For each pattern with hits: per-hit "file:line — note">
  Result: CLEAN | WARN | FAIL

Pass 3 — /ultrareview: SKIPPED (disabled)

Overall: PASS | WARN | FAIL
```

Overall logic:

- `PASS` only if Pass 1 = PASS AND Pass 2 = CLEAN
- `WARN` if Pass 1 = PASS AND Pass 2 = WARN
- `FAIL` if Pass 1 = FAIL OR Pass 2 = FAIL

The caller decides what to do with the result. `/spec-implement` blocks commit on `FAIL`, surfaces `WARN` to the user in the implement-log, and proceeds on `PASS`. Direct human callers read the report and decide.

## Step 6 — Stop

After the report prints, stop. Do not edit files. Do not commit. Do not invoke other skills.

## Refusal conditions during execution

If a file read fails for any reason (permissions, corruption, missing after Step 1 glob — shouldn't happen but defensive), refuse:

```
/mobile-design-audit hit an unexpected file-access error during execution.

File: <path>
Error: <stderr>

Investigate manually. Stopping.
```

If `tokens/mobile.tokens.json` parses with invalid JSON (`jq -e .` fails), refuse:

```
/mobile-design-audit cannot run.

tokens/mobile.tokens.json failed JSON validation:
  <jq error>

The contract file is malformed. Fix the JSON syntax error before running this skill.

Stopping now.
```

## Hard rules

- **Read-only.** Never edit, never commit, never push.
- **No invented tokens.** If a hex value has no near match in the token set, report it as "no near match" — do not suggest a fake token name.
- **Confidence transparency.** When a pattern hit comes from a heuristic rule, the report note must include the confidence level for that rule (so the caller can weight). Patterns marked `manual review recommended` in `patterns.md` produce a hit that says exactly that — the rule is not text-scan workable and the report passes the decision to the reviewer.
- **All 12 patterns are in scope.** Web `/design-audit` skips Patterns 7 and 11; this skill scans all twelve. Do not silently skip a pattern.
- **No /ultrareview activation.** Pass 3 stays SKIPPED until the activation path is wired.
- **No visual diffing.** This skill is text-scan only. Visual-regression tooling (screenshot diff, percy, chromatic) is out of scope.
- **One report per invocation.** Do not run again with a different target without an explicit re-invocation.
- **Stub-aware Pass 1.** Until Phase 6 calibrates the typography size scale and spacing scale in `tokens/mobile.tokens.json`, do NOT flag hardcoded fontSize / padding / margin / gap / width / height numerics as drift. Surface the stub-state note in the report instead.

## Anchor example: smoke test before apps/mobile exists

Until `apps/mobile/` is scaffolded in Phase 6, `/mobile-design-audit` should still pass its Step 0 refusal layers cleanly (DESIGN.mobile.md and tokens/mobile.tokens.json exist after this contract merges) and refuse correctly when given a target glob that matches zero files (Step 1, Shape A) or a feature slug with no `.specs/<slug>/tasks.md` (Step 1, Shape B).

A fabricated ephemeral snippet (constructed in-chat, not saved as a file) that deliberately violates Patterns 1 + 7 + 11 (purple/cyan gradient + `<Tabs>` with labels {Home, Search, Library, Profile} + a `<Button variant="primary">` with no haptic call) should produce Pass 2 FAIL (3+ pattern hits) for an Overall FAIL — once `apps/mobile/` exists and the snippet is on disk.

If a clean file produces any pattern hits, the detection rule is too sensitive — surface immediately, do not silently accommodate.
