# Psychage Mobile UI Parity Remediation — Master Prompt

You are remediating the **Psychage mobile app UI** (`apps/mobile/`). The current mobile UI is bare,
inconsistent, and placeholder-tier. Your job: bring every screen up to the visual quality and completeness of
the **web app** (psychage-v2), one screen at a time, one section at a time — audit, compare to web, fix, verify.

## How to invoke
Paste this whole prompt, then on the final line write your target:

```
TARGET: <all | section | screen-path>
```

- `section` ∈ `primitives | tabs | content | tools | providers | checkin | therapist | crisis | settings | auth | premium`
- `all` runs every section in the priority order below — one worktree + one atomic commit per section.
- `screen-path` = a single file, e.g. `apps/mobile/app/(tabs)/learn.tsx`.

## Read first (do NOT skip — fail loud if missing)
1. `CLAUDE.md` (workspace) — Sacred Rules.
2. `DESIGN.mobile.md` + `tokens/mobile.tokens.json` — **mobile is the source of truth for token VALUES.**
3. `DESIGN.web.md` + `tokens/web.tokens.json` — **web is the reference for visual richness / anatomy.**
4. `apps/mobile/lib/use-theme-colors.ts`, `apps/mobile/lib/a1-tokens.ts` — how mobile consumes colors.
5. `apps/mobile/tailwind.config.js` — NativeWind utility wiring.
6. Web reference source lives at `~/dev/psychage-v2/src/` (separate repo; read-only reference).

## The rule: LITERAL WEB PARITY (with 3 locked carve-outs)
Make each mobile screen look and behave like its web counterpart as closely as React Native allows:
**colors, type scale (size/weight/leading/tracking), spacing density (8pt grid), radius, shadows/elevation,
component anatomy (every variant, size, and state), layout, and empty/loading/error states.** Where mobile
has a bare version of something web does richly, rebuild it to the web spec. Map web Tailwind classes →
mobile tokens; never hardcode a hex.

Do NOT "fix toward web" on these three — they are deliberate and locked:
1. **Fonts.** Keep **IBM Plex Sans** (body) + **Fraunces** (display). Web's Satoshi EULA does not cover
   app-binary embedding (DESIGN.mobile.md DD-001) → using it is a license violation + App Store risk. Match
   web's font sizes/weights/line-heights/letter-spacing exactly; only the family differs.
   *(If the project obtains a Satoshi app license, delete this carve-out.)*
2. **Platform-native structure.** Keep the bottom tab bar (Today/Learn/Compass/Find), safe-area insets,
   native sheets/gestures. Never port web's top navbar or footer. Parity = visual language, not web chrome.
3. **Additive sensorial layer.** Keep/add haptics on primary CTAs, Reanimated motion, and reduce-motion
   handling. Web has none of this — do not strip mobile's.

