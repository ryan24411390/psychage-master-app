@AGENTS.md

# apps/mobile/CLAUDE.md

Scope-specific rules for the React Native + Expo mobile app.

## Stack (locked V1)
- Expo SDK 54, React Native 0.81 (New Arch on), React 19.1.0
- Expo Router v6 (file-based routing in `app/`)
- NativeWind v4 + Tailwind 3.4.17 (no v5 preview)
- Reanimated v4 (babel plugin: `react-native-worklets/plugin`)
- lucide-react-native for icons

## Design contract
- Tokens: `tokens/mobile.tokens.json` (repo root). Token wiring into `tailwind.config.js` lives in Slice 5.
- Visual: `DESIGN.mobile.md` (repo root). 4-tab IA (Today / Learn / Compass / Find) lands in Slice 4.
- Audit: `/mobile-design-audit` skill before commit. Pass 1 is stub-aware until first-screen calibration (Slice 8).

## Shared package consumption
`@psychage/shared` consumed via workspace:* protocol. DI seam adapters (storage, featureFlags, config, analytics) wire in Slice 6 — do not invoke shared functions that require the seam (per convention #3) until then.

## Conventions
- Read root `CLAUDE.md` first.
- Cross-platform color sync (convention #1): color edits land in `tokens/web.tokens.json` + `tokens/mobile.tokens.json` together.
- DI seam (convention #3): never call shared functions without providing the adapter parameter.
