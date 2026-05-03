# Psychage Mobile — V1 Feature Scope

> **Purpose:** The features V1 ships. The call on what's native vs WebView. The priorities for build order. Read at sprint planning. Updated when scope formally changes (with brief.md alignment check).
>
> **Strategic anchor:** `PRODUCT_BRIEF.md`. Every feature here serves either "first 5 minutes" (acute moment) or "first 5 weeks" (maintenance habit). Features that serve neither don't ship.
>
> **Last decided:** 2026-05-03

---

## V1 success criteria

V1 is shippable when:

1. A first-time user can open the app, complete onboarding, and finish their first acute moment (Navigator → grounding/article → save) in under 5 minutes without confusion.
2. A returning user has done daily check-in 7 days in a row with the streak unbroken.
3. A user with a therapist has linked them, exported one journal/Navigator result, and shown it in a session.
4. Crisis flow works on every screen, in every language, with regional resources.
5. App Store and Play Store both approve on first or second submission.

If we ship and these five things don't happen with real users, we built the wrong V1 regardless of feature count.

---

## The four native surfaces (must be perfect)

These are the spine of the product. Native-built, offline-capable where it matters, no WebView fallback. Each gets its own spec via the spec-driven workflow.

### 1. Daily Check-In (the daily spine)

**Why native:** This is what makes someone open the app every day. Latency, smoothness, push notification reliability, watchOS/widget potential — all matter. Cannot ship as WebView.

**V1 surface:** 90-second flow. Mood (1-10 with emoji anchors), 1-2 contextual prompts (rotating, e.g., "What's on your mind?", "Sleep quality last night?", "Anything you noticed today?"). Save. Show streak + 7-day trend sparkline. Done.

**Premium gates:** Free users get last 30 days of history. Premium gets unlimited. Free users get basic trend. Premium gets pattern insights ("you tend to feel low on Mondays").

**Push:** User-chosen reminder time. Skippable, never nagging. Streak doesn't break for one missed day (3-day grace period — research shows this dramatically reduces uninstall after first missed day).

### 2. Symptom Navigator (acute mode)

**Why native:** Acute distress is the moment that earns trust forever. Cannot load slowly. Must work offline (user might be in a basement, on a plane, in a place with bad signal during a panic episode). Web's 8-step engine is right for desktop research; mobile needs a faster acute-mode flow.

