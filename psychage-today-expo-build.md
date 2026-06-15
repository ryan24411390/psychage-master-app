# Psychage — Today screen · Expo build

A hand-off spec **and** the actual screen code. Target stack: **Expo SDK 54, React Native 0.81, NativeWind v4, expo-router v6, TypeScript.** Paste this whole doc into Claude Code (or build by hand) against an existing Expo Router project.

It is wired to a **real local-first data layer** (Zustand + AsyncStorage), not dummy arrays. The home reads from the store: check-ins you actually save, reading progress you actually accrue, and per-tool last-used timestamps. Two behavior changes are built in:

1. **Adaptive primary action** — the hero is "Check in" until you check in today; after that it flips to a re-engagement nudge for the tool you've left dormant longest (Clarity Score, Symptom Navigator…). This is the "change check-in with Clarity Score or any tool not used in a long time" ask.
2. **A useful chart** — the 7-dot strip becomes a 14-day mood trend with a derived one-line insight and a consistency count. Useful, still never-graded.

No mockup controls, no extra tabs — a single **Today** tab, dark mode following the OS (which replaces the old Night-register toggle).

---

## 1. Install

```bash
npx expo install react-native-svg @react-native-async-storage/async-storage
npm i zustand nativewind tailwindcss react-native-reanimated react-native-safe-area-context
# expo-router v6, react-native-reanimated, safe-area-context usually already present in an Expo Router app
```

`babel.config.js`
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: ["react-native-reanimated/plugin"], // keep last
  };
};
```

`metro.config.js`
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

---

## 2. File tree

```
global.css
tailwind.config.js
lib/
  theme.ts          # single source of palette (JS side, for SVG/chart)
  store.ts          # Zustand + AsyncStorage — the real data layer
  tools.ts          # tool registry + dormant-tool selector
  insights.ts       # mood trend + derived insight sentence
  content.ts        # editorial content source (Most read) — stand-in for CMS/API
app/
  _layout.tsx       # root Stack, imports global.css
  (tabs)/
    _layout.tsx     # ONE tab: Today
    index.tsx       # the Today screen
  check-in.tsx      # modal
  crisis.tsx        # modal (Help now)
  history.tsx
  read/[id].tsx
  tool/[id].tsx     # launches a tool AND records its use
components/
  Greeting.tsx
  RecordChart.tsx   # the useful chart
  PrimaryAction.tsx # check-in OR dormant-tool nudge (the adaptive hero)
  PickUpRail.tsx
  ToolsBento.tsx
  MostRead.tsx
  Card.tsx Section.tsx HelpPill.tsx   # small shared primitives
```

---

## 3. Design tokens

`global.css` — light is `:root`, dark is `.dark` (NativeWind toggles `.dark` from the OS color scheme).
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --paper: #F7F3EC; --raised: #FBF8F2;
  --ink: #2E2C28; --ink-2: #6B6760; --ink-3: #8A857C;
  --teal: #1A9B8C; --teal-deep: #0E6E62; --crisis: #A8412C;
  --clay: #E7DFCE; --clay-2: #D8CFBB; --clay-ink: #3A3833;
  --line: rgba(46,44,40,0.10);
}
.dark {
  --paper: #18172A; --raised: #232238;
  --ink: #F1ECE2; --ink-2: rgba(241,236,226,0.72); --ink-3: rgba(241,236,226,0.52);
  --teal: #3FC9B5; --teal-deep: #3FC9B5; --crisis: #C97A60;
  --clay: #33304E; --clay-2: #403C60; --clay-ink: #F1ECE2;
  --line: rgba(241,236,226,0.12);
}
```

`tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        raised: "var(--raised)",
        ink: { DEFAULT: "var(--ink)", 2: "var(--ink-2)", 3: "var(--ink-3)" },
        teal: { DEFAULT: "var(--teal)", deep: "var(--teal-deep)" },
        crisis: "var(--crisis)",
        clay: { DEFAULT: "var(--clay)", 2: "var(--clay-2)", ink: "var(--clay-ink)" },
        line: "var(--line)",
      },
      fontFamily: { serif: ["Fraunces"], sans: ["IBMPlexSans"] },
      borderRadius: { r1: "8px", r2: "12px", r3: "16px", r4: "24px", r5: "32px" },
    },
  },
};
```
> Load Fraunces + IBM Plex Sans with `expo-font`/`@expo-google-fonts` in `app/_layout.tsx`. Until loaded, system serif/sans are fine.

