# UX / UI Mismatch Report

The dominant UX theme: **web shows numbers and verdict-style labels; mobile shows calm closed-vocabulary bands.** This is a deliberate mobile design posture (non-diagnostic, educational), partly Sacred-Rule-adjacent, partly clinical-copy gated. The user directive is to drive presentation toward web (show the numbers) where that does *not* break a Sacred Rule. Each item below is tagged accordingly.

---

## 1. Presentation: numbers vs bands (the big one)

| Tool | Web | Mobile | Tag | Action |
|---|---|---|---|---|
| Clarity Score | 0–100 composite + per-domain 0–20 numbers (`OverviewTab.tsx:50,115,316`) | TIER_COPY label + domain band words (`ClarityResultsView.tsx:71-113`, `bands.ts:27-43`) | **free** to show numbers (web is non-diagnostic too); tier *labels* are §7 | Optional: add numeric reveal; tier label vocabulary change needs Dr. Dobson |
| Clarity tier labels | Thriving/Balanced/**Concerning/Distressed/Crisis** (`scoring.ts:145-149`) | Thriving/Balanced/Mixed/Strained/"A lot to carry" (`types.ts:35`) | **§7 + SR-2** | Softened wording is intentional; matching web's "Distressed/Crisis" verbatim needs clinical sign-off |
| Sleep | 0–100 gauge + tier (Excellent/Good/Fair/Needs Attention) + per-dim % bars (`SleepScoreGauge.tsx`) | 4 bands (rested/steady/uneven/low), no number (`ScoreBand.tsx`) | **§7** (agent flagged SR-1; SR-1 is actually Navigator-specific — treat as clinical-copy gate) | Numeric reveal possible; band copy needs Dr. Dobson |
| Relationship | numeric composite + X/100 sub-scores | shows raw composite "/ 100" already (parity) | **free** | Already aligned |
| Mood Journal | avg-mood number to 1dp + 4-band label Great/Good/Okay/Low (`LightweightInsights.tsx:17,36-41,96`) | no avg number, no person-band; direction sentences only | **avg number = free; band label = §7** | Could add avg number; verdict-style band label needs Dr. Dobson |

---

## 2. User journey differences

| Journey | Web | Mobile | Note |
|---|---|---|---|
| Daily check-in | A *section inside* Clarity Journal (mood 1-10, sleep hrs, energy, sentence, tags) | A standalone 5-state sheet + 24-char note (`CheckInSheet.tsx`) | Mobile elevated check-in to a first-class daily ritual; far smaller input set than web's journal check-in |
| Reflection | Structured Weekly Reflection *form* (5 fields) | Read-only 7-day terrain + one descriptive line (`features/reflection`) | Mobile is output-only; captures no reflection input |
| Mood entry | Required valence slider → emotions → impact → note (4-step wizard) | Optional valence → tags → note; valence skippable | Fewer mandatory steps on mobile |
| Medication tracking | Native multi-tab tool | WebView of the web page (S31) | Leaves native chrome; no offline |
| Clarity Journal | 7-section CBT hub w/ therapist PDF | absent | Whole journey missing |
| Sleep score range | 7/30/90-day toggle | none (fixed) | See logic report `score-window-7d-vs-14entry` |

---

## 3. Component / UI inventory differences (intentional, platform-appropriate)

- Charts: web Recharts/SVG (adherence bar, mood sparkline, sleep gauge) ↔ mobile uses its own `components/ui/charts` (react-native-svg per repo convention). Not 1:1; expected.
- Relationship: web `ResultsDashboard/FourHorsemenCard/ClinicalInsights` ↔ mobile `ScoreRing/DomainBar/RadarChart/ResultsView`. Same data, native components.
- Color/tier styling: mobile `DOMAIN_META`/`TIER_META` strip web Tailwind class strings; colors come from mobile tokens (`types.ts:141-178`). Correct for NativeWind.
- Sleep weekly digest: web rich conditional prose ↔ mobile terse count + one comparison line (`WeeklyDigest.tsx`). See logic report.

---

## 4. Empty / loading / error states

Not exhaustively diffed in this pass (out of the scoring-focused verification scope). Recommended follow-up: a dedicated UX-state sweep across the 7 shared tools. Known: mobile Provider directory has an honest offline state (no cache); web relies on cascading fallback. Flagged in [roadmap.md](roadmap.md) as a UX-parity task.

---

## 5. What is intentional and should NOT be "fixed" toward web

- Local-only persistence for Mood/Clarity/Navigator (SR-4) — web syncs; mobile must not.
- 0.75 confidence cap presentation (SR-1) — already parity.
- Softened, non-diagnostic tier/band wording — keep unless Dr. Dobson approves web-verbatim labels.
- Separate emotion/trigger arrays in Mood Journal — mobile's model is cleaner than web's merge-and-lose-distinction; do not regress to match the web bug.