Token edits (e.g. adding a radius step or shadow to match web) go in `tokens/mobile.tokens.json` and, per
cross-platform color-sync convention, stay aligned with `tokens/web.tokens.json`. Dark mode stays true-black
OLED (web's `#0F0F0F` is visually equivalent — leave mobile dark as-is).

## Sacred Rules — never violate, on every screen
- **No diagnostic language** ("you have", "diagnosed", "you are") — educational/person-first framing only.
- **Navigator confidence ≤ 0.75**; never render a value above it.
- **Crisis affordance reachable ≤ 1 tap from every screen**; crisis pill is outline-only, never filled.
- **Person-first language** everywhere ("person experiencing anxiety", not "anxious person").
- **Symptom Navigator state is client-side only** — never serialized/logged/sent to analytics.
- **NativeWind classes only** — no inline `style={{...}}` except dynamic Reanimated/dimension values.
- **`@/` alias**, no `../../../` chains.
- **Articles use the 13 PEAF blocks only** — never invent a block type.
- **Versioned migrator** for any new persisted (MMKV/secure-store) shape.

## Per-screen algorithm
For each screen in the target, in order:

1. **Audit.** Read the screen + the components it renders. Run `/mobile-design-audit "<glob for this screen>"`.
   Record flaws: bare/empty layout, hardcoded hex or inline color styles, missing variants, missing
   empty/loading/error states, weak type hierarchy, off-8pt-grid spacing, low contrast, anti-slop hits.
2. **Find the web reference** (map below). Open the web equivalent under `~/dev/psychage-v2/src/`. Study its
   component anatomy, class strings, layout density, color usage, and all states.
3. **If web HAS an equivalent → port it.** Translate web Tailwind → mobile tokens/NativeWind. Recreate every
   variant/size/state. Apply the font carve-out. Match spacing, radius, shadow, and states 1:1.
4. **If web has NO equivalent** (mobile-native screen — list below) **→ use Mobbin MCP.**
   - Call `mcp__claude_ai_Mobbin__search_screens` and/or `mcp__claude_ai_Mobbin__search_flows` with the
     screen's purpose (e.g. "mood check-in", "mental health journal timeline", "medication reminder tracker",
     "subscription paywall", "crisis hotline list", "country region picker", "OTP verification").
   - Pick 1–2 best-in-class references from reputable wellness/health apps. **Borrow layout + interaction
     patterns only** — adapt fully to Psychage tokens and brand (teal `#1A9B8C` sparingly, warm-cream light
     bg, calm, person-first). Never copy a competitor's branding/colors/copy.
5. **Fix.** Implement with mobile tokens, web-matched scale/spacing/radius/shadow/states, NativeWind classes.
   Reuse mobile primitives (`components/ui/Button`, `Text`, `Card`). If a primitive is the bottleneck, the
   `primitives` section must be done first.
6. **Verify.** `pnpm --filter @psychage/mobile typecheck` → clean. Re-run `/mobile-design-audit "<glob>"`
   until **Overall PASS** (token compliance PASS + anti-slop CLEAN). Run targeted Vitest if a test covers the
   file. For visual confirmation, run the app from `~/dev/psychage-fresh` (`cd apps/mobile && npx expo run:ios`)
   — the iCloud `~/Documents` checkout hangs native builds.
7. Next screen.

## Per-section workflow
- **Worktree:** `git worktree add .claude/worktrees/ui-parity-<section> -b ui-parity/<section>`, then
  `pnpm install` inside it. Edit there — never in the shared main checkout (raced by parallel agents; HEAD
  switches mid-op).
- **Commit:** after every screen in the section passes its Definition of Done, make ONE atomic commit. Message
  names the section + reason + cites DESIGN.mobile.md parity. Pre-commit gates (typecheck + lint + test) must
  pass — no `--no-verify`.

## Section priority + screen → web reference map
Run sections in this order. `primitives` first — every screen consumes them.

