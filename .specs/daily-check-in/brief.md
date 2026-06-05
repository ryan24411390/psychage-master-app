# Brief: Daily Check-In

**Spec ID:** daily-check-in
**Created:** 2026-06-05
**Status:** Discovery complete — ready for /spec-requirements

## Problem

People who want to notice their own mental-health patterns have nowhere low-friction to do it.
Aisha pulls out her phone at her desk and thinks "am I more on-edge this week than last?" — but
the honest answer lives nowhere. Generic journaling apps demand a blank page and five free
minutes she doesn't have; tracking "in her head" decays within a day. She needs a 90-second,
same-time-every-day ritual that turns a vague feeling into a visible trend she can act on —
without it feeling clinical, and without being told what's "wrong" with her.

## Users

**Primary — Aisha** (26, anxious achiever, urban, tech-savvy). She tried the app once in an
acute moment, found it useful, and now wants the maintenance ritual: open, log how she feels in
under two minutes, see her streak, close. The returning daily user is the whole point of this
surface.

**Secondary — Sofia** (21, international student, Portuguese-speaker). Drives the
language/cultural-sensitivity requirements: emoji anchors, contextual prompts, and any insight
copy must read naturally and non-pathologizing in all five languages, not just English.

## Why now

Daily Check-In is the **daily spine** (V1_FEATURE_SCOPE §1) and Sprint 1 of the 24-week
roadmap — it is what makes someone open the app every day, and V1 success criterion #2 is a
returning user with a 7-day unbroken streak. It is also the first feature shipped through the
spec-driven workflow (Phase 11). Everything else (adaptive home's "Check in" card, trend
insights, the streak-save account prompt) depends on this surface existing first.

## Scope

**In:**
- 90-second flow: mood **1–10** with emoji anchors → **1–2 rotating contextual prompts**
  (e.g., "What's on your mind?", "Sleep quality last night?") → save → **streak + 7-day trend
  sparkline**.
- Surfaces on the **Today tab** (resolved mobile IA — `bottom-tabs-4-custom-plus-avatar-header`).
- Works **anonymously, MMKV-first** (Tier 1 single-session check-in, 7-day local TTL per
  auth.md §1); syncs to the user's account on creation (auth.md §4).
- **Offline-with-queue**: accepted offline, `queue:check-ins` drained first on reconnect, with
  visible save states ("Saved" / "Saved offline — will sync") per offline.md §3/§5.
- **Streak + 3-day grace** computed **locally in pure TS** from local data, reconciled on sync.
- **Push**: Expo Notifications, user-chosen reminder time, skippable, never-nagging.
- **Premium gates**: free = last 30 days history + basic 7-day sparkline; premium = unlimited
  history + pattern insights ("you tend to feel low on Mondays").

**Out:**
- Symptom Navigator, Crisis surface, My Therapist, journaling free-text entries — separate
  specs. (Low-mood → crisis routing is an open clinical question below, not in-scope yet.)