`lib/theme.ts` — RN SVG can't read CSS vars, so the chart pulls colors from here. Keep these in sync with `global.css` (single source of truth for the JS side).
```ts
import { useColorScheme } from "nativewind";

const light = {
  ink: "#2E2C28", ink2: "#6B6760", ink3: "#8A857C",
  teal: "#1A9B8C", line: "rgba(46,44,40,0.18)", clay2: "#D8CFBB",
  mood: ["#5B6B7A", "#7C8B97", "#9C9588", "#5FAE9E", "#1A9B8C"], // vlow..vgood
};
const dark = {
  ink: "#F1ECE2", ink2: "rgba(241,236,226,0.72)", ink3: "rgba(241,236,226,0.52)",
  teal: "#3FC9B5", line: "rgba(241,236,226,0.20)", clay2: "#403C60",
  mood: ["#6E7E8E", "#8C9AA6", "#A9A293", "#5FAE9E", "#3FC9B5"],
};
export function usePalette() {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? dark : light;
}
export const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Very good"];
```

---

## 4. Data layer — `lib/store.ts`

The real source of truth. Local-first and persisted, matching the "stays on your phone" promise. Nothing on this screen reads a hardcoded array — it all derives from here.

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ToolId = "toolkit" | "navigator" | "mindmate" | "clarity" | "breathing";

export interface CheckIn { mood: 0 | 1 | 2 | 3 | 4; note?: string; at: number }
export interface ReadState { progress: number; lastAt: number } // progress 0..1

