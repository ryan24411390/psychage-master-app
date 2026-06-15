# Psychage iOS — Full QA Sweep & Fix Report

**Date:** 2026-06-16 · **Branch:** `integration/consolidate-all` · **Build:** Debug dev-client, exit 0
**Device:** iPhone 17 Pro simulator (iOS 26.x, Xcode 26.2) · **Driver:** deep-link nav + `simctl` screenshots
**Honesty key:** `VERIFIED` = ran it & observed · `FAILED` = ran it & it broke · `UNTESTED` = couldn't test (reason given). No PASS is inferred from reading code; code-only findings are labelled **code-verified**.

---

## 0. Headline — Auth (top priority)

The reported "confirmation emails not sending" + "credential mismatch on sign-in" are **one backend root cause**, confirmed by probing the live project directly (not by reading code):

```
POST https://ozourhqyqtpppvpbhphw.supabase.co/auth/v1/signup
 → 200, returns { id, role:"authenticated", email, confirmation_sent_at }
 → NO access_token / refresh_token
```

No session on signup ⇒ **Confirm-email is ON** on the live project. The cascade:

1. **Emails not sending** — confirm-email ON but **no working custom SMTP** on the live Supabase dashboard. Hosted Supabase's built-in sender is rate-limited (`email_sent = 2`/hr) and effectively disabled for hosted signups. `confirmation_sent_at` is stamped but nothing is delivered.
2. **"Credential mismatch" on sign-in** — pure downstream of #1. Unconfirmed user → `signInWithPassword` → GoTrue `"Email not confirmed"` → client correctly collapses to generic `invalid-credentials` ([supabase-auth-service.ts:92](../apps/mobile/features/auth/supabase-auth-service.ts#L92), security rule: no account-existence leak) → user reads it as "wrong password."

