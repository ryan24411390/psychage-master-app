# Compass Mobile ↔ Psychage V2 — Parity Audit

**Date:** 2026-06-16 · **Source of truth:** Psychage V2 web (`~/dev/psychage-v2`) · **Target:** Compass mobile (`~/dev/psychage-fresh/apps/mobile` + `packages/shared`)

**Method:** Two passes. (1) Three Explore agents traced both codebases for a full inventory. (2) A deep multi-agent verification workflow (20 agents) read the actual scoring/logic/AI files in **both** repos per tool and diffed constants/formulas/prompts line-by-line; every critical/high claim was re-checked by an independent adversarial verifier against `file:line` evidence. Several first-pass claims were **overturned** in verification (documented below) — findings here reflect the verified result, not the first guess.

---

## 1. Parity Score

> Scores are evidence-weighted engineering judgment, logic-first. "Parity" means *identical inputs → identical computed results*; deliberate presentation differences are scored separately.

| Dimension | Score | Basis |
|---|---:|---|
| **Logic / scoring parity** | **92%** | Clarity, Navigator, Relationship, MindMate, Crisis-detection = byte-identical. Sleep ~90% (one real window divergence). Mood ~55% (data model + insights materially differ). |
| **AI parity** | **98%** | MindMate calls the *same* `/api/ai/chat` endpoint — prompt/RAG/safety are server-shared. Only client-side drift hazard + dropped metrics. |
| **Feature coverage** | **80%** | 9/11 web tools have a native mobile build; Clarity Journal missing; Medication Tracker is WebView-only; i18n absent (web has 5 langs). |
| **UX parity** | **70%** | Deliberate "numbers → calm bands" divergence on 4 tools; missing journal/screening flows. |
| **UI parity** | **75%** | Platform-appropriate reimplementation (native components), not 1:1 — intentional. |
| **Overall** | **≈85%** | Logic/AI parity is excellent; gaps concentrate in feature coverage (Clarity Journal, native Med Tracker, i18n) and intentional presentation divergence. |

**Headline:** The hard part — the scoring/decision logic — is in very good shape. Of the 7 tools present on both platforms, **5 are byte-identical in logic** and a 6th (Sleep) differs only in its scoring *window*. The real risks are (a) one confirmed numeric divergence (Sleep window), (b) a materially divergent Mood Journal data model, and (c) two missing tools. No Sacred Rule is currently violated.

---

## 2. Feature Matrix

| Web feature | Mobile counterpart | Logic | Status | Note |
|---|---|---|---|---|
| Clarity Score | `app/tools/clarity.tsx` (`features/clarity/`) | ✅ byte-identical | **Match** | Presentation diverges: web shows 0–100 + domain numbers, mobile shows calm bands. |
| Symptom Navigator | `app/navigator.tsx` (`packages/shared/navigator/`) | ✅ byte-identical | **Match** | 0.75 cap honored both sides (mobile floors it twice). Tier-flag layer is output-neutral by default. |
| Relationship Health | `app/tools/relationship-health.tsx` | ✅ 1:1 port | **Match** | Four Horsemen / DV / isolation detection present on web AND mobile (mobile did *not* invent it). |
| Sleep Architect | `app/tools/sleep.tsx` (`packages/shared/sleep/`) | ⚠️ calc identical, window differs | **Partial** | Web scores last 7 cal-days (7/30/90 toggle); mobile scores newest 14 entries. Same data → can cross a band. |
| Mood Journal | `app/tools/mood-journal.tsx` (`packages/shared/mood-journal/`) | ⚠️ taxonomy identical, model differs | **Divergent** | Valence optional (mobile) vs required (web); separate emotion/trigger arrays (mobile) vs merged tags (web); different insights. |
| MindMate AI | `app/tools/mindmate.tsx` (`features/mindmate/`) | ✅ server-shared | **Match** | Same endpoint, SSE contract, citations. Client mirrors only the CRISIS keyword tier (defense-in-depth). |
| Clarity Journal | — | — | **Missing** | 7 sections + report engine + PHQ-2/GAD-2/PSS-4/WHO-5 weekly screening + Stanley-Brown safety plan. None on mobile. |
| Medication Tracker | `app/tools/med-tracker.tsx` (WebView S31) | web-only | **Partial (WebView)** | No native form/store/adherence math; loads remote `/m/med-tracker` in a WebView. |
| Provider Finder | `app/find/directory.tsx` | ✅ shared RPC | **Match** | `search_providers_v3`, shared DB. |
| Crisis Support | `app/crisis.tsx` (`features/crisis/`) | ✅ | **Match** | Region-aware helplines; always-on. |
| Toolkits | `app/toolkits/[id].tsx` | ✅ | **Match** | Shared Supabase `toolkits`. |
| Learn / Articles | `app/learn/*` | ✅ | **Match** | Supabase articles. |
| i18n (EN/PT/ES/SV/FR) | — | — | **Missing** | Mobile English-only; no `packages/i18n`. Also: no ES/FR crisis-keyword coverage in mobile offline pre-checks. |

---

## 3. Verification corrections (first-pass claims overturned)

These are recorded because they show where assumptions were wrong — do not re-introduce them as "known issues."

| First-pass claim | Verdict | Truth |
|---|---|---|
| Navigator count-cap divisor `/5` on mobile vs `/3` web (would lower every score) | **OVERTURNED** | Both use `/3`. Compare agent misread line 123. Only a stale docstring says `/5` — and it's stale in *both* repos. |
| Crisis keywords: web ~40 vs mobile ~21 (missed-detection risk) | **OVERTURNED** | Chat CRISIS tier 11/11 byte-identical; Sleep 18/18 identical. Mobile omits URGENT/HARMFUL client-side *by design* (server classifier authoritative). |
| Mood Journal: mobile has no valence scale | **OVERTURNED** | Mobile *does* have a 1–10 valence scale; it's optional/integer vs web's required/float. |

---

## 4. Document index

- [logic-mismatches.md](logic-mismatches.md) — every scoring/processing diff with `file:line` evidence + verdict
- [ai-mismatches.md](ai-mismatches.md) — MindMate + crisis-detection diffs
- [ux-ui-mismatches.md](ux-ui-mismatches.md) — journey, presentation, component diffs
- [action-plan.md](action-plan.md) — file-level fixes, each tagged Sacred-Rule-blocked / Dr. Dobson-gated / free
- [roadmap.md](roadmap.md) — ordered: logic → AI → feature → UX → UI

## 5. Sacred Rules status

No Sacred Rule is violated today. Mobile is in places **stricter** than web (Navigator floors the 0.75 cap at two layers; mood/symptom data is local-only per SR-4). Several parity gaps *cannot* be closed toward web without a Sacred-Rule conflict or Dr. Dobson clinical-copy review — each is tagged in [action-plan.md](action-plan.md). One forward-looking critical: if a free-text journal is ever ported to mobile, it MUST carry free-text crisis detection (SR-3) — web does, mobile's check-in note does not scan.