| # | Section | Mobile target(s) | Web reference (`~/dev/psychage-v2/src/`) |
|---|---------|------------------|------------------------------------------|
| 1 | **primitives** | `components/ui/Button.tsx`, `Text.tsx`, `Card.tsx` (create if missing), `components/auth/AuthTextField.tsx`, badge | `components/ui/Button.tsx` (6 variants ×4 sizes), `Card.tsx` (4 variants, `rounded-xl p-6`), `Badge.tsx`, `PageHeader.tsx`, inputs |
| 2 | **tabs** | `app/(tabs)/index.tsx` (Today), `learn.tsx`, `compass.tsx`, `find.tsx`; `components/AppTabBar.tsx`, `GlobalHeader.tsx`, `HeaderAvatar.tsx`, `CrisisPill.tsx` | `pages/home/HomePage.tsx`, `pages/LearnPage.tsx`/`ArticleCategoryPage.tsx`, `pages/tools/ToolsLandingPage.tsx`, providers landing; `components/layout/CrisisBanner.tsx` (chrome stays native — polish only) |
| 3 | **content** | `app/article/[slug].tsx`, `conditions/[slug].tsx`, `conditions/index.tsx`, `learn/[category].tsx`, `library/index.tsx`, `library/search.tsx`; `ArticleListCard`, `ArticleReader`, `ArticleBody` | `pages/learn/ArticlePage.tsx` (13 PEAF blocks), `pages/learn/CategoryPage.tsx`, `components/.../ArticleCard.tsx` |
| 4 | **tools** | `app/tools/clarity.tsx` + `clarity-history.tsx`, `mood-journal.tsx`, `sleep.tsx`, `mindmate.tsx`, `relationship-health.tsx`*, `med-tracker.tsx`*, `app/toolkit.tsx`, `app/navigator.tsx` | `pages/tools/MindMate.tsx`, Clarity/Mood/Sleep tool components in `components/tools/`, `components/navigator/*`. *relationship-health, med-tracker have no web equiv → Mobbin |
| 5 | **providers** | `app/find/directory.tsx`, `find/provider/[id].tsx`; `components/.../ProviderCard` | `pages/providers/*`, `components/.../ProviderCard.tsx` |
| 6 | **checkin** | `components/check-in/CheckInSheet.tsx`, `StateRows.tsx`; `components/home/HomeView.tsx`/`Mascot.tsx`/terrain; `app/history.tsx`, `components/history/*`; `app/reflection.tsx`, `reflection-earlier.tsx` | **Mostly mobile-native → Mobbin** ("mood check-in", "mood journal timeline", "mood trend visualization") |
| 7 | **therapist** | `app/(therapist)/add-provider.tsx`, `preview.tsx`, `range.tsx`, `why.tsx`; `components/therapist/*` | `pages/providers/*` forms where applicable; PDF preview, date-range, share-consent flows → Mobbin |
| 8 | **crisis** | `app/crisis.tsx`, `crisis-region.tsx`; `components/CrisisPill.tsx` | `components/screens/CrisisResourcesScreen.tsx`, `components/layout/CrisisBanner.tsx`; region picker → Mobbin |
| 9 | **settings** | `app/settings/*` (index, appearance, make-it-yours, reminders, privacy, delete, delete-confirm, about, acknowledgments); `components/settings/*` | `pages/dashboard/*` settings; native iOS settings-list patterns → Mobbin |
| 10 | **auth** | `app/(auth)/sign-up.tsx`, `sign-in.tsx`, `verify.tsx`, `migrate.tsx`, `why.tsx`; `components/auth/*`; `app/onboarding/*` | `pages/auth/LoginPage.tsx`, `SignUpPage.tsx`, `CheckEmailPage.tsx`, `pages/OnboardingPage.tsx`; OTP/migration → Mobbin |
| 11 | **premium** | `app/settings/supporter.tsx`; `components/supporter/SupporterTiers.tsx` | Portal/subscription if present; subscription paywall patterns → Mobbin |

## Mobile-native screens (web has no equivalent → use Mobbin)
Check-in sheet & state rows, home terrain/mascot, history timeline, reflection, med-tracker,
relationship-health, premium paywall, crisis region picker, OTP verify, account migration, native settings
list, date-range/PDF-share flows. For each: query Mobbin for the pattern, adapt to Psychage tokens + brand.

## Definition of Done (every screen)
- `/mobile-design-audit` → **Overall PASS** (token compliance PASS + anti-slop CLEAN, 0 hits).
- `pnpm --filter @psychage/mobile typecheck` → clean.
- Zero hardcoded hex/colors — all via `tokens`, `useThemeColors()`, or NativeWind utilities.
- Light **and** dark both correct (dark = true-black).
- Empty / loading / error states present wherever the web equivalent has them.
- Primary CTAs fire haptics; all motion respects `useReducedMotion()`.
- Visual richness matches the web reference (variants, hierarchy, spacing, radius, shadows, badges, states).
- Crisis affordance reachable ≤ 1 tap; no diagnostic language; person-first throughout.
- Reuses mobile primitives; no new article block types; `@/` alias; versioned migrator if new persisted state.

## Reporting (as you go)
For each screen, print one line:
`<screen> — flaws: <N> | ref: <web:path | mobbin:"query"> | changes: <short> | audit: PASS|WARN|FAIL`
At the end of each section, print the commit SHA + a 2-line summary of what changed.