- Account creation flow / auth UI (owned by auth spec; this feature only *consumes* `useAuth()`).
- The `check_ins` Supabase migration authoring (cross-repo; see Open questions #2).
- Background-task drain, Realtime sync, multi-device sync, watchOS/widget — all V2.
- ML/correlation engine for insights beyond rule-based "Mondays low" pattern detection.

## Success metric

**Day-7 check-in retention** — % of users who complete a check-in on 7 distinct days within
their first 14 days (proxy for the "7-day streak" V1 success criterion #2). Target tracks the
overall D7 goal of 25%.

## Sacred Rules in play

- **SR-4 — boundary (CRITICAL, read carefully).** Check-in **mood score + prompt responses are
  user-consented persisted data, NOT SR-4-protected raw symptom data.** They MAY sync to the
  user's own account (ARCHITECTURE.md §3 `check_ins` table; auth.md §4 migration; RLS = user
  reads only their own rows). The SR-4 line this feature MUST honor: mood/check-in identifiers
  (`moodSelection`, `checkInData`) **must never appear at telemetry call sites** (Sentry /
  analytics / PostHog / Amplitude) — this is what the SR-4 hook actually enforces. Raw
  Symptom-Navigator selections remain device-only per SR-4 (that is a *different* feature).
  ⚠️ **Conflict to reconcile:** constitution SR-4 *prose* currently reads "...mood selections
  never leave the user's device. No ... Supabase write" — over-broad versus the architecture
  and versus the hook (which scans telemetry only, not Supabase writes). See Open questions #1.
- **SR-3 — no diagnostic language.** Every user-facing string — emoji-anchor labels, contextual
  prompts, **pattern insights** ("you tend to feel low on Mondays"), push copy, streak/grace
  messaging — uses educational/invitational framing, person-first (30-term filter). Insights
  must describe patterns, never assert clinical status. Dr. Dobson clinical review required on
  all copy. Note: the SR-3 hook is a deterministic seed-scan only (paraphrase layer OFF, per
  constitution + docs/SR-3-paraphrase-coverage-DEFERRED.md), so human clinical review is
  load-bearing, not belt-and-suspenders.
- **SR-1 / SR-2 — not directly engaged** (no Navigator scoring, no crisis-symptom detection in
  this feature). Adjacency flagged: whether an extreme-low mood should surface crisis resources
  is an open clinical question (below) — if yes, it must *add* a path, never gate/bypass crisis.

## Sensorial commitment (mobile)

- **Haptic:** `haptic.confirm` on successful save (the **signature moment** for this surface —
  one of V1's three signature sensorial moments per DESIGN.mobile.md §4 / Phase 4.B). Streak
  milestone tick (e.g., day 7) → `haptic.celebrate`. **Reduce-Haptics fallback:** honored
  automatically by expo-haptics (System Haptics + Low Power Mode) plus the in-app accessibility
  toggle; no haptics in error / queue-retry states (declared no-haptic zone).
- **Audio:** none in V1 (`audio.*` ships empty — content audio only, no UI SFX). **Reduce-Audio:** n/a.
- **Motion:** sparkline draw-in + streak counter tick use `motion.base` (300ms) / `motion.out`.
  **Reduce-Motion fallback:** non-essential motion disabled; essential transitions cross-fade
  200ms (two-tier handling per tokens).
- **Signature moment:** the save confirmation (`haptic.confirm` + a settled sparkline draw) —
  one per surface, max.

## Open questions

1. **SR-4 prose reconciliation (blocks /spec-implement of the sync, not this brief).** The
   constitution SR-4 prose forbids "Supabase write" of "mood selections," but architecture +
   auth + the actual hook permit syncing the user's own consented check-ins. Resolve via an ADR
   with Dr. Dobson clinical sign-off + security review (SR-4 amendment friction per constitution
   §amendment) *before* any code writes `check_ins` to Supabase. — *resolver:* Ryan + Dr. Dobson.
   — see docs/adr/001-sr4-checkin-persistence.md (Proposed).
2. **Cross-repo migration coordination.** The `check_ins` migration is authored in **psychage-v2's
   `supabase/migrations/`** (web repo owns schema historically, ARCHITECTURE.md §9) but the table
   is **runtime-written by mobile**. Who authors/applies it, and how is it sequenced against the
   mobile release? — *resolver:* Ryan (cross-repo owner).
3. **Pattern-insight copy + detection (premium).** Exact phrasing of insights and whether
   detection is local pure-TS or server-side is undecided (streak is local; insights are not).
   Clinical-framing review by Dr. Dobson + compute-location decision. — defer to requirements/design.
4. **Low-mood → crisis adjacency.** Should an extreme-low mood score surface crisis resources
   inline? Clinical decision; must add a path, never bypass crisis (SR-2). — *resolver:* Dr. Dobson.
5. **Content sets needing i18n + clinical review:** the emoji-anchor scale (1–10 labels) and the
   rotating contextual-prompt list, in all 5 languages. — defer to requirements.

## Next step

Run `/spec-requirements daily-check-in` to expand the brief into user stories and acceptance
criteria.