interface State {
  name: string;
  installedAt: number;
  checkins: Record<string, CheckIn>;        // key = YYYY-MM-DD
  reads: Record<string, ReadState>;          // key = article id
  toolUsage: Partial<Record<ToolId, number>>; // last-used epoch ms
  // actions
  saveCheckin: (mood: CheckIn["mood"], note?: string) => void;
  setReadProgress: (id: string, progress: number) => void;
  recordToolUse: (id: ToolId) => void;
  setName: (n: string) => void;
}

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export const useStore = create<State>()(
  persist(
    (set) => ({
      name: "there",
      installedAt: Date.now(),
      checkins: {},
      reads: {},
      toolUsage: {},
      saveCheckin: (mood, note) =>
        set((s) => ({ checkins: { ...s.checkins, [dayKey()]: { mood, note, at: Date.now() } } })),
      setReadProgress: (id, progress) =>
        set((s) => ({ reads: { ...s.reads, [id]: { progress, lastAt: Date.now() } } })),
      recordToolUse: (id) =>
        set((s) => ({ toolUsage: { ...s.toolUsage, [id]: Date.now() } })),
      setName: (n) => set({ name: n }),
    }),
    { name: "psychage-v1", storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ---- derived selectors (pure; call with useStore(sel) or useStore.getState()) ----
export const checkedInToday = (s: State) => Boolean(s.checkins[dayKey()]);

export interface DayPoint { date: string; mood: number | null; weekend: boolean }
export const last14 = (s: State): DayPoint[] => {
  const out: DayPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({ date: k, mood: s.checkins[k]?.mood ?? null, weekend: [0, 6].includes(d.getDay()) });
  }
  return out;
};

// reads with partial progress → "Pick up where you left off", newest first
export const inProgressReads = (s: State) =>
  Object.entries(s.reads)
    .filter(([, r]) => r.progress > 0.02 && r.progress < 0.98)
    .sort((a, b) => b[1].lastAt - a[1].lastAt)
    .map(([id, r]) => ({ id, ...r }));
```

---

## 5. Tools registry + dormant logic — `lib/tools.ts`

```ts
import type { State, ToolId } from "./store";

export interface Tool {
  id: ToolId; name: string; title: string; route: string;
  reEngage?: boolean;        // eligible to be surfaced when dormant
  thresholdDays?: number;    // how long counts as "a long time"
}

export const TOOLS: Record<ToolId, Tool> = {
  toolkit:   { id: "toolkit",   name: "Toolkit",           title: "Steady yourself right now", route: "/tool/toolkit" },
  navigator: { id: "navigator", name: "Symptom Navigator", title: "Make sense of what you feel", route: "/tool/navigator", reEngage: true, thresholdDays: 21 },
  mindmate:  { id: "mindmate",  name: "MindMate",          title: "Talk it through", route: "/tool/mindmate" },
  clarity:   { id: "clarity",   name: "Clarity Score",     title: "Understand how you're doing", route: "/tool/clarity", reEngage: true, thresholdDays: 14 },
  breathing: { id: "breathing", name: "Breathing",         title: "One minute to settle", route: "/tool/breathing" },
};

const DAY = 86_400_000;

/** The single most-dormant re-engageable tool, or null if everything's recent. */
export function dormantTool(s: State): { tool: Tool; sinceDays: number } | null {
  const now = Date.now();
  const candidates = Object.values(TOOLS).filter((t) => t.reEngage);
  let best: { tool: Tool; sinceDays: number } | null = null;
  for (const t of candidates) {
    const last = s.toolUsage[t.id];
    // never used: count from install; used: count from last use
    const since = Math.floor((now - (last ?? s.installedAt)) / DAY);
    if (since >= (t.thresholdDays ?? 14) && (!best || since > best.sinceDays)) {
      best = { tool: t, sinceDays: since };
    }
  }
  return best;
}

export function sinceLabel(days: number): string {
  if (days >= 30) return `It's been ${Math.floor(days / 7)} weeks`;
  if (days >= 14) return `It's been ${Math.floor(days / 7)} weeks`;
  if (days >= 7) return `It's been a week`;
  return `It's been ${days} days`;
}
```

---

## 6. Insights — `lib/insights.ts`

Turns real check-in history into one calm sentence + a consistency count. A sentence beats a dashboard, and it never grades.

```ts
import { DayPoint, last14, State } from "./store";
import { MOOD_LABELS } from "./theme";

export interface Insight { headline: string; consistency: string }

export function moodInsight(s: State): Insight {
  const days = last14(s);
  const logged = days.filter((d) => d.mood !== null) as Required<DayPoint>[];
  const consistency = `${logged.length} check-ins · 14 days`;

  if (logged.length < 3) return { headline: "Your record is just beginning.", consistency };

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const thisWeek = days.slice(7).filter((d) => d.mood !== null).map((d) => d.mood!) as number[];
  const lastWeek = days.slice(0, 7).filter((d) => d.mood !== null).map((d) => d.mood!) as number[];
  const wknd = logged.filter((d) => d.weekend).map((d) => d.mood!);
  const week = logged.filter((d) => !d.weekend).map((d) => d.mood!);

  // pick the most salient, gently
  if (thisWeek.length >= 2 && lastWeek.length >= 2) {
    const delta = avg(thisWeek) - avg(lastWeek);
    if (delta >= 0.6) return { headline: "Steadier this week than last.", consistency };
    if (delta <= -0.6) return { headline: "A little lower this week. That's allowed.", consistency };
  }
  if (wknd.length >= 2 && week.length >= 2 && avg(wknd) - avg(week) >= 0.7)
    return { headline: "You tend to feel calmer on weekends.", consistency };

  const counts = [0, 0, 0, 0, 0];
  logged.forEach((d) => counts[d.mood!]++);
  const dom = counts.indexOf(Math.max(...counts));
  return { headline: `Mostly ${MOOD_LABELS[dom].toLowerCase()} these two weeks.`, consistency };
}
```

---

## 7. Editorial content — `lib/content.ts`

"Most read" is community/editorial, not user data. Model it as a content source (swap the array for a CMS/API fetch later — the screen doesn't care).

```ts
export interface Article { id: string; title: string; topic: string; minutes: number }

// TODO: replace with fetch('/content/most-read') — shape stays identical.
export async function fetchMostRead(): Promise<Article[]> {
  return [
    { id: "gender-identity-development", title: "Gender Identity Development", topic: "Men's mental health", minutes: 5 },
    { id: "anxiety-toolkit",             title: "Building Your Anxiety Management Toolkit", topic: "Anxiety & stress", minutes: 5 },
    { id: "alexithymia",                 title: "Alexithymia: When You Can't Name a Feeling", topic: "Emotional regulation", minutes: 8 },
    { id: "animal-assisted-dementia",    title: "Animal-Assisted Therapy and Dementia", topic: "Aging & late-life", minutes: 6 },
  ];
}

export const ARTICLE_TITLES: Record<string, string> = {
  "anxiety-toolkit": "Building Your Anxiety Management Toolkit",
  "meaning-hard-year": "Meaning after a hard year",
  "alexithymia": "When you can't name a feeling",
};
```

---

## 8. Routing

`app/_layout.tsx`
```tsx
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="check-in" options={{ presentation: "modal" }} />
        <Stack.Screen name="crisis" options={{ presentation: "modal" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
```

`app/(tabs)/_layout.tsx` — one tab only.
```tsx
import { Tabs } from "expo-router";
import { Text, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "transparent", borderTopColor: "rgba(46,44,40,0.10)" },
        tabBarActiveTintColor: "#0E6E62",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: ({ color }) => <Dot color={color} /> }}
      />
    </Tabs>
  );
}
const Dot = ({ color }: { color: string }) => (
  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2.4, borderColor: color, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#1A9B8C" }} />
  </View>
);
```

---

## 9. The Today screen — `app/(tabs)/index.tsx`

```tsx
import { ScrollView, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { Greeting } from "../../components/Greeting";
import { RecordChart } from "../../components/RecordChart";
import { PrimaryAction } from "../../components/PrimaryAction";
import { PickUpRail } from "../../components/PickUpRail";
import { ToolsBento } from "../../components/ToolsBento";
import { MostRead } from "../../components/MostRead";
import { HelpPill } from "../../components/HelpPill";

export default function Today() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const name = useStore((s) => s.name);

  return (
    <View className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: insets.top + 6 }}>
        <Text className="font-serif text-[20px]">
          <Text className="text-teal">Psy</Text>
          <Text className="text-ink">chage</Text>
        </Text>
        <HelpPill onPress={() => router.push("/crisis")} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Greeting name={name} />
        <RecordChart onPressHistory={() => router.push("/history")} />
        <PrimaryAction />
        <PickUpRail />
        <ToolsBento />
        <MostRead />
        <Text className="text-center text-ink-3 text-[12.5px] my-5">Free for everyone · 5 languages · No ads</Text>
      </ScrollView>
    </View>
  );
}
```

`components/Greeting.tsx`
```tsx
import { View, Text } from "react-native";
import { useStore, checkedInToday } from "../lib/store";

