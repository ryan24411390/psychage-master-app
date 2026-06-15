# Implementation Roadmap

Ordered per directive: **logic → AI → feature → UX → UI**. IDs reference [action-plan.md](action-plan.md).

## Phase 1 — Logic & safety parity (small, high-value, mostly free)
1. **A1** Guard crisis-keyword copy (shared lift + snapshot test) — *safety hardening*
2. **B1** Sleep score window → web's calendar-day default-7 + 7/30/90 toggle — *only confirmed numeric divergence*
3. **B4** Navigator stale `/5` docstring fix — *trivial*
4. **A2** Document free-text-crisis-detection guardrail for future ports

Each lands as its own atomic commit on a feature branch with targeted Vitest + typecheck + lint. Phase 1 is implementable now without product/clinical input.

## Phase 2 — AI parity
AI is already at parity (same server endpoint). Only A1 (above) applies; nothing else to do unless web changes the SSE contract.

## Phase 3 — Decisions, then logic items that need a call
5. **B2** Mood valence required? — **product decision** (mobile's optional may be better; web path is buggy). Resolve before coding.
6. **B3** Port Sleep `generateWeeklyDigest` to shared — code free, final strings §7.
7. **B-web1** Hand the web Mood valence 1-5/1-10 persistence bug to the web team.

## Phase 4 — Feature parity (large, spec-driven)
8. **C1** Clarity Journal — `/spec-discovery clarity-journal` (Procedure A). Multi-slice; SR-3 free-text crisis detection + §7/SR-12 clinical+App-Store review mandatory.
9. **C2** Medication Tracker — decide native port vs keep WebView (product).
10. **C3** i18n package — large cross-cutting; blocked by open decision in CLAUDE.md.

## Phase 5 — UX / UI parity
11. **D1** Numeric reveal on Clarity/Sleep/Mood (compute free; labels §7).
12. **D2** Empty/loading/error-state sweep across the 7 shared tools.

---

### Suggested first commit set (Phase 1, ready now)
- `fix(sleep): match web 7-day default score window + range toggle [B1]`
- `chore(safety): single-source mobile crisis keywords + drift snapshot test [A1]`
- `docs: free-text crisis-detection porting guardrail [A2]`
- `chore(navigator): correct stale count-cap docstring to /3 [B4]`

Gating reminders: pre-commit typecheck+lint+test inviolable (no `--no-verify`); the 4 Sacred-Rule edit hooks fire on every edit; run **targeted** Vitest (full suite OOMs).
