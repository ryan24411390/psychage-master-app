# Psychage Mobile — Product Brief

> **Purpose:** This is the thing the next 6 months of decisions get measured against. When a feature, design, copy, or scope question arises, this file is the tiebreaker. Re-read quarterly. Update only when the strategy genuinely changes — not when individual features change.
>
> **Last decided:** 2026-05-03
> **Last reviewed:** 2026-05-03

---

## What Psychage Mobile is

Psychage Mobile is a **native-first daily mental health practice that respects acute moments**. It is the practice journal to web Psychage's textbook. Users open it in two distinct moments: when something is wrong *right now*, and as a daily ritual to maintain a clearer mind over time. Both moments share the same app and the same data; the app's home screen detects which moment the user is in and leads with the right action.

It is **not** a glorified mobile version of the web platform. The web is comprehensive reference. Mobile is comprehensive practice. The mobile experience is built around what only mobile can do well: in-the-pocket access at the worst moments, daily 90-second touchpoints, and a closer relationship with the user's own mental health pattern over time.

It is **not** a therapy app, a meditation app, or a diagnosis tool. It is the foundational layer beneath those things — the place where users develop the language and self-awareness that lets them know whether they need therapy, what to ask their therapist about, and what is normal for their own pattern.

---

## Who it's for

Two primary mobile-native personas. Both real, both equally weighted.

**Aisha — 26, Anxious Achiever, urban tech-savvy.** Pulls out her phone at her desk during a panic episode. Wants to know if what she's feeling is anxiety. Wants tools to use *now*, not a 12-step questionnaire. Returns daily for the maintenance ritual once she's tried it once and found it valuable.

**Sofia — 21, International Student, abroad.** Lonely at midnight, scrolling for Portuguese-language mental health resources that understand cultural context. Discovers Psychage during a search. The app speaks her native language, doesn't pathologize her experience, and connects her to resources that work for international students on a student budget.

Carlos (concerned parent), the Lifelong Learner, and the Healthcare Professional segments from the wider Psychage audience research are **secondary** for mobile. They are better served by web. We do not design for them on mobile.

---

## What success feels like for the user

After the first 5 minutes: *"I have a name for what I'm feeling. I know what to do next."* Not "diagnosed." Not "fixed." Understood, with language, with options, with one next action that fits this moment.

After the first 5 weeks: *"I'm noticing my own patterns. I have a sense of what triggers me, what helps, and when I might need to talk to someone. My therapist (if I have one) understands me better because I show up to sessions with clarity."*

These two outcomes — first session and first season — are the criteria. Every feature gets evaluated against whether it serves one or both.

---

## What makes Psychage Mobile different

Three things, in priority order.

1. **Education-first, never diagnostic.** Every other mental health app either skips education (Calm, Headspace — go straight to "feel calmer") or skips to diagnosis (Wysa's chatbot infers conditions; ADAA quizzes label you). Psychage gives users the language and frameworks to understand themselves *without* labeling them. This is the foundational differentiator.

2. **Genuinely global from launch.** Five languages (English, Portuguese, Spanish, Swedish, French), cultural sensitivity baked into copy review, regional crisis resources, no Western-centric framing. Sofia's experience matters as much as Aisha's. No competitor is here.

3. **Connected to the user's actual care, not a closed walled garden.** "This is my therapist" lets the user link a real human professional and share what they're learning. The app makes the user a better client of their existing care, rather than substituting for it. Headspace, Calm, Wysa try to be the care. Psychage augments it.

---

## What it is NOT

Not therapy. Not diagnosis. Not meditation. Not a paid wellness subscription. Not a closed walled garden. Not the place to find a therapist for the first time (web is, mobile users either already have one or aren't ready for one). Not Western-centric. Not clinical or cold. Not flashy with engagement-bait gamification. Not built around streaks-as-pressure (streaks exist, but breaking one shouldn't make a user feel like they failed).

---

## Business model

**Consumer side: freemium, low-priced premium.**

- **Free tier (the public good):** Symptom Navigator, full article library access, daily check-in, crisis resources, "this is my therapist" linking, basic trends, all 5 languages.
- **Premium tier (~$5-9/month, exact price TBD via testing):** Unlimited journal history (free tier caps at e.g. 30 days), advanced trends and insights, multi-device sync, priority therapist linking with rich-format export, ad-free in perpetuity (we don't run ads anyway, but the commitment is concrete).

The premium pricing is deliberately low because the core mission is access. Premium subsidizes free, doesn't gatekeep clinical value. Anything that affects clinical safety or self-understanding stays free.

**Provider side: tiered B2B (V2 onward).**

- **Free:** Basic directory listing.
- **$29/month:** Featured listing — top of search, photo, expanded bio, click-to-book.
- **$79-149/month:** Full provider portal (V2) — patient-shared dashboards, session prep summaries from patient's check-ins, secure async messaging, scheduling integration.

V1 mobile ships only the free directory listing surface (lifted from web via WebView). Provider portal is V2.

**Sustainability layer:** Foundation grants (per existing funding strategy doc), enterprise/B2B contracts (employer wellness, university health services), and grants for translation and content expansion. Premium subscription is one revenue stream of three, not the primary.

---

## V1 timeline reality

Native-first V1 with the scope defined in `V1_FEATURE_SCOPE.md`, solo developer, including testing + accessibility + 5-language support, is realistically **4-6 months of focused work.** This is not a slowness — it's the honest math for shipping something *good*. We are choosing good over fast, and committing to that choice.

Milestones inside the 4-6 months:
- **Weeks 1-3:** Foundation complete (this work). Spec-driven workflow operational. First spec written.
- **Weeks 4-8:** Native check-in, native crisis surface, navigation shell, onboarding. First TestFlight build (Ryan only).
- **Weeks 9-14:** Native Navigator (acute mode), "my therapist" linking, share buttons, contextual article reader.
- **Weeks 15-20:** WebView-wrapped surfaces (Sleep, Relationship Health, Med Tracker, Clarity Score, full library, provider directory). Adaptive home screen logic. 5-language polish. Accessibility audit.
- **Weeks 21-24:** Beta with real users (10-20). Iterate on what they actually break or ignore. App Store submission prep. Submission.

---

## The 5-year vision (context only — not V1 scope)

Psychage becomes the foundational mental health literacy layer for the global population. The default starting point for "I think something is wrong, what is this?" The app every therapist asks their new clients to download in week one. Bundled into university student health packages, employer wellness programs, public health initiatives in countries without robust mental health infrastructure. Multi-language content covers 15+ languages. Provider network includes credentialed therapists in 50+ countries. The "industry standard" framing applies here, in year 5 — not year 1.

V1 is the plant. The vision is the tree. The plant is what we ship; we don't try to ship the tree.

---

## What this brief deliberately omits

- Tactical feature decisions → see `V1_FEATURE_SCOPE.md`
- Open architectural decisions blocking specific features → see `PROJECT_CONTEXT.md` §5
- Tech stack details → see `CLAUDE.md` §3
- Sacred safety rules → see `CLAUDE.md` §4
- Workspace state, repo structure, foundation phases → see `PROJECT_CONTEXT.md`

This file answers *what* we're building and *why*. The other files answer *how*.