export function Greeting({ name }: { name: string }) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  const done = useStore(checkedInToday);
  return (
    <View className="pt-5">
      <Text className="font-serif text-[30px] leading-tight text-ink">{`Good ${part}, ${name}`}</Text>
      <Text className="font-serif italic text-[17px] text-ink-2 mt-2">
        {done ? "Checked in today. The rest is yours." : "This is your space. It starts whenever you're ready."}
      </Text>
    </View>
  );
}
```

---

## 10. The useful chart — `components/RecordChart.tsx`

14-day mood trend (soft area + line + mood-tinted dots, missing days as faint baseline dots), a derived insight headline, and a consistency count. Tap → History.

```tsx
import { View, Text, Pressable } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { useStore, last14 } from "../lib/store";
import { moodInsight } from "../lib/insights";
import { usePalette } from "../lib/theme";

const W = 318, H = 70, TOP = 8, BOT = 54;
const x = (i: number) => (i + 0.5) / 14 * W;
const y = (m: number) => BOT - (m / 4) * (BOT - TOP);

export function RecordChart({ onPressHistory }: { onPressHistory: () => void }) {
  const days = useStore(last14);
  const insight = useStore(moodInsight);
  const p = usePalette();

  // build a smooth-ish polyline across logged days only; gaps break the line
  const segs: string[] = [];
  let cur: string[] = [];
  days.forEach((d, i) => {
    if (d.mood !== null) cur.push(`${x(i).toFixed(1)},${y(d.mood).toFixed(1)}`);
    else { if (cur.length > 1) segs.push(cur.join(" ")); cur = []; }
  });
  if (cur.length > 1) segs.push(cur.join(" "));

  return (
    <Pressable onPress={onPressHistory} className="mt-5 rounded-r3 bg-raised p-4" accessibilityRole="button" accessibilityLabel="Your last 14 days. Opens history.">
      <View className="flex-row items-center justify-between">
        <Text className="text-ink-2 text-[14px]">Your last 14 days</Text>
        <Text className="text-teal-deep font-semibold text-[13px]">History ›</Text>
      </View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10 }}>
        <Line x1={6} y1={BOT + 2} x2={W - 6} y2={BOT + 2} stroke={p.line} strokeWidth={1} />
        {segs.map((pts, k) => (
          <Path key={k} d={`M${pts}`} fill="none" stroke={p.ink3} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {days.map((d, i) =>
          d.mood === null ? (
            <Circle key={i} cx={x(i)} cy={BOT + 2} r={2.2} fill="none" stroke={p.ink3} strokeWidth={1} />
          ) : (
            <Circle key={i} cx={x(i)} cy={y(d.mood)} r={5} fill={p.mood[d.mood]} stroke={p.teal} strokeWidth={0} />
          )
        )}
      </Svg>

      <Text className="font-serif text-[17px] text-ink mt-2">{insight.headline}</Text>
      <Text className="text-ink-3 text-[12.5px] mt-1">{insight.consistency}</Text>
    </Pressable>
  );
}
```

---

## 11. Adaptive primary action — `components/PrimaryAction.tsx`

Check-in until done today; then it flips to a nudge for the longest-dormant re-engageable tool (Clarity Score / Symptom Navigator). If nothing's dormant, it shows a calm confirmation. This is the requested change.

```tsx
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useStore, checkedInToday } from "../lib/store";
import { dormantTool, sinceLabel } from "../lib/tools";

