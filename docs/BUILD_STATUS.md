# Psychage Mobile — Build Status (what's done / what's left)

**Date:** 2026-06-15 · **Baseline:** `origin/main` @ `aa8f437` · **CI:** green
**Source of truth:** git reality (merged PRs), mapped onto the ratified Screen Book
(PHASE2C, 50 screen IDs / 49 builds) + the four V1 spec-workflow features.

> One-line summary: the V1 surface is **essentially built and merged**. The team
> went **native-first**, porting most tools the Screen Book had planned as WebView
> wrappers. The only V1 feature not yet on `main` is **Sleep Architect** (PR #84,
> awaiting rebase + review). Remaining work is finishing touches, one native port
> (Med Tracker), copy finalization, and the Phase-3 design-library extraction.

---

## 1. DONE — merged to `origin/main` (verified, green CI)

Screen Book cluster → the PR(s) that landed it.

| Cluster (Screen Book) | Screens | Status | Landed via |
|---|---|---|---|
| Onboarding | S1, S2 | ✅ | #63 |
| Shell — home + check-in | S3 (4 states), S4 sheet, C0.1–C0.5 | ✅ | #42, #44–#50 |
| Shell — Compass / Learn tabs | S5, S6 | ✅ | #59 |
| Record | S7 history, S8 detail, S9/S10 reflection | ✅ | #70, #71, #61 |
| Crisis | S11, S12 + CT3 dataset | ✅ | #51, #65, #73 |
| Symptom Navigator | S13–S18 (0.75 cap, severity halt) | ✅ | #54 |
| Toolkit | S19–S21 | ✅ | #58 |
| Content — article reader | S22 (native), S25 offline | ✅ | #79, #59 |
| Auth | S33–S37 + platform JWT | ✅ | #52, #67 |
| Migration (anon→account) | S36 backend + push | ✅ | #72, #74 |
| Therapist share | S38–S41 (editable-name PDF) | ✅ | #56 |
| Settings + Supporter | S42–S49, S50 | ✅ | #53, #55, #57, #83 |
| WebView chrome | C0.6, S23/S24 (Library WV) | ✅ | #60 |
| Appearance / dark mode | night register, true-black | ✅ | #81 |
| Data layer + sync | shared data-access, RLS tables, SR-4 sync + **consent gate** | ✅ | #62, #64, #72, #83 |

### Four V1 spec-workflow features — all shipped
Daily Check-In ✅ · Symptom Navigator ✅ · My Therapist + share ✅ · Crisis ✅.

---

## 2. DONE — native ports that EXCEEDED the Screen Book plan

The Screen Book specced these as **WebView reduced-template wrappers** (S23–S32).
They were instead **natively ported** and merged — a deliberate scope upgrade:

| Feature | Screen Book plan | Reality | Landed |
|---|---|---|---|
| Provider directory | S26/S27 WebView | **native** | #80 |
| Clarity Score | S32 WebView | **native** (no-number bands) | #77 |
| Article reader | S22 native chrome | native + Supabase source | #79 |
| Conditions library | (Learn depth) | **native** | #78 |
| Relationship Health Check | S30 WebView | **native** (replaces WebView) | **#87** |
| Mood Journal | (not in Screen Book) | **native** patterns layer | #75 |
| MindMate AI companion | (not in Screen Book) | **native** + server safety layer | **#76** |

**Implication:** S29–S32's "WV reduced template" plan is now mostly obsolete.
Only **Med Tracker (S31)** remains a WebView/not-ported tool.

---

## 3. IN-FLIGHT / PRESERVED (on `origin`, not yet merged)

| Item | PR / branch | State | Action needed |
|---|---|---|---|
| **Sleep Architect (native, S29)** | **PR #84** `feat/sleep-architect` | 5 commits, real, **5 ahead / behind main** | **rebase onto main → review → merge** (last V1 feature off main) |
| Consolidation/recovery plan | **PR #86** `docs/consolidation-plan` | green, mergeable | review → merge (docs) |
| RLS verification harness | branch `origin/chore/verify-checkin-rls` | preserved backup | cherry-pick `scripts/verify-checkin-rls.ts` onto main to land it |

---

## 4. Consolidation/recovery sweep — outcome (2026-06-15)

A parallel sweep reconciled scattered branches/worktrees against git reality
(read from objects, eviction-immune) and made at-risk work durable on `origin`:

- **Preserved** the one genuinely-at-risk feature: **Sleep Architect → PR #84**
  (it had no PR and no remote; would have been lost to iCloud eviction).
- **Preserved** the RLS verification harness (`chore/verify-checkin-rls`).
- **Diagnosed** the red `main` (2 typecheck errors from overlapping snapshot merges).
  Fix PR #85 was **closed unmerged** — the active session shipped an **equivalent
  fix** (`4fad6a7`) first; diagnosis matched, `main` is green.
- **Verified:** 0 phantom/zero-byte files committed; "lost #72/#74" premise was stale
  (both merged). Nothing was actually lost. Full detail in PR #86.

---

## 5. LEFT TO DO

### Code
1. **Sleep Architect** — rebase PR #84 onto current `main`, resolve compass/tab
   conflicts, review, merge. (The one outstanding V1 feature.)
2. **Med Tracker (S31)** — only remaining WebView tool; native port not started
   (Screen Book lists native ports as V2/demand-driven — confirm V1-or-defer).
3. **Phase-3 design-library extraction** — the Screen Book logged **16–18
   `DEFER(design-system)`** component specs (tab bar, breathing-form geometry,
   PDF template, helpline row, code field, skeleton terrain, destructive style,
   etc.). Many were resolved ad-hoc during the native builds; a formal pass should
   reconcile the token/component library against what shipped.

### Copy / clinical
4. **CT4 copy finalization** — Screen Book flagged **~34 `DRAFT → CT4`** strings
   (auth errors, navigator no-match, settings labels, exercise prompt sets, tool
   one-liners). Replace drafts with final copy.
5. **Dr. Dobson clinical review** — gating items: Mood Journal co-occurrence UI,
   Clarity Score copy, condition outlines (per project memory). Required before
   those user-facing surfaces ship.

### Non-code / standing (from the Tracker, not blocking the build)
6. SYS-S9 **analytics owner** unowned (blocks launch, not design) + PostHog vs
   Amplitude decision.
7. **Billable-scope** settlement (is mobile inside the Lena engagement?).
8. Written **co-founder agreement** · Dr. Dobson **admin-panel email** · **EAS
   account** approval.
9. Workspace **open decisions** (CLAUDE.md §5) to re-verify now that auth/sync
   shipped: `rules/offline.md`, `ARCHITECTURE.md` (web↔mobile sync), push
   notifications V1-or-defer, Sign in with Apple/Google.

---

## 6. Risks / notes

- **Repo is actively raced** by parallel agent worktrees; `origin/main` moved 4×
  during the sweep (e5f3108 → aa8f437). Always branch off a freshly-fetched main;
  never long-commit in the shared checkout.
- The native-first push created **overlapping near-duplicate snapshot PRs**
  (#74–#83 shared 87–146 files each) → that overlap is what briefly broke `main`.
  Future parallel feature work should branch from a clean main, not a shared dirty
  tree, to avoid recurrence.
- **Sleep Architect (#84) is the single point of remaining V1 feature risk** until
  rebased + merged — keep it on `origin` (done) so eviction can't lose it.

## 7. Bottom line
**V1 build: ~95% merged and green.** Outstanding feature work = Sleep Architect
(#84, needs rebase) and the Med Tracker decision. The rest is copy finalization,
clinical review, the design-library reconciliation, and non-code launch items.