**V1 surface:** 4-6 step flow (lighter than web's 8-step). Symptom selection (touch-optimized), severity slider, duration radio, results screen showing matched conditions with 0.75 confidence cap, links to relevant articles. Crisis halts at any severity per Sacred Rule #3.

**Native because:** offline-capable, faster than WebView, can integrate with iOS shortcuts ("Hey Siri, open Navigator") for acute access.

**Lifted from web:** scoring algorithm (per shared package — see PROJECT_CONTEXT.md §6 lift plan), symptom data, condition data, crisis logic.

### 3. "My Therapist" + Share Buttons

**Why native:** This is the differentiator. Has to feel like a first-class feature, not a buried setting.

**V1 surface:**
- Onboarding optional step: "Do you currently see a therapist? (yes / no / maybe later)"
- If yes: light-touch entry — name, email, optional phone, what they treat (free text or tags), session frequency
- Stored locally + Supabase if account
- Share buttons appear on: completed Navigator result, journal entries, weekly trend summaries
- Share generates: PDF or formatted email with the user's data, branded "Shared from Psychage", with explanation that user controls what they share

**No provider portal in V1.** Therapist receives a normal email with attachment. Provider portal is V2.

### 4. Crisis Surface

**Why native:** Must work in <2 taps from any screen, must work offline (regional resources cached), cannot be hidden or skipped. Sacred Rule territory.

**V1 surface:**
- Persistent "Crisis support" button accessible from every screen (likely a tab-bar or persistent header element)
- Tap → immediate access to: regional hotline numbers (geo-detected, manually overridable), text-line shortcuts, "I need to leave the app and go to the ER" copy, grounding exercise, "tell my therapist now" button
- Lifted from web's crisis resource database (29+ resources by region, lives in Supabase)
- Cached locally for offline access

---

## The six WebView surfaces (lifted from web V2)

These ship in V1 but are not native. They open in an in-app WebView with the user's session passed through. Native rebuild is scheduled for V2 based on actual usage data.

| Surface | Why WebView is fine | Native rebuild trigger for V2 |
|---|---|---|
| Sleep Architect | Sit-down planning tool. User builds a schedule once, references it. Not acute. Not daily. | If >40% of users use it weekly |
| Relationship Health Check | 17-dimension assessment. Long-form, sit-down. Quarterly use at most. | If users request it as native (likely never) |
| Medication Tracker | Daily logging happens in 3rd-party apps usually (Apple Health, etc.). Psychage's version is a "log + adherence trend" view. WebView is fine. | If >30% of premium users use it weekly |
| Clarity Score (7-dimension) | The longest assessment — 7 dimensions, multiple validated instruments. Sit-down. Quarterly to half-yearly use. | Same as Sleep — usage threshold |
| Full Article Library (browse all 1,000+) | The reference. Users open, read, leave. WebView with native chrome (header, share, bookmark) is the right shape. | When mobile-specific reading patterns emerge that WebView can't serve well |
| Provider Directory (full search) | Discovery happens deliberately, not in acute moments. WebView with native search input is fine. | When users want native maps view, save-search, etc. |

**Important nuance:** WebView surfaces still get native chrome — the back button, share button, "save" button, header, dark mode, language — all native. The web content fills the interior. Users perceive "native app with deep content," not "wrapped website."

**WebView technical decision:** Use `react-native-webview` with shared session via deep-link auth, native chrome via Expo Router stack screens, theme passed via URL parameters. WebView surfaces get a thin loading shimmer (matches native theme) so they don't appear janky during initial load.

---

## Adaptive home screen

V1 ships this. It's the unifier of the two-mode product (acute + maintenance).

**How it adapts:**

| Trigger | Home leads with |
|---|---|
| Time of day = user's chosen check-in time, no check-in done today | "Check in" CTA full-width |
| Last open <10 minutes ago | "Continue" — return to last surface |
| User checked "struggling" on onboarding, first 14 days | Navigator + crisis cards more prominent |
| User checked "curious" on onboarding | Articles + tools more prominent |
| Crisis logged in last 7 days | Therapist link CTA + grounding shortcut |
| Streak ≥7 days | Trend insights card surfaces |
| First open of the week | "How was last week?" reflection card |
| Default fallback | Check-in + Navigator + recent article side by side |

**Constraint:** Maximum 3 cards visible above the fold. Anything else is one tap down. The discipline of "don't show everything" is what makes adaptive valuable.

**Implementation:** Lightweight state machine, not ML. We're picking from ~8 home variants based on rules. ML personalization is V2 at earliest.

---

## Onboarding (V1 final)

5 screens, can be skipped from screen 2 onward.

1. **Welcome.** Brand hero, "Mental health clarity in your pocket." 1 sentence on what Psychage is. Continue.
2. **What brings you here?** Three options: *Curious about mental health · Struggling with something · Supporting someone else.* Persists for adaptive home. Skippable (default = curious).
3. **Preferred language.** Detected from system, confirm or change. EN, PT, ES, SV, FR.
4. **Do you have a therapist?** Yes / No / Maybe later. If yes → light-touch capture. Skippable.
5. **Daily check-in invitation.** "People in similar situations find a 90-second daily check-in helps them notice patterns. Want to try it?" Yes (set time) / Not now / Never. Sets reminder time, can change later.

No account creation in onboarding. Account prompted later only when user wants to persist data across devices, or hits the journal-history cap, or links a therapist.

---

## Build priority order (the 24-week roadmap)

| Sprint | Weeks | Focus | Native surfaces | WebView surfaces |
|---|---|---|---|---|
| Foundation | 1-3 | Phase 1-3 of foundation plan + first feature spec | — | — |
| 1 | 4-6 | Daily Check-In core | ✓ Check-in | — |
| 2 | 7-8 | Crisis surface + onboarding | ✓ Crisis, ✓ Onboarding | — |
| 3 | 9-11 | Navigator (acute mode) | ✓ Navigator | — |
| 4 | 12-14 | "My Therapist" linking + share | ✓ Therapist + share | — |
| 5 | 15-17 | WebView wrappers + native chrome | — | ✓ Sleep, ✓ Relationship, ✓ Med Tracker |
| 6 | 18-19 | More WebView wrappers | — | ✓ Clarity Score, ✓ Library, ✓ Directory |
| 7 | 20-21 | Adaptive home screen + integration | — | — |
| 8 | 22-24 | Polish, 5-language, accessibility audit, beta, submission | — | — |

24 weeks = 5.5 months. Buffer for the inevitable: 4-6 month range as stated in brief.

---

## Premium feature decisions (final for V1)

| Feature | Free | Premium |
|---|---|---|
| Daily check-in | ✓ unlimited | ✓ unlimited |
| Check-in history | Last 30 days | Unlimited |
| Trend insights | Basic 7-day sparkline | Advanced patterns ("Mondays low", correlations) |
| Symptom Navigator | ✓ unlimited | ✓ unlimited (no difference) |
| Article library | ✓ full access | ✓ full access (no difference) |
| Crisis | ✓ always free | ✓ always free |
| "My Therapist" linking | ✓ basic (1 therapist) | Up to 3 (psychiatrist, therapist, primary care) |
| Therapist share — PDF export | ✓ basic format | Branded, formatted, multi-week summaries |
| Multi-device sync | Single device | All devices |
| Sleep Architect, Relationship Health, Med Tracker, Clarity Score | ✓ full WebView | ✓ full WebView (no difference V1) |

**V1 conversion target:** 3-5% free → premium in first 90 days post-install. Not aggressive. Mental health users convert slower than wellness users; we don't want to push.

**Note on premium thinness in V1:** The premium feature set in V1 is intentionally narrow — primarily journal history depth, advanced trends, multi-therapist linking, and sync. This is by design. We're proving the daily-spine product first; premium grows in V1.5 / V2 once we have user data on what people actually want to pay for. Adding too much paywalled content in V1 contradicts the "free public good" positioning.

---

## What V1 explicitly does NOT include

These are V2 or later. Saying so explicitly to prevent scope creep:

- **MindMate AI chat — V2.** The web version exists with full safety infrastructure. Mobile version requires re-implementation of 3-layer safety in a mobile context, plus LLM costs that scale with users. Crisis flow + grounding exercises + article routing + therapist link covers most distress moments in V1. MindMate becomes V1.5 or V2 once V1 product-market fit is proven.
- Provider portal (the $79-149/mo provider tier). V2.
- Native rewrites of WebView surfaces. V2 based on usage data.
- ML-driven personalization. V2.
- Apple Watch / wearable integration. V2.
- Group features, community, peer support. V3 if at all.
- Voice/audio content (guided meditations etc.). V3 — competing with Calm/Headspace's strength is not the play.
- Insurance integration. V3 — needs business development first.
- Booking system for therapists. V2 with provider portal.
- Multi-account (e.g., parent monitoring child). V3.
- Dark patterns of any kind. Never.

---

## V1 success measurement (what we track from day one)

Wrapped into PostHog (or Amplitude, decision pending — see PROJECT_CONTEXT.md §5 open decisions):

- **Activation:** % users completing onboarding + first Navigator OR first check-in
- **Retention:** D1, D7, D30 (industry benchmark for mental health is 35% / 15% / 8%; we target 50% / 25% / 15%)
- **Daily ritual stickiness:** average check-ins per active user per week
- **Navigator completion rate:** % of Navigator starts that reach results
- **Crisis flow usage:** counts only, never content (Sacred Rule #11)
- **Therapist link rate:** % of users with linked therapist (target: 25%)
- **Premium conversion:** free → paid % at 30/60/90 days
- **Language distribution:** % users in each of 5 languages
- **WebView vs native engagement:** time spent in each, to validate WebView decisions for V2 native rebuild prioritization

What we explicitly do NOT track: symptom selections, journal content, Navigator results content. Per Sacred Rule #4, this never leaves the device.