export function PrimaryAction() {
  const router = useRouter();
  const done = useStore(checkedInToday);
  const dormant = useStore(dormantTool);

  if (!done) {
    return (
      <Pressable onPress={() => router.push("/check-in")} className="mt-4 min-h-[56px] rounded-full bg-teal-deep items-center justify-center active:opacity-90">
        <Text className="text-white font-semibold text-[17px]">Check in — 30 seconds</Text>
      </Pressable>
    );
  }

  if (dormant) {
    const { tool, sinceDays } = dormant;
    return (
      <Pressable onPress={() => router.push(tool.route as any)} className="mt-4 rounded-r3 bg-raised border border-line p-4 active:opacity-90">
        <Text className="text-teal-deep font-semibold text-[12.5px]">{tool.name}</Text>
        <Text className="font-serif text-[19px] text-ink mt-1">{tool.title}</Text>
        <Text className="text-ink-3 text-[12.5px] mt-1.5">{sinceLabel(sinceDays)} since your last one.</Text>
      </Pressable>
    );
  }

  return (
    <View className="mt-4 min-h-[56px] rounded-full border border-line items-center justify-center">
      <Text className="text-teal-deep font-semibold text-[16px]">Checked in today ✓</Text>
    </View>
  );
}
```

`app/tool/[id].tsx` — records real use so the dormant logic is driven by actual behavior, not a guess.
```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { useStore } from "../../lib/store";
import { TOOLS, ToolId } from "../../lib/tools";

export default function ToolLauncher() {
  const { id } = useLocalSearchParams<{ id: ToolId }>();
  const record = useStore((s) => s.recordToolUse);
  useEffect(() => { if (id && TOOLS[id]) record(id); }, [id]);
  // ... render the actual tool UI for TOOLS[id]
  return null;
}
```

---

## 12. Pick up where you left off — `components/PickUpRail.tsx`

Driven by real reading progress (`inProgressReads`). Hidden when there's nothing in progress. Covers carry atmosphere (the one tonal place in a flat system).

```tsx
import { ScrollView, View, Text, Pressable } from "react-native";
import Svg, { Ellipse } from "react-native-svg";
import { useRouter } from "expo-router";
import { useStore, inProgressReads } from "../lib/store";
import { ARTICLE_TITLES } from "../lib/content";

const MOODS = ["#173E37", "#242D49", "#43282F"]; // deep cover grounds (teal/indigo/clay)

