# COPY_CONFLICTS_APPLIED.md

Audit for the CT4 + engagement copy application (mobile, copy-only). Records every
copy mutation, every conflict, the precedence decision applied, and a one-line revert
for each overwrite. Source decks: `PSYCHAGE_MOBILE_CT4_COPY.md` (base),
`PSYCHAGE_MOBILE_ENGAGEMENT_COPY.md` (additive).

**Architecture note:** mobile has no i18next. The "string layer" is per-feature
`copy.ts` modules (imported directly) + a few annotated named consts. Per the approved
plan, copy was applied into that layer — no i18next install, no framework build.

---

## Precedence rule applied

- CT4 is the base; the engagement set is additive on its own surfaces.
- **Direct same-surface conflict → engagement wins, CT4 original preserved as a sibling/comment.**
  In this build that branch was **never taken**: every engagement surface (streaks,
  paywall/premium, history cap, Trends, milestones, re-engagement) **does not exist**,
  so the engagement set is staged-not-wired and there are **zero live overwrites**.
  Every CT4 string stays live.
- **Mobile/deck vs web divergence → Flow-Book-locked mobile `[FINAL]` wins (flagged);
  otherwise prefer web's wording.**

---

## Conflict List A — CT4 vs engagement (same-surface, opposing)

| # | Surface | CT4 (live) | Engagement (staged) | Resolution |
|---|---------|------------|---------------------|------------|
| A1 | Mission / footer | "Free for everyone · No ads." (§0/§15, [FINAL]) | Paywall: "Unlock Psychage Premium" (§2) | No paywall surface exists → engagement staged → **CT4 live, zero overwrite.** |
| A2 | Privacy posture | "Your record belongs to you." (§15) / on-device trust | History cap: "Unlock your full history with Premium." (§3) | No history-cap surface → staged → **CT4 live.** |
| A3 | Lapse return | away: "Your record waited. Nothing was lost." (§4, live in `lib/home-model.ts`) | Streak-loss / re-engage pushes (§1/§7) | No streak or notification surface → staged → **CT4 live.** |
| A4 | Weekly reflection | descriptive lines (§7, live in `features/reflection/reflection-line.ts`) | Trends verdict cards (§4) | No Trends surface → staged → **CT4 live.** |

All engagement copy is held in `apps/mobile/features/engagement/STAGED_ENGAGEMENT_COPY.md`
(Markdown, un-importable, not founder/clinical-approved). **Zero CT4→engagement overwrites
were applied.** Revert of staging = delete that one file.

---

## Conflict List B — mobile/deck vs web parity divergences

