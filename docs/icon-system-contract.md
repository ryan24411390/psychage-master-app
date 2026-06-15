# Custom-Icon Contract — Psychage Mobile (Slice 3a)

Companion to [docs/icon-system-audit.md](./icon-system-audit.md). The audit decided:
keep `lucide-react-native` for common-UI + decorative glyphs; build **custom SVG only
for the 13 clinical/emotional concepts**. This file is the shared contract those custom
icons follow. It is **derived from the SVG drawables already in the app**, not invented —
so new clinical icons sit beside the existing pictograms, FillGlyph, Terrain, and
BodyScanGlyph without visual drift.

## Source conventions (what the app already does)

| Existing drawable | viewBox | Color sourcing | Props |
|---|---|---|---|
| `components/pictograms/*` (tab icons) | `0 0 34 34` | body ink via `color` prop; one teal dot via `colorForScheme(tabBarTokens…)` | `color`, `size`, `testID` |
| `components/check-in/StateRows` `FillGlyph` | NativeWind View, not SVG | `bg-mood-1..5` + `colorForScheme(resolveColorRef('color.primary.default'))` | `state` (0..4) |
| `components/terrain/Terrain` | SVG | `terrainTokens.color.moodTint[0..4]`, `fillByState` 12/32/52/74/95 | data-driven |
| `features/toolkit/components/BodyScanGlyph` | `0 0 48 120` | `colors.charcoal`, `colors.primary` per `useColorScheme()` | `progress` |

## The contract (codified in `components/icon-system/shared.ts`)

1. **Vector, fixed square viewBox.** Every concept icon is a `react-native-svg` vector on
   the canonical `ICON_VIEWBOX = '0 0 32 32'`. One coordinate space for all concepts.
2. **`IconProps`: `{ color?, size?, testID? }`.** `color` is the body ink; omit to fall back
   to the scheme's neutral ink (`useIconInk()` → `color.text.primary`). `size` defaults to
   `DEFAULT_ICON_SIZE` (28dp). Production callers pass the surrounding text's color.
3. **Same glyph in light and dark.** The OS color scheme swaps *colors only* (via
   `useColorScheme()` + `colorForScheme`/`resolveColorRef`), never the shape. No
   light-only or dark-only variants.
4. **Theme through tokens, never literals.** Colors resolve from `@/lib/a1-tokens`
   (`resolveColorRef`, `colorForScheme`, `terrainTokens`). Mood color + level reuse
   `terrainTokens.color.moodTint` and `terrainTokens.fillByState` so a mood icon can never
   drift from the terrain it shares meaning with.
5. **No emoji.** Ever — emoji codepoints are banned app-wide. A *drawn* geometric face
   (SVG paths) is not an emoji and is allowed if it tests well clinically.
6. **Paired with a visible text label by default.** Icon-alone is the validated exception
   (audit §6). The glyph itself is decorative to a screen reader; the adjacent label carries
   the meaning.
7. **Clinical/emotional concepts are DRAFT until Dr. Lena Dobson signs off (VERIFY).**
   Draft icons live under `components/icon-system/`, render only on the dev review screen
   (`app/dev-icons.tsx`), and wire into production surfaces only post-sign-off.

## First proof — mood 5-point scale (this slice)

Two draft directions were proposed, both implementing the contract:

- **A — `MoodGlyphGradient`** (`abstract level`): a circle whose internal fill rises with
  mood, tinted by `moodTint` at `fillByState` levels. Reuses the terrain vocabulary; no face.
- **B — `MoodGlyphFace`** (`minimal face`): an ink-only circle with dot eyes and one mouth
  whose curvature maps Very low (∩) → Okay (—) → Very good (∪). Drawn, not emoji; mono-legible.

Both were reviewed at 44dp and 24dp, light and dark, on `app/dev-icons.tsx`.
**Decision (CHOSEN):** Dr. Lena Dobson reviewed both and selected **B — `MoodGlyphFace`**, no
changes requested. This cleared the VERIFY gate for the mood-level concept. **Direction A
(`MoodGlyphGradient`) was removed.** B is now **wired** into the live check-in surfaces — it
replaced the placeholder fill-bar glyph in `components/check-in/StateRows.tsx` and its
read-only mirror in `components/history/EntryDetailSheet.tsx`. The Terrain history dots keep
their existing color encoding (a face does not read at dot size — intentional).