export function PickUpRail() {
  const router = useRouter();
  const items = useStore(inProgressReads);
  if (items.length === 0) return null;

  return (
    <View className="mt-7">
      <Text className="text-ink-2 text-[12px] font-semibold tracking-widest uppercase mb-3">Pick up where you left off</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToAlignment="start" decelerationRate="fast" className="-mx-5 px-5">
        {items.map((it, i) => (
          <Pressable key={it.id} onPress={() => router.push(`/read/${it.id}`)} className="w-72 mr-3 active:opacity-90">
            <View className="rounded-r3 overflow-hidden aspect-[16/10] p-4 justify-between" style={{ backgroundColor: MOODS[i % MOODS.length] }}>
              <Svg style={{ position: "absolute", right: -10, bottom: -24, width: 150, height: 160 }} viewBox="0 0 120 140">
                <Ellipse cx={64} cy={82} rx={44} ry={54} fill="#fff" opacity={0.9} />
              </Svg>
              <Text className="text-white/80 text-[12px] font-semibold">Psychage</Text>
              <Text className="font-serif text-[21px] text-white max-w-[78%]">{ARTICLE_TITLES[it.id] ?? it.id}</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <View className="flex-1 h-[3px] rounded-full bg-line overflow-hidden">
                <View className="h-full rounded-full bg-teal" style={{ width: `${Math.round(it.progress * 100)}%` }} />
              </View>
              <Text className="ml-2.5 text-ink-2 text-[13px]">{Math.round(it.progress * 100)}% · {Math.max(1, Math.round((1 - it.progress) * 8))} min left</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
```

`components/MostRead.tsx` — from the content source; loads async.
```tsx
import { View, Text, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Article, fetchMostRead } from "../lib/content";

export function MostRead() {
  const router = useRouter();
  const [items, setItems] = useState<Article[]>([]);
  useEffect(() => { fetchMostRead().then(setItems); }, []);
  if (!items.length) return null;
  return (
    <View className="mt-7">
      <Text className="text-ink-2 text-[12px] font-semibold tracking-widest uppercase mb-3">Most read this month</Text>
      {items.map((a, i) => (
        <Pressable key={a.id} onPress={() => router.push(`/read/${a.id}`)} className={`flex-row items-center gap-4 py-3.5 ${i ? "border-t border-line" : ""} active:opacity-80`}>
          <Text className="font-serif text-[32px] text-clay-2 w-12">{String(i + 1).padStart(2, "0")}</Text>
          <View className="flex-1">
            <Text className="font-serif text-[18px] text-ink">{a.title}</Text>
            <Text className="text-ink-2 text-[13px] mt-1">{a.topic} · {a.minutes} min</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
```
`components/ToolsBento.tsx` and `components/HelpPill.tsx` follow the same className grammar (`bg-raised border border-line rounded-r4`, `font-serif` titles, `text-teal-deep` eyebrows). Tool tiles route to `/tool/[id]` so use is recorded. `HelpPill` is a `crisis`-bordered pill that pushes `/crisis`.

---

## 13. Acceptance criteria

- [ ] Single **Today** tab; no mockup controls anywhere; dark mode follows the OS.
- [ ] Every home value derives from `useStore` — saving a check-in updates the chart and the greeting **without** any hardcoded week array.
- [ ] `RecordChart` renders 14 real days, breaks the line over gap days, and shows a derived insight + consistency count.
- [ ] `PrimaryAction` shows **Check in** before today's entry; after saving, it flips to the **most-dormant re-engageable tool** (Clarity Score at 14d, Symptom Navigator at 21d); a calm "Checked in today ✓" only when nothing is dormant.
- [ ] Opening any tool via `/tool/[id]` writes `toolUsage`, so the dormant nudge reflects real behavior.
- [ ] `PickUpRail` is driven by real `reads` progress and hides when empty.
- [ ] State persists across app restarts (AsyncStorage).
- [ ] Reduced motion: gate any entrance animation behind `AccessibilityInfo.isReduceMotionEnabled()`.

## 14. What is deliberately NOT dummy

`checkins`, `reads`, `toolUsage`, `name` are persisted user data. `content.ts` is the **only** stand-in, and it's shaped as an async fetch so swapping in your CMS/API is a one-function change. The chart, the insight, the dormant nudge, and the resume rail are all computed from real state — seed it empty and the screen self-assembles as the user uses the app.