| # | Surface | Divergence | Decision |
|---|---------|------------|----------|
| B1 | **Auth (major)** | Deck §13 describes **passwordless magic-link** ("No password… sign-in link", 6-digit code). Mobile implements **email + password** (`rules/auth.md` §3; `features/auth/copy.ts`). Web uses password too. | **HOLD.** Deck §13's passwordless strings were **not applied** — wiring them would describe a flow the app does not have (a behavior lie). Mobile's password copy kept as-is. Flagged for founder: reconcile the auth method decision before applying §13. |
| B2 | Crisis heading | Mobile/Flow-Book "Help now." (with period) vs deck §8 "Help now" (no period). Web crisis copy is entirely different ("You Are Not Alone"). | Flow-Book-locked mobile `[FINAL]` **wins, flagged.** Crisis is a required Dr. Dobson review surface → the shipped heading is preserved verbatim, the period flagged, not silently changed. |
| B3 | Delete (§15) | Deck = **account-tier** delete ("erases your synced record, your email, your provider link from our servers"). Mobile = **device** delete ("Delete my record"). Account linking is a **blocked scope** (`rules/auth.md`). | Mobile device-delete copy kept. Deck account-tier delete strings **staged-not-wired** (blocked scope) — see staged list. |
| B4 | Reader credit line | Deck §0/§11 `[FINAL]` ends with a period; mobile `READ_CREDIT` omitted it. Web renders `author.role` (not i18n'd). | **Applied deck verbatim** (added trailing period). Single source `lib/home-model.ts` → propagates to `ReviewedByCredit`. See Overwrite O3. |
| B5 | Find Care | Deck §12 is a mobile-only WebView wrapper; web has no WebView. | No web parity to honor; deck §12 strings already largely live in `features/find` / `features/webview` copy. |

---

## Overwrites applied (live copy mutations) — with revert

These are CT4-deck **verbatim reconciliations** of stale/divergent mobile strings (NOT
engagement overwrites — there were none). Each is a one-line revert.

| ID | File | Was → Now (deck §) | Revert |
|----|------|--------------------|--------|
| O1 | `components/check-in/CheckInSheet.tsx` (via new `features/check-in/copy.ts`) | note placeholder "A word about it — optional" → **"One word, if you want."** (§3 [FINAL]) | set `CHECK_IN_COPY.notePlaceholder` back to the old string |
| O2 | `features/check-in/copy.ts` | edit title "Edit this entry." → **"Edit this entry"** (§6, no period) | set `CHECK_IN_COPY.editTitle` back to "Edit this entry." |
| O3 | `lib/home-model.ts` | credit line + **trailing period** (§0/§11 [FINAL]) | remove the period in `READ_CREDIT` |
| O4 | `features/content/copy.ts` | `readOn` + **trailing period** (§11 [FINAL] memory line) | remove the period in `readOn` |
| O5 | `components/home/HomeCardSlot.tsx` | bridge very-low line → **"If things feel unsafe, help is one tap away."** (§3 [CT4]) | restore the prior longer sentence |

Tests updated to match O1/O2/O3: `__tests__/CheckInSheet.test.tsx`,
`__tests__/HistoryContainer.test.tsx`, `__tests__/ArticleReader.test.tsx`.

---

## Externalizations (no text change — inline → feature copy.ts, per approved plan)

Verbatim moves so the strings live in the copy layer; rendered text unchanged.
- `features/onboarding/copy.ts` ← WelcomeView + RecordTrustView consts (§1)
- `features/check-in/copy.ts` ← CheckInSheet sheet strings (§3) [folds O1/O2]
- `features/crisis/copy.ts` ← CrisisView §8 strings [B2 period preserved]
- `features/navigator/copy.ts` ← NavigatorFlow / ResultsView / HaltView chrome (§9)

---

## Staged-not-wired (no live surface / blocked / flagged) — nothing dropped

**Held in `features/pendingReview/copy.ts` (clinical + legal, imported by nothing):**
- §9 Navigator condition descriptions (12 drafts) — `[CLINICAL]`, Dr. Dobson. (Live Navigator
  still renders its existing fixture KB; these drafts are NOT wired in their place.)
- §9 Navigator intro + no-match — `[CT4]`, flagged Review List A for Dr. Dobson framing.
- §17 educational disclaimer body + heading — `[LEGAL]`/clinical sign-off. (Existing live
  disclaimers untouched.)
- §17 Terms + Privacy — `[LEGAL]` scaffold coverage lists only; counsel authors bodies.

**Held in `features/engagement/STAGED_ENGAGEMENT_COPY.md` (surfaces don't exist):**
- §1 streaks/grace · §2 paywall/premium · §3 history cap · §4 trends · §5 milestones · §7 re-engagement.

**Strings whose render element does not exist (reported, not built — copy-only task):**
- §11 reader onward-navigator line ("If this sounds familiar: the Symptom Navigator…") and a
  Share action — ArticleReader has no end-of-article onward block and no share control.
- §11 learn "Today's read / Tonight's read" labels live inside `lib/home-model.ts` READS meta;
  §11 "Browse by topic", offline-uncached, saved-empty don't map 1:1 to LearnView's structure.
- §0/§18 settings footer "Free for everyone · No ads." — no footer element in settings screens.
- §5 reminder-ask screen + notification strings — the reminder trigger is unwired post-A1.
- §15 account-tier delete strings (B3) — blocked scope (`rules/auth.md`).
- §16 supporter "Give monthly" — the supporter surface is one-time-only; monthly tier not built.

**Structural divergence — copy present but applying the deck verbatim would change behavior/IA
(out of copy-only scope; existing fixtures left intact, flagged for follow-up):**
- §10 Toolkit exercises — `features/toolkit/exercises.ts` is fixture-flagged-for-review and
  structurally differs from the deck (different grounding order/wording, no night-breathing or
  interrupted variants, no Again/Stop/end-line model). Wiring §10 requires new controls/variants.
- §15 Settings — mobile combines Appearance+Accessibility, uses "About & legal" vs deck "About
  Psychage", and "Make it yours" name/pin differs; both sides `[CT4]` fixtures. IA change → not applied.
- §18 generic offline banner "You're offline. Anything on your phone still works." vs mobile's
  title+body `CT4_OFFLINE`; both fixtures, different shape.

**Out of deck scope (noted, not changed):** `features/mood-journal/copy.ts` shares the old
"A word about it — optional" note placeholder, but Mood Journal is not one of the 19 Flow-Book
surfaces in the deck, so it was left unchanged.

---

## Safety holds — honored

- No flagged clinical/legal string is wired to any rendered component (pendingReview imported by nothing; engagement is Markdown).
- No auth or premium/paywall guard added to crisis, the Symptom Navigator (incl. the severity halt), or the daily check-in.
- No emoji in any applied string.
- Crisis helpline data (CT3) and the SR-4 on-device guarantees untouched — strings only.