**This is a backend/ops blocker — not a client bug.** Confirm-email ON is *correct* per [rules/auth.md:93](../rules/auth.md#L93) ("Email verification REQUIRED before account is fully usable"). The fix is to make emails **deliver** (configure custom SMTP), not to disable confirmation. It cannot be fixed from the repo — it needs Supabase dashboard access + SMTP credentials. **See §5 for exact steps.**

**Honesty boundary:** confirm-email ON is `VERIFIED` (probed live). Email *delivery* is `UNTESTED` — needs inbox/SMTP-log access I don't have. Full happy-path (signup → confirm → signin) is therefore `UNTESTED` until SMTP is configured.

---

## 1. Detected stack

| Aspect | Finding | How confirmed |
|---|---|---|
| Framework | Expo SDK 54 / React Native 0.81 / React 19, Expo Router v6 | `apps/mobile/package.json`, `app/` file-based routes |
| Build | `npx expo run:ios` → Debug dev-client, **Build Succeeded, 0 errors, 2 benign warnings** (SDWebImage deployment-target) | build log |
| JS bundle | Loads from Metro (:8081, alive) | app rendered Today tab on launch |
| Backend | Shared Supabase `ozourhqyqtpppvpbhphw`; dual client (anon read + session auth) | `lib/supabase.ts`, `lib/supabase/client.ts` |

**Tooling note (affects coverage):** no UI-input driver was available — `idb-companion` is removed from Homebrew (formula gone), and System Events / AppleScript UI scripting is denied assistive access (`-1719`). So **tap and text-input tests are `UNTESTED`**, per the prompt's screenshot-only fallback rule. Navigation was driven via Expo Router deep links (`psychage://<route>`), which reach every registered screen for visual verification.

---

## 2. Inventory & verification (Phase 1)

~30 screens reached & visually verified via deep link. Empty / loading / error states captured where reachable.

| Screen | Entry | Status | Notes (evidence in `/tmp/qa-shots/`) |
|---|---|---|---|
| Cold launch → Today | app launch | ✅ VERIFIED | Header, Help-now, state pills, Welcome, week record, Check-in CTA, Toolkit + Navigator cards `00/01` |
| Learn tab | `learn` | ✅ VERIFIED | Featured guide, category carousel, Read-the-guide `02` |
| Compass tab | `compass` | ✅ VERIFIED | Tool grid, person-first card copy `03` |
| Find tab | `find` | ✅ VERIFIED | "A listing is information, not a recommendation" disclaimer `04` |
| Crisis | `crisis` | ✅ VERIFIED | Red emergency CTA + graceful empty state (no verified helplines for region) + "Not in Chile?" `test-deeplink` |
| Crisis-region | `crisis-region` | ✅ VERIFIED | Searchable country list, current region checked `74` |
| Symptom Navigator (intro) | `navigator` | ✅ VERIFIED | Body/Mind/Sleep/Both selector, no diagnostic language `05` |
| Saved | `saved` | ✅ VERIFIED | Filter chips + "Nothing saved yet" empty state `07` |
| History / Your record | `history` | ✅ VERIFIED | Week dots + loading shimmer `08` |
| Reflection | `reflection` | ✅ VERIFIED | "A mixed week." card, full-record links `73` |
| Settings hub | `settings` | ✅ VERIFIED | Full menu, profile, support, account `10` |
| Settings · Appearance | `settings/appearance` | ✅ VERIFIED | Light/Night/System, text size, **person-first preview**, reduce-motion toggle `11` |
| Settings · Privacy | `settings/privacy` | ✅ VERIFIED | "Lives on this device", "don't sell your data", backup off-by-default, JSON/CSV export, clear-on-device `12` |
| Settings · Reminders | `settings/reminders` | ✅ VERIFIED | Gentle daily-reminder toggle (off) `13` |
| Settings · Delete | `settings/delete` | ✅ VERIFIED | Clear irreversibility warning, red destructive CTA `15` |
| Tool · Clarity Score | `tools/clarity` | ✅ VERIFIED | "not a test, not a label", "answers stay on this device" `20` |
| Tool · Mood Journal | `tools/mood-journal` | ✅ VERIFIED | "Notice what comes up", empty state `21` |
| Tool · Sleep Architect | `tools/sleep` | ✅ VERIFIED | Tabs + "education, not medical advice or a diagnosis" `22` |
| Tool · MindMate | `tools/mindmate` | ✅ VERIFIED | Strong "I'm not a therapist… I don't diagnose" disclaimer `23` |
| Tool · Relationship Health | `tools/relationship-health` | ✅ VERIFIED | "Educational, not diagnostic", Gottman/EFT-grounded `25` |
| Toolkit (breathing) | `toolkit` | ✅ VERIFIED | "A moment to steady your breath", Begin/close `72` |
| Sign-up | `sign-up` | ✅ VERIFIED | Email + password + Create-account `31` |
| Verify | `verify?email=` | ✅ VERIFIED | "Check your email", shows address, Resend `32` |
| Onboarding · Welcome | `onboarding/welcome` | ✅ VERIFIED | "This is Psychage… free, for everyone" `40` |
| Onboarding · Record | `onboarding/record` | ✅ VERIFIED | "Five plain words… stays on your phone" `41` |
| Therapist · Add provider | `add-provider` | ✅ VERIFIED | Provider name + optional contact `50` |
| Find · Directory | `find/directory` | ✅ VERIFIED | Search + Near-me + Filters + loading spinner `60` |
| Conditions index | `conditions` | ✅ VERIFIED | "educational — it is not a diagnosis", topic list `70` |
| Sign-in | `sign-in` | ⚠️ UNTESTED via deep link (404 — group-route addressing artifact). Renders the same `SignUpForm` as sign-up (VERIFIED) | code-verified identical |
| Library (WebView) | `library` | ⚠️ UNTESTED rendering | route exists (sitemap), is a `WebViewSurface`; see Defect D-2 |
| Med-tracker (WebView) | `tools/med-tracker` | ⚠️ UNTESTED rendering | `WebViewSurface`; see Defect D-2 |
| Find · Compare | `find/compare` | ⚠️ UNTESTED | deep-link 404 (param-gated route) |
| Provider directory results | `find/directory` | ⚠️ UNTESTED | spinner shown; results load depends on `search_providers_v3` RPC (unscoped query times out — known) |
| All tap/toggle/text-entry interactions | — | ⚠️ UNTESTED | no input driver (see §1 tooling note): form submit, switches, navigator Q&A, search typing, bookmarking |

**On the deep-link 404s (sign-in, library, med-tracker, toolkits, find/compare):** the Expo Router **sitemap** (`psychage://_sitemap`) lists all of these as registered routes. The 404s are deep-link *addressing* artifacts (single-segment custom-scheme URLs parse the segment as host; some collapse to an empty path), **not missing screens**. Confirmed by reading the route source.

---

## 3. Defect log (Phase 2)

| ID | Screen / area | Severity | Symptom | Root cause | Evidence |
|---|---|---|---|---|---|
| **D-1** | Auth (signup→signin) | **Blocker** | Confirmation email never arrives; sign-in then fails as "credential mismatch" | **Backend:** live project has confirm-email ON with **no working custom SMTP**. Sign-in failure is the unconfirmed-user cascade. | live `/auth/v1/signup` probe (§0) |
| **D-2** | WebView surfaces (library, med-tracker, directory, provider, clarity-score) | **High** (code-verified) | Opening a web-backed surface in-app dead-ends on "Unmatched Route" (+not-found) | `AUTH_SIGN_IN_ROUTE = '/auth/sign-in'` but `(auth)` is a router **group** → real URL is `/sign-in`. B2 stub issuer always throws → pushes the stale 404 target. In-app entries exist ([LearnView.tsx:85](../apps/mobile/features/learn/LearnView.tsx#L85), ConditionDetailView, toolkits routing). | [auth-handshake.ts:30](../apps/mobile/features/webview/auth-handshake.ts#L30) + [WebViewSurface.tsx:62-71](../apps/mobile/features/webview/WebViewSurface.tsx#L62-L71) |
| **D-3** | Verify screen · Resend | **Medium** | "Did not get it? Resend" silently no-ops exactly when confirm-email is ON | `resendVerification` read the address from `getSession()`, but signup returns no session when confirm-email is ON | [supabase-auth-service.ts:104](../apps/mobile/features/auth/supabase-auth-service.ts#L104) + [verify.tsx:16](../apps/mobile/app/(auth)/verify.tsx#L16) |
| **D-4** | Local Supabase config | **Low** | Dev diverges from prod | local `enable_confirmations = false` contradicts spec + live state | [config.toml:219](../supabase/config.toml#L219) |
| **N-1** | Verify / sign-in UX | **Note (needs review)** | Unconfirmed sign-in shows "invalid credentials", not "confirm your email first" | Deliberate generic error ([security.md:95](../rules/security.md#L95), no existence leak). Confusing but governed by a security rule — flag for Dr. Dobson, do **not** change unilaterally. | — |

WebView surfaces still also depend on the **B1/S34 WVT issuer** (currently a stub that throws by design) and `WV_ORIGIN = https://psychage.com`. Even with D-2 fixed they redirect to sign-in until the real issuer lands — that's a known incomplete slice, not a regression.

---

## 4. Fix plan & results (Phases 3–4)

Ordered by severity. Each fix is one logical change, separately committed; gates (Sacred-Rule hooks + Biome) passed on every commit.

| ID | Fix | Where | Verify | Commit |
|---|---|---|---|---|
| D-1 | **Backend only — cannot fix in repo.** SMTP steps in §5. | Supabase dashboard | n/a | — |
| D-4 | `enable_confirmations = true` (+ note re: prod SMTP) | `supabase/config.toml` | typecheck n/a (toml) | `f96da21` |
| D-2 | `AUTH_SIGN_IN_ROUTE: '/auth/sign-in' → '/sign-in'`; test updated to lock it | `auth-handshake.ts` + test | typecheck ✅, vitest 14/14 ✅ | `f967303` |
| D-3 | `resendVerification(email?)` threads the verify route email; falls back to session email | `auth-service.ts`, `supabase-auth-service.ts`, `verify.tsx` | typecheck ✅, vitest ✅ | `008dd69` |
| N-1 | **Not changed** — flagged for clinical/security review | — | — | — |

**Regression (Phase 4):** after the edits hot-reloaded into the running app — `REG-home.png` boots clean (no red screen), `REG-verify.png` renders with the email param + Resend button (D-3 data path live). Full auth Vitest suite **29/29 passed**. `pnpm typecheck` clean.

**Honesty:** D-2 and D-3 are `VERIFIED` at the type/test/regression level. Their *in-app runtime* behavior (tapping Learn→Library lands on sign-in; tapping Resend dispatches) is `UNTESTED` — no input driver to tap (§1). The fixes are mechanical and the code paths unambiguous.

---

## 5. D-1 backend fix — exact Supabase steps (founder action)

Confirm-email is correctly ON; the gap is delivery. On the **live** project `ozourhqyqtpppvpbhphw`:

1. **Dashboard → Authentication → Emails → SMTP Settings → Enable custom SMTP.**
2. Enter a transactional provider (Resend / SendGrid / Postmark / SES). Example (SendGrid): host `smtp.sendgrid.net`, port `587`, user `apikey`, pass = API key, sender = a verified domain address (e.g. `no-reply@psychage.com`).
3. **Verify sender-domain SPF/DKIM** with the provider, or confirmation mail lands in spam / is rejected.
4. **Authentication → URL Configuration:** set Site URL + redirect allow-list to the production deep-link/site (local `config.toml` still points at `127.0.0.1:3000` — must not be the prod value).
5. Raise the **email rate limit** above the default `2/hr` once SMTP is live (Authentication → Rate Limits).
6. **Verify delivery:** sign up a fresh test address on a real inbox you control → confirm the email arrives → tap the link → sign in succeeds. Only then is D-1 `VERIFIED`. Use a test inbox; do not test against real users.

Keep confirm-email ON (spec). Do **not** disable it as a shortcut.

### Procedure-B security checklist (auth commits D-2/D-3/D-4)
1. **TLS** — unchanged; `WV_ORIGIN` HTTPS-enforced, supabase-js TLS on every call.
2. **Secrets** — none added; only the public anon key/URL are read from `EXPO_PUBLIC_*`. SMTP key goes in dashboard/EAS secrets, never code.
3. **Error messages** — generic `invalid-credentials` contract preserved (no existence leak); D-3 resend still returns only `{ ok }`.
4. **Token storage** — untouched; session stays in `expo-secure-store`.
5. **Audit log** — `record_auth_event` path untouched. (Note: the RPC is not yet deployed live — see §6.)

---

## 6. Open items not fixed here

- **D-1** backend SMTP — founder/ops (above).
- **N-1** unconfirmed-sign-in copy — clinical/security review (Dr. Dobson).
- **Live migrations unapplied** — `record_auth_event`, `check_ins`, `delete_account` RPCs return 404 on the live project; mobile audit/account-tier writes silently fail live. Ops `db push` + enable the access-token hook. (Pre-existing, out of this sweep's scope.)
- **Input-driven re-test** — D-2/D-3 in-app behavior, all toggles/forms/navigator flow, provider-directory results: re-run once an input driver (XCUITest target or a working idb) is available.

---

## Appendix — screenshots
All in `/tmp/qa-shots/` (downscaled). Before/after for the fixed flows: deep-link 404 captures (`R1-sign-in`, `R2-library`, `R3-med-tracker`) vs registered-route proof (`SITEMAP`); regression `REG-home`, `REG-verify`.
