# Auth model — the rule file

> **Scope:** This file defines how authentication works in Psychage Mobile V1. Loaded by Claude Code whenever auth-adjacent code is written. While this file existed-but-empty, the auth scope was BLOCKED per `CLAUDE.md` §5. With this file populated, that scope is unblocked — but only within these boundaries.
>
> **Last decided:** 2026-05-03
> **Authority:** This file is authoritative for V1. V2 changes require updating this file *before* the implementation, not after.
>
> **Reading order:** §1–3 are the model. §4–6 are the implementation rules. §7–9 are the edge cases and compliance.

---

## Amendment 2026-06-16 — auth-experience pass (⚠ PENDING DR. DOBSON RATIFICATION)

> This amendment records a product-directed change to the auth experience. It is written
> *before* implementation per the Authority clause above. **The copy and the front-door
> model change require Dr. Dobson's clinical sign-off before launch** (CLAUDE.md §7). Until
> then, treat the affected UI copy as `// CT4` placeholder.

Three changes, with the Sacred-Rule invariants they must not break:

1. **Front-door Welcome gate (amends §1).** First launch now opens a branded Welcome screen
   offering **Continue**, **Log in**, and **Sign up** — *before* the existing product
   onboarding. **Invariant (non-negotiable):** "Continue" enters the app **anonymously** and
   gives full Tier-1 access; the gate is never a hard wall. **Crisis is never gated** (Sacred
   Rule #3) — it stays reachable from every surface including the Welcome screen. Signed-in
   users skip the gate.
2. **Social sign-in confirmed V1 (consistent with §3).** Apple + Google ship now. (§3 already
   lists both as V1; this resolves the open-decision conflict in `PROJECT_CONTEXT.md` §5 in
   favour of shipping.)
3. **Sign-up form additions (amends §9).** Sign-up now collects **full name**, a **confirm-
   password** field, shows a **password-strength meter** (display-only — the min-8 length in §3
   is still the only *gate*, per NIST), and requires **Terms + Privacy acceptance** (App Store
   5.1.1). "Remember me" is **still rejected** (§9 unchanged) — sessions persist by default.

---

## 1. The three tiers

Every feature in the app sits in exactly one of these tiers. No exceptions, no "kinda."

### Tier 1 — Anonymous-OK (no account ever required)

These features work without any account, on first install, with no signup wall. The user can use them on a fresh phone, complete the experience, close the app, and never return — and the experience was complete.

- **Symptom Navigator** (the acute mode flow). Per Sacred Rule #4, this never persists to a server anyway. Always anonymous.
- **Crisis surface.** Sacred Rule #3 — must work for any user instantly. No auth wall, ever.
- **Article reading** (any article in the library, native or WebView).
- **Single-session daily check-in.** The user can do *one* check-in without an account. It's stored locally in MMKV with a 7-day TTL. After 7 days the entry is deleted.
- **Provider directory browsing** (the WebView surface).
- **All long-form WebView tools** (Sleep, Relationship, Med Tracker, Clarity Score) — they save to local storage with the same 7-day TTL until an account is created.

The 7-day TTL on local-only data is deliberate. It's long enough that a user who returns next-day or next-week sees their previous entries; short enough that a "I tried this app once weeks ago" reinstall doesn't recover stale data they don't remember creating.

### Tier 2 — Account-required (just-in-time prompt)

These features require an account, but the account prompt fires *at the moment of perceived loss or perceived need*, never upfront and never gating the first valuable experience.

- **Streak persistence beyond 7 days.** Day 7 of a streak triggers a soft prompt: "Save your streak so it survives a phone reset" — skippable, but the user has skin in the game now.
- **Journal history beyond 30 days** (free tier cap).
- **"My therapist" linking.** The therapist's contact info is sensitive; we don't store it without an account.
- **Multi-device sync** (V2 only — V1 doesn't have this, but the rule is here so V2 uses the same auth tier).
- **Any data that should survive an app reinstall** — the prompt fires *before* the data would be lost.
- **Therapist share / export** — generating a branded PDF or email with multi-week summary requires an account so the data exists in a stable form.

### Tier 3 — Premium-paywalled

Account-required AND active paid subscription required.

- **Unlimited journal history** (free tier = last 30 days; premium = unlimited).
- **Advanced trend insights** (pattern detection, "you tend to feel low on Mondays" correlations).
- **Multi-therapist linking** (free = 1 therapist; premium = up to 3 — psychiatrist, therapist, primary care).
- **Formatted, branded multi-week summary exports.**
- **MindMate AI** (V2 only — not in V1).

**Hard rule:** No clinical-safety feature ever moves to Tier 3. Crisis, Navigator, articles, single-session check-in are permanently free. Premium is for power features and depth, not for safety.

---

## 2. Just-in-time prompt triggers

Each Tier 2 transition fires at a specific moment. Document them here so the implementation matches:

| Trigger | UI moment | Prompt copy intent |
|---|---|---|
| 4th day of streak (anonymous) | After streak counter ticks to 4 on home | "You've checked in 4 days in a row. Want to save this so it survives a phone reset?" |
| Hitting 30-day journal cap (free account, not premium) | When user scrolls past day 30 | "Want to see your full history? Premium unlocks unlimited journal history." (Tier 2→3 prompt, but only after Tier 2 is established) |
| Therapist link attempt (anonymous) | First tap on "Add my therapist" in onboarding or settings | "Adding a therapist saves their info securely. Sign up to keep this private and persistent." |
| Sharing first export (anonymous) | First tap on "Share with my therapist" | "Sharing requires an account so we can format the export. 30 seconds." |
| Crossing 7-day TTL on anonymous data | Background event when user re-opens app and oldest local data is approaching deletion | "Your check-ins from last week will be deleted soon. Sign up to keep them?" |

**Constraint:** No more than ONE just-in-time prompt per session. If multiple triggers fire in the same session, only the most contextually relevant one shows. The others fire next session.

**Hard rule:** Just-in-time prompts are skippable and never block the user from continuing the action they were taking. "Skip for now" is always a valid choice.

---

## 3. Sign-up methods (V1)

Supabase Auth handles all of these. Don't roll our own.

### Enabled in V1

- **Email + password** — fallback for users who don't trust social login or don't have Apple/Google accounts (Sofia in some markets).
- **Sign in with Apple** — required by App Store 4.8 for iOS apps that offer third-party social login.
- **Sign in with Google** — global parity, especially for Sofia persona (most international users have Google accounts).

### NOT in V1

- **Magic link** — V1.5 if data shows users want it. Adds email-deliverability risk and "I never got the email" support load.
- **Phone-number auth** — V3 if at all. Costs money (SMS), spam vector, doesn't fit personas.
- **Anonymous Supabase auth** — V1 stays purely device-local for anonymous users. We don't create Supabase anonymous-user rows that we then migrate. Cleaner separation.

### Method-specific rules

**Email + password:**
- Minimum password length: 8 characters
- No complexity requirements beyond length (per NIST SP 800-63B; complexity hurts more than it helps)
- Email verification REQUIRED before account is fully usable (Tier 2 features unlock after verification)
- Verification email expires after 24 hours; resend available
- Password reset via standard Supabase flow

**Sign in with Apple:**
- Use `expo-apple-authentication`
- Request name + email scopes; both optional from user
- If user picks "Hide my email" (Apple's relay), accept it — don't push back
- Apple-issued user ID is the stable identifier; email may change if user revokes

**Sign in with Google:**
- Use `expo-auth-session` with Google OAuth
- Request `openid email profile` scopes — minimum needed
- Display name pulled from profile if available; user can edit later

---

## 4. Anonymous → account migration

When a user creates an account (any method), all their tier-1 local data migrates to their new account.

### What migrates

- All check-ins from the last 7 days (the local TTL window)
- Symptom Navigator history (rolling 30-day local window of *summaries* — never raw symptom data per Sacred Rule #4)
- Article bookmarks
- Reading history (last 50 articles)
- Onboarding answers (curious / struggling / supporting someone else, language, check-in time)
- Any drafted but unsaved therapist info (rare but possible)

### What does NOT migrate

- Raw Symptom Navigator selections (Sacred Rule #4 — never persists to server)
- Crisis flow usage history (Sacred Rule #11 — usage counts only, never content, and even counts stay device-local until explicit user opt-in to analytics)
- Content of unsent share drafts (these are local-only by design — user can re-create after account creation)

### Migration mechanics

- On account creation success, run a single transactional batch insert of local data into Supabase
- Failures roll back: if the batch fails, the account is created but local data stays put for retry on next launch
- After successful migration, local copies of migrated data are kept for 24 hours (graceful fallback if sync glitches), then cleared
- Migration is one-way and one-time per account creation. No "merge two accounts" feature in V1 (V3 if at all)

### What happens if user installs on new device

User signs in. Their account-tier data syncs down (V1 = read-only sync of historical data, V2 = full bidirectional). Their tier-1 local data on the *new* device is empty (fresh install). The 7-day TTL window resets. This is by design — fresh device, fresh tier-1 window, no surprise.

---

## 5. Anonymous user data lifecycle

The rules for tier-1 data on a single device:

- **Storage:** MMKV (per stack). Encrypted-at-rest via OS keystore (iOS Keychain / Android Keystore) where MMKV supports it.
- **TTL:** 7 days for check-ins, 30 days for Navigator summaries, 90 days for article reading history, indefinite for onboarding answers (until cleared).
- **Cleanup:** Daily background task (Expo Background Fetch when implemented in V2; manual on app foreground in V1) checks for expired entries.
- **User-initiated wipe:** Settings → "Clear all my data" wipes MMKV completely. Confirms with a destructive-action modal. Irreversible. Lock-in: this MUST always work, even on Tier 1 anonymous users — privacy is non-negotiable.
- **Reinstall:** App reinstall = local data gone. By design. Anonymous-tier users have no way to recover. The 4th-day streak prompt exists exactly for this reason.

### MMKV instance separation

Two distinct MMKV instances — never merged:

```
psychage-anonymous   tier-1 local data, TTL-managed, no sync
psychage-account     mirror of account data, synced from Supabase (V1 read-only, V2 bidirectional)
```

When an anonymous user creates an account, data migrates from `psychage-anonymous` to Supabase, then `psychage-account` is populated from Supabase on next sync.

`psychage-anonymous` is plaintext for tier-flag-class data (non-PII device preferences). Any data containing PII or symptom payloads MUST use an encrypted instance (`psychage-account`, encryption key from auth slice).

---

## 6. Session management

- **Storage:** Supabase tokens (access + refresh) in `expo-secure-store`. Never MMKV. Never AsyncStorage. Per Sacred Rule #11.
- **Refresh:** Supabase JS client handles token refresh automatically. We don't roll our own.
- **Expiry:** Default Supabase access token (1 hour) + refresh token (configurable, set to 30 days per project). On refresh failure, user is logged out gracefully.
- **Background:** When app moves to background, no special handling. When app comes to foreground after >24 hours, force a session validity check before allowing Tier 2 actions.
- **Multiple devices:** V1 = one session per device, no enforced single-session. V2 may revisit if abuse patterns emerge.

---

## 7. Account deletion (GDPR + App Store 5.1.1(v))

Required by both EU regulation and Apple Store policy. Must exist from V1 launch.

### Settings → Delete account

Flow:

1. User taps "Delete account" in Settings
2. Modal: "Deleting your account will permanently remove..." — list everything that gets deleted (account, all check-ins, journal entries, therapist links, premium subscription)
3. User must type their email (the one on the account) to confirm
4. Subscription cancellation handled before deletion if active (refund per platform policy)
5. Server-side deletion: Supabase cascade-delete via foreign keys; verification job runs 7 days later to confirm
6. Local-side deletion: clear `psychage-account` MMKV instance, clear secure-store tokens
7. After deletion: app returns to anonymous state, opens to onboarding

### What we keep (and disclose)

- Anonymized aggregate analytics events (no PII, no journal content)
- Required transactional records (subscription billing per tax law) for the period required by law (typically 7 years for tax records)
- Crisis flow usage *counts* (never content) for service-quality reporting

This is disclosed in the Privacy Policy (which Claude Code does NOT generate — that's Dr. Dobson's review territory).

### Hard rule

Account deletion must complete from the user's perspective within 30 days (GDPR Article 17). Server-side propagation can take longer for backups/replication, but the user-facing data is gone immediately.

---

## 8. Sacred Rule alignment

This auth model upholds all Sacred Rules. Spelled out for verification:

| Rule | How auth respects it |
|---|---|
| **#3 Crisis cannot be disabled** | Crisis is Tier 1 (anonymous-OK), never gated by auth state. Crisis flow works offline (per `rules/offline.md`). |
| **#4 Navigator state client-only** | Navigator is Tier 1. Even after account creation, raw Navigator selections are never synced — only Navigator summary metadata (which condition was matched, when). |
| **#11 No PII unsanitized** | Auth tokens in expo-secure-store (encrypted). Email + name are minimum fields stored. Therapist info encrypted-at-rest in Supabase. Sentry `beforeSend` strips emails from any error reports. |
| **#13 Versioned migrators** | The MMKV schemas (`psychage-anonymous` and `psychage-account`) get version fields from V1. Migration functions versioned independently. |

---

## 9. Edge cases and explicit non-features

Documented here so they don't get re-litigated:

- **No "remember me" / persistent login toggle.** V1 sessions persist via secure-store refresh tokens by default. User can sign out manually. Removing the toggle removes a UI surface that users misunderstand.
- **No biometric unlock for app launch.** Adds complexity, not security (the data already encrypts-at-rest). V2 if requested by users.
- **No password expiry.** Per NIST guidance.
- **No security questions.** Phishing vector. Use email-based password reset.
- **No pseudonymous accounts.** All accounts have a verified email. Username display is just an alias.
- **No "delete data but keep account" feature.** Two reasons: (a) GDPR doesn't require it, (b) it creates inconsistent state (account exists, data doesn't, what's the value?). Account deletion = data deletion.
- **Anonymous users see no usage limits visibility.** "You've used 4 of 7 free days" copy is patronizing and creates pressure inconsistent with the brand. The data lifecycle rules in §5 work silently.
- **No "import data from psychage.com" flow in V1.** Web users who install mobile log in with the same Supabase account; their *web-account* data syncs (read-only V1, bidirectional V2). There's no export-from-web → import-to-mobile flow.

---

## 10. Implementation pointers

When Claude Code is implementing auth code, it should:

1. Use Supabase Auth client (`@supabase/supabase-js`) — never custom auth.
2. Wrap auth calls in a `useAuth()` hook (React context provider for the user object).
3. Place all auth UI (sign-up, sign-in, password reset, account deletion) in `apps/mobile/src/features/auth/`.
4. Just-in-time prompts live in `apps/mobile/src/features/auth/prompts/` with one component per trigger from §2.
5. Never import auth state directly into Tier 1 features. Tier 1 features must work with `useAuth()` returning null.
6. Test cases: every Tier 1 feature must have a test that runs with `useAuth()` mocked to null. Every Tier 2 feature must have a test with `useAuth()` mocked to a valid user object AND with null (verifying the just-in-time prompt fires).

When in doubt, refuse the change and ask. Auth touches every Sacred Rule.

---

## What this file deliberately omits

- Specific UI copy — that lives in `apps/mobile/src/features/auth/copy.ts` after Phase 6 scaffold; here we describe intent only
- Database schema for users/sessions/therapist-links — that lives in `ARCHITECTURE.md` once written
- Offline behavior of auth — that lives in `rules/offline.md` once written
- Security audit and threat model — not V1 work; do this before V1 public launch
