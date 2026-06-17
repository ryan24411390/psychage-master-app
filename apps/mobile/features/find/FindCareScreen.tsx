// FindCareScreen — faithful port of the FindCare.tsx prototype, wired to REAL
// shared-Supabase data and the app's stores. Visual fidelity to the mock was the
// explicit goal, so this screen intentionally uses the prototype's warm palette +
// serif headers rather than the token classes — it will NOT pass mobile-design-audit
// (accepted trade-off). Behavior is real:
//   • results          → useProviderSearch (search_providers_v3 cascade)
//   • provider types   → useProviderTypes (real provider_types lookup)
//   • profile details  → getProviderById
//   • result count     → real total_count (count-up animation, reduce-motion safe)
//   • save / compare   → bookmarks (auth-gated; anon tap → sign-up)
//   • "Use my location"→ real expo-location (one-shot, never persisted)
//   • home location    → remembered across launches (useDirectoryLocation)
//   • per-state / city / type counts → real facet RPCs (directory_facets), grouped
//     on the SAME columns search_providers_v3 filters on, so a count never disagrees
//     with the list selecting it produces (honest coverage; zero-yield disabled).
// Dropped from the mock because the data does NOT back it: gender (no such column).

import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  ArrowUpDown, BadgeCheck, Bookmark, BookOpen, Building2, Check, ChevronDown, ChevronLeft,
  ChevronRight, FileText, Hash, Info, LifeBuoy, MapPin, MessageSquare, Phone, Search,
  Stethoscope, Users, X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAvatar } from '@/components/HeaderAvatar';
import { Text } from '@/components/ui/Text';
import { useBookmarkedIds, useCurrentUserId, useToggleBookmark } from '@/features/bookmarks/hooks';
import { dial } from '@/features/crisis/dialer';
import { useHaptics } from '@/lib/haptic-context';
import { useDirectoryLocation } from '@/lib/use-directory-location';
import { recordRecentlyViewed } from '@/lib/persistence/recently-viewed';
import { colors } from '@/lib/colors';

import { telUrl } from '@/features/directory/contact';
import { useCityCounts, useProviderSearch, useProviderTypes, useStateCounts, useTypeCounts } from '@/features/directory/hooks';
import { DEFAULT_RADIUS_MILES, requestAndGetCoords, type Coords } from '@/features/directory/location';
import { cleanDisplayName } from '@/features/directory/mapping';
import { getProviderById } from '@/features/directory/queries';
import { ABBR, STATES } from '@/features/directory/states';
import { getTrustBadge } from '@/features/directory/trust';
import type { ProviderCardData, ProviderSearchParams, ProviderType, ProviderWithDetails } from '@/features/directory/types';

// Clay-initial avatar palette — providers are NEVER shown by photo (NPPES has none);
// a deterministic initial circle from this fixed set is the avatar everywhere.
const AVA = ['#7E9C8E', '#B98A6A', '#8A86B0', '#A6707A', '#6F94A8', '#9B9460'];
const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVA[h % AVA.length];
};
const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const TYPE_ICON: Record<string, typeof Users> = {
  psychiatrist: Stethoscope,
  'psychiatric-nurse-practitioner': Stethoscope,
  'psychiatric-mental-health-nurse-practitioner': Stethoscope,
  psychologist: BookOpen,
  counselor: MessageSquare,
  therapist: MessageSquare,
  'counselor-therapist': MessageSquare,
  'clinical-social-worker': Users,
  'social-worker': Users,
  'marriage-family-therapist': Users,
};
const iconForType = (slug: string) => TYPE_ICON[slug] ?? Users;

function formatVerified(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/* ----------------------------- motion helpers ----------------------------- */
function useReduceMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setR(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setR);
    return () => {
      alive = false;
      (sub as { remove?: () => void })?.remove?.();
    };
  }, []);
  return r;
}
function useCountUp(target: number, reduce: boolean) {
  const [v, setV] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    const from = ref.current;
    const to = target;
    if (reduce || from === to) {
      ref.current = to;
      setV(to);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 450);
      const e = 1 - (1 - p) ** 3;
      setV(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, reduce]);
  return v;
}
function Tap({ onPress, children, className, style, accessibilityLabel, accessibilityRole }: { onPress?: () => void; children: React.ReactNode; className?: string; style?: ViewStyle; accessibilityLabel?: string; accessibilityRole?: any }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const cfg = { damping: 18, stiffness: 320, mass: 0.5 };
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole ?? 'button'} onPress={onPress} onPressIn={() => { s.value = withSpring(0.97, cfg); }} onPressOut={() => { s.value = withSpring(1, cfg); }}>
      <Animated.View className={className} style={[a, style]}>{children}</Animated.View>
    </Pressable>
  );
}
function Skeleton() {
  const o = useSharedValue(0.5);
  useEffect(() => { o.value = withRepeat(withTiming(1, { duration: 720 }), -1, true); }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={a} className="h-[92px] rounded-2xl bg-border dark:bg-border-dark mb-4" />;
}

type Step = 'location' | 'manual' | 'city' | 'type' | 'outside' | 'results' | 'profile' | 'compare';

export default function FindCareScreen() {
  const reduce = useReduceMotion();
  const dl = useDirectoryLocation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const ink = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const soft = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const faint = isDark ? colors.text.tertiary.dark : colors.text.tertiary.light;
  const teal = isDark ? colors.teal[400] : colors.teal[600];
  const tealPress = isDark ? colors.teal[500] : colors.teal[700];
  const red = isDark ? colors.crisis.dark : colors.crisis.light;

  const { fireHaptic } = useHaptics();

  // Returning users with a saved location still pass through the needs-selection
  // step (provider type) rather than being dumped straight onto the list — the
  // location fast-path is preserved (no re-entering state), but "what kind of care"
  // is asked each visit. First-time / unconfigured users start at location.
  const [step, setStep] = useState<Step>(dl.configured && dl.stateName ? 'type' : 'location');
  const [loc, setLoc] = useState<string | null>(dl.stateName);
  const [city, setCity] = useState<string | null>(dl.city);
  const [typeSel, setTypeSel] = useState<{ id: string; label: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [stateQ, setStateQ] = useState('');
  const [cityQ, setCityQ] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<'relevance' | 'name' | 'distance'>('relevance');
  const [sheet, setSheet] = useState<null | 'sort' | 'crisis'>(null);

  // bookmarks (real save + compare)
  const { data: userId } = useCurrentUserId();
  const { data: savedSet } = useBookmarkedIds('provider');
  const toggle = useToggleBookmark();
  const savedIds = useMemo(() => Array.from(savedSet ?? []), [savedSet]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const stateAbbr = loc ? ABBR[loc] : undefined;
  const params = useMemo<ProviderSearchParams>(
    () => ({
      query: debounced || undefined,
      state: stateAbbr,
      city: city && city !== 'all' ? city : undefined,
      provider_type_ids: typeSel ? [typeSel.id] : undefined,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      radius_miles: coords ? DEFAULT_RADIUS_MILES : undefined,
      sort_by: sort,
      per_page: 20,
    }),
    [debounced, stateAbbr, city, typeSel, coords, sort],
  );
  const searchEnabled = step === 'results' && (!!stateAbbr || !!coords);
  const search = useProviderSearch(params, searchEnabled);
  const headerCount = search.total;
  const countShown = useCountUp(headerCount, reduce);

  const types = useProviderTypes();

  // Honest coverage facets — counts come straight from the query layer (never
  // hardcoded). Options that would yield zero are disabled in each picker.
  const stateCounts = useStateCounts();
  const cityCounts = useCityCounts(stateAbbr);
  const typeCounts = useTypeCounts(stateAbbr, city ?? undefined);
  const stateTotal = stateAbbr ? stateCounts.data?.[stateAbbr] : undefined;

  const cityLabel = city === 'all' ? `All ${loc}` : city;
  const locLabel = loc ?? 'Near you';

  const enter = (ms = 0) => (reduce ? undefined : FadeIn.duration(280).delay(ms));

  const persist = (stateName: string | null, cityName: string | null) =>
    dl.setLocation({ stateName, stateAbbr: stateName ? (ABBR[stateName] ?? null) : null, city: cityName });

  const startType = (t: { id: string; label: string } | null) => {
    fireHaptic('tab');
    setTypeSel(t);
    if (loc) persist(loc, city);
    setStep('results');
  };

  const onUseLocation = async () => {
    const res = await requestAndGetCoords();
    if (res.status === 'granted') {
      setCoords(res.coords);
      setSort('distance');
      setStep('results');
    } else {
      setStep('manual');
    }
  };

  const isSaved = (id: string) => savedSet?.has(id) ?? false;
  const toggleSave = (id: string) => {
    if (!userId) {
      router.push('/(auth)/sign-up');
      return;
    }
    fireHaptic(isSaved(id) ? 'tab' : 'confirm');
    toggle.mutate({ ref: { resource_type: 'provider', resource_id: id }, wasSaved: isSaved(id) });
  };

  /* ----------------------------- shared chrome ----------------------------- */
  const Header = ({ back, title }: { back?: () => void; title?: string }) => (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
      {back ? (
        <Tap onPress={back}><View className="p-2.5"><ChevronLeft size={24} color={ink} /></View></Tap>
      ) : (
        <Text className="font-display text-2xl text-text-primary dark:text-text-primary-dark">Psychage</Text>
      )}
      {title ? <Text className="font-sans-bold text-base text-text-primary dark:text-text-primary-dark">{title}</Text> : null}
      <View className="flex-row items-center gap-2.5">
        <Tap onPress={() => setSheet('crisis')}>
          <View className="flex-row items-center gap-1.5 bg-surface dark:bg-surface-dark border-[1.5px] border-error dark:border-error-dark rounded-full px-3.5 py-1.5">
            <LifeBuoy size={17} color={red} /><Text className="font-sans-medium text-base text-text-primary dark:text-text-primary-dark">Help now</Text>
          </View>
        </Tap>
        <HeaderAvatar />
      </View>
    </View>
  );
  const Chip = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Tap onPress={onPress}>
      <View className="flex-row items-center gap-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-full px-3 py-2 self-start">
        <Text className="font-sans-medium text-sm text-text-primary dark:text-text-primary-dark">{label}</Text><ChevronDown size={14} color={soft} />
      </View>
    </Tap>
  );
  const Primary = ({ label, onPress, disabled, color = teal, icon }: { label: string; onPress?: () => void; disabled?: boolean; color?: string; icon?: React.ReactNode }) => (
    <Tap onPress={disabled ? undefined : onPress}>
      <View style={{ backgroundColor: color, opacity: disabled ? 0.45 : 1 }} className="rounded-[13px] py-4 flex-row items-center justify-center gap-2">
        {icon}<Text className="font-sans-bold text-white text-base">{label}</Text>
      </View>
    </Tap>
  );

  /* ============================ LOCATION ============================ */
  if (step === 'location')
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
        <Header />
        <View className="px-5 pt-2">
          <Text className="font-display text-4xl text-text-primary dark:text-text-primary-dark mt-1.5 mb-2.5">Find care</Text>
          <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-base leading-6 mb-2">Browse NPI-verified providers licensed in your state. A listing is information, not a recommendation.</Text>
          <View className="h-[120px] items-center justify-center my-4 bg-surface-accent dark:bg-surface-accent-dark rounded-[18px]"><BadgeCheck size={30} color={teal} /></View>
          <Primary label="Use my location" onPress={onUseLocation} />
          <Tap onPress={() => setStep('manual')}><View className="py-4 items-center"><Text className="font-sans-bold text-base text-primary dark:text-primary-dark">Enter my state instead</Text></View></Tap>
          <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-xs text-center mt-1.5">State sets who can legally see you. Change it anytime.</Text>
        </View>
      </SafeAreaView>
    );

  /* ============================ STATE ============================ */
  if (step === 'manual')
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
        <Header back={() => setStep('location')} />
        <View className="px-5 flex-1">
          <Text className="font-display text-3xl text-text-primary dark:text-text-primary-dark mt-1.5 mb-2.5">Which state?</Text>
          <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-base leading-6 mb-3.5">Providers are licensed by state. Coverage varies — some states have far fewer.</Text>
          <View className="flex-row items-center gap-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-4">
            <Search size={18} color={soft} /><TextInput placeholder="Search states" placeholderTextColor={faint} value={stateQ} onChangeText={setStateQ} className="flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark" />
          </View>
          <FlashList
            className="mt-3"
            data={STATES.filter((s) => s.toLowerCase().includes(stateQ.toLowerCase()))}
            keyExtractor={(s) => s}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: s }) => {
              const abbr = ABBR[s];
              const count = stateCounts.data && abbr ? (stateCounts.data[abbr] ?? 0) : undefined;
              const disabled = count === 0;
              const row = (
                <View style={{ opacity: disabled ? 0.4 : 1 }} className="flex-row items-center justify-between py-4 border-b border-border dark:border-border-dark">
                  <Text className="font-sans text-text-primary dark:text-text-primary-dark text-base">{s}</Text>
                  <View className="flex-row items-center gap-2.5">
                    {count !== undefined ? <Text className="font-sans text-sm text-text-tertiary dark:text-text-tertiary-dark">{count > 0 ? count.toLocaleString() : 'None listed'}</Text> : null}
                    {!disabled ? <ChevronRight size={18} color={soft} /> : null}
                  </View>
                </View>
              );
              return disabled ? row : (
                <Tap onPress={() => { setLoc(s); setCity(null); setCityQ(''); setStep('city'); }}>{row}</Tap>
              );
            }}
            ListFooterComponent={
              <Tap onPress={() => setStep('outside')}>
                <View className="flex-row items-center justify-between py-4 mt-1"><Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-base">I'm outside the United States</Text><ChevronRight size={18} color={soft} /></View>
              </Tap>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    );

  /* ============================ CITY ============================ */
  if (step === 'city' && loc) {
    // Real cities for this state (with counts) — never a hardcoded hint list.
    const allCities = cityCounts.data ?? [];
    const cities = allCities.filter((c) => c.city.toLowerCase().includes(cityQ.toLowerCase()));
    const loadingCities = cityCounts.isLoading;
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
        <Header back={() => setStep('manual')} />
        <View className="px-5 flex-1">
          <Chip label={loc} onPress={() => setStep('manual')} />
          <Text className="font-display text-3xl text-text-primary dark:text-text-primary-dark mt-3 mb-2.5">Which city?</Text>
          <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-base leading-6 mb-3.5">Filter by practice location, or browse the whole state.</Text>
          <View className="flex-row items-center gap-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-4">
            <Search size={18} color={soft} /><TextInput placeholder={`Search cities in ${loc}`} placeholderTextColor={faint} value={cityQ} onChangeText={setCityQ} className="flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark" />
          </View>
          <ScrollView className="mt-3" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Tap onPress={() => { setCity('all'); setStep('type'); }}>
              <View className="flex-row items-center justify-between py-4 border-b border-border dark:border-border-dark">
                <Text className="font-sans-medium text-text-primary dark:text-text-primary-dark text-base">All cities in {loc}</Text>
                <View className="flex-row items-center gap-2.5">
                  {stateTotal !== undefined ? <Text className="font-sans text-sm text-text-tertiary dark:text-text-tertiary-dark">{stateTotal.toLocaleString()}</Text> : null}
                  <ChevronRight size={18} color={soft} />
                </View>
              </View>
            </Tap>
            {loadingCities ? (
              <View className="pt-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} />)}</View>
            ) : (
              cities.map((c) => (
                <Tap key={c.city} onPress={() => { setCity(c.city); setStep('type'); }}>
                  <View className="flex-row items-center justify-between py-4 border-b border-border dark:border-border-dark">
                    <Text className="font-sans text-text-primary dark:text-text-primary-dark text-base">{c.city}</Text>
                    <View className="flex-row items-center gap-2.5">
                      <Text className="font-sans text-sm text-text-tertiary dark:text-text-tertiary-dark">{c.count.toLocaleString()}</Text>
                      <ChevronRight size={18} color={soft} />
                    </View>
                  </View>
                </Tap>
              ))
            )}
            {!loadingCities && cityQ && !cities.length ? (
              <View className="items-center py-8 px-4">
                <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm text-center">No listed cities in {loc} match “{cityQ}”.</Text>
                <Tap onPress={() => { setCity('all'); setStep('type'); }}><View className="py-3"><Text className="font-sans-bold text-base text-primary dark:text-primary-dark">Browse all of {loc}</Text></View></Tap>
              </View>
            ) : null}
            <View className="h-4" />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================ TYPE ============================ */
  if (step === 'type') {
    const tc = typeCounts.data;
    const allTypesTotal = tc ? Object.values(tc).reduce((a, b) => a + b, 0) : undefined;
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
        <Header back={() => setStep(city ? 'city' : 'manual')} />
        <View className="px-5 flex-1">
          <View className="flex-row gap-2">
            {loc ? <Chip label={loc} onPress={() => setStep('manual')} /> : null}
            {cityLabel ? <Chip label={cityLabel} onPress={() => setStep('city')} /> : null}
          </View>
          <Text className="font-display text-3xl text-text-primary dark:text-text-primary-dark mt-3 mb-2.5">What type of provider?</Text>
          <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-base leading-6 mb-3.5">Provider type comes straight from the NPI registry.</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
            <Tap onPress={() => startType(null)}>
              <View className="flex-row items-center justify-between border-[1.5px] border-border dark:border-border-dark rounded-2xl p-4 mb-3 bg-surface shadow-sm dark:shadow-none dark:bg-surface-dark">
                <View><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">All provider types</Text><Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm">Browse everyone in {cityLabel ?? loc}{allTypesTotal !== undefined ? ` · ${allTypesTotal.toLocaleString()}` : ''}</Text></View>
                <ChevronRight size={18} color={soft} />
              </View>
            </Tap>
            {(types.data ?? []).map((t: ProviderType) => {
              const Icon = iconForType(t.slug);
              const count = tc ? (tc[t.id] ?? 0) : undefined;
              const disabled = count === 0;
              const inner = (
                <View key={t.id} style={{ opacity: disabled ? 0.4 : 1 }} className="flex-row items-center gap-3 border-[1.5px] border-border dark:border-border-dark rounded-2xl p-4 mb-3 bg-surface shadow-sm dark:shadow-none dark:bg-surface-dark">
                  <View className="w-[38px] h-[38px] rounded-[10px] bg-surface-accent dark:bg-surface-accent-dark items-center justify-center"><Icon size={18} color={teal} /></View>
                  <View className="flex-1"><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">{t.label}</Text>{t.description ? <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm">{t.description}</Text> : null}</View>
                  {count !== undefined ? <Text className="font-sans text-sm text-text-tertiary dark:text-text-tertiary-dark">{count > 0 ? count.toLocaleString() : 'None'}</Text> : null}
                  {!disabled ? <ChevronRight size={18} color={soft} /> : null}
                </View>
              );
              return disabled ? <View key={t.id}>{inner}</View> : (
                <Tap key={t.id} onPress={() => startType({ id: t.id, label: t.label })}>{inner}</Tap>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================ OUTSIDE US ============================ */
  if (step === 'outside')
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
        <Header back={() => setStep('manual')} />
        <View className="px-5 pt-2">
          <Text className="font-display text-3xl text-text-primary dark:text-text-primary-dark mb-2.5">The directory is U.S.-only for now</Text>
          <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-base leading-6 mb-2">We currently list NPI-registered providers in the United States. We're working on more regions.</Text>
          <View className="bg-crisis/10 dark:bg-crisis-dark/20 rounded-2xl p-4 my-2">
            <View className="flex-row items-center gap-2 mb-1.5"><LifeBuoy size={18} color={red} /><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">In crisis right now?</Text></View>
            <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm leading-5">You can still reach help. If you're in immediate danger, contact your local emergency number.</Text>
            <View className="mt-3"><Primary label="See crisis resources" color={red} onPress={() => setSheet('crisis')} /></View>
          </View>
          <Tap onPress={() => setStep('manual')}><View className="py-4 items-center"><Text className="font-sans-bold text-base text-primary dark:text-primary-dark">I'm actually in the U.S.</Text></View></Tap>
        </View>
      </SafeAreaView>
    );

  /* ============================ PROFILE ============================ */
  if (step === 'profile' && activeId)
    return <ProfileStep id={activeId} onBack={() => setStep('results')} saved={isSaved(activeId)} onToggleSave={() => toggleSave(activeId)} fireHaptic={fireHaptic} />;

  /* ============================ COMPARE ============================ */
  if (step === 'compare')
    return <CompareStep ids={savedIds.slice(0, 3)} onBack={() => setStep('results')} onRemove={(id) => toggleSave(id)} />;

  /* ============================ RESULTS ============================ */
  const providers = search.providers;
  const loading = search.isLoading;

  const ListHeader = (
    <View className="bg-background dark:bg-background-dark pt-1 pb-2.5 border-b border-border dark:border-border-dark">
      <View className="flex-row gap-2 flex-wrap mb-2.5">
        <Chip label={locLabel} onPress={() => setStep('manual')} />
        {loc ? <Chip label={cityLabel ?? `All ${loc}`} onPress={() => setStep('city')} /> : null}
        <Chip label={typeSel ? typeSel.label : 'All types'} onPress={() => setStep('type')} />
      </View>
      <View className="flex-row items-center gap-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3.5 py-2.5">
        <Search size={17} color={soft} /><TextInput placeholder="Search by name" placeholderTextColor={faint} value={query} onChangeText={setQuery} className="flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark" />
        {query ? <Tap accessibilityLabel="Clear search" onPress={() => setQuery('')} className="p-2 -mr-2"><X size={16} color={soft} /></Tap> : null}
      </View>
      <View className="flex-row items-center justify-between mt-2.5">
        {loading ? (
          <Text className="font-sans-bold text-sm text-text-primary dark:text-text-primary-dark">Searching…</Text>
        ) : (
          <View className="flex-row items-center gap-1.5"><BadgeCheck size={15} color={teal} /><Text className="font-sans-bold text-sm text-text-primary dark:text-text-primary-dark">{countShown.toLocaleString()} verified</Text></View>
        )}
        <Tap onPress={() => setSheet('sort')}><View className="flex-row items-center gap-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-full px-3 py-1.5"><ArrowUpDown size={14} color={ink} /><Text className="font-sans-medium text-sm text-text-primary dark:text-text-primary-dark">Sort</Text></View></Tap>
      </View>
      <Text className="font-sans text-text-tertiary dark:text-text-tertiary-dark text-xs leading-4 mt-2.5">NPI-registry listings. Information, not a recommendation. Order is not a ranking of quality.</Text>
      {!loading && headerCount > 0 && headerCount <= 25 ? (
        <View className="flex-row gap-2 items-start bg-surface-active dark:bg-surface-active-dark rounded-xl px-3 py-2.5 mt-3">
          <Info size={15} color="#A9791F" />
          <Text className="font-sans text-sm text-text-primary dark:text-text-primary-dark leading-4 flex-1">Limited coverage in {cityLabel ?? loc} ({headerCount}). {city && city !== 'all' ? <Text onPress={() => setCity('all')} className="font-sans-bold text-warning dark:text-warning-dark underline">Browse all of {loc}</Text> : `That's the full count of NPI listings for ${loc}.`}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderCard = ({ item: p }: { item: ProviderCardData }) => {
    const sv = isSaved(p.id);
    const name = cleanDisplayName(p.display_name) || p.display_name;
    const place = [p.primary_city, p.primary_state].filter(Boolean).join(', ');
    const dist = p.distance_miles != null ? ` · ${p.distance_miles.toFixed(1)} mi` : '';
    return (
      <Animated.View entering={enter()} className="flex-row bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl mb-4 overflow-hidden shadow-sm dark:shadow-none">
        {/* No photoUrl: the directory is NPPES-only — providers are never shown by photo, anywhere (clay initials only). */}
        <Pressable className="flex-1" onPress={() => { recordRecentlyViewed({ id: p.id, name, photoUrl: null }); setActiveId(p.id); setStep('profile'); }}>
          <View className="flex-row gap-3 p-[15px]">
            <View style={{ backgroundColor: colorFor(p.id) }} className="w-[46px] h-[46px] rounded-full items-center justify-center"><Text className="font-sans-bold text-white text-base">{initials(name)}</Text></View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 flex-wrap"><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">{name}</Text>{p.credentials_suffix ? <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm">{p.credentials_suffix}</Text> : null}</View>
              <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm mt-0.5">{p.provider_type_label}</Text>
              <View className="flex-row items-center gap-2.5 mt-2 flex-wrap">
                {place ? <View className="flex-row items-center gap-1"><MapPin size={12} color={soft} /><Text className="font-sans text-xs text-text-secondary dark:text-text-secondary-dark">{place}{dist}</Text></View> : null}
                <View className="flex-row items-center gap-1 bg-surface-accent dark:bg-surface-accent-dark rounded-full px-2.5 py-0.5"><BadgeCheck size={12} color={tealPress} /><Text className="font-sans-bold text-xs text-primary-hover dark:text-primary-hover-dark">NPI-verified</Text></View>
              </View>
            </View>
          </View>
        </Pressable>
        <Tap onPress={() => toggleSave(p.id)}><View className="px-3.5 h-full justify-center border-l border-border dark:border-border-dark"><Bookmark size={18} color={sv ? teal : faint} fill={sv ? teal : 'transparent'} /></View></Tap>
      </Animated.View>
    );
  };

  const Empty = (
    <View className="items-center px-6 pt-12">
      <View className="w-14 h-14 rounded-full bg-surface-active dark:bg-surface-active-dark items-center justify-center mb-4"><Search size={24} color={soft} /></View>
      <Text className="font-display text-xl text-text-primary dark:text-text-primary-dark mb-2 text-center">No providers match</Text>
      <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm leading-5 text-center mb-5">{debounced ? `Nothing matches “${debounced}” in ${cityLabel ?? locLabel}.` : `No providers of this type are listed in ${cityLabel ?? locLabel}.`}</Text>
      <View className="w-full gap-2.5">
        <Primary label={debounced ? 'Clear search' : 'Show all types'} onPress={() => (debounced ? setQuery('') : startType(null))} />
        {loc ? <Tap onPress={() => setCity('all')}><View className="py-4 items-center"><Text className="font-sans-bold text-base text-primary dark:text-primary-dark">Browse all of {loc}</Text></View></Tap> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <Header back={() => setStep('type')} />
      {/* Fixed header (chips + search + sort) — kept OUT of the list so the search
          box does not lose focus on every keystroke as the list re-renders. */}
      <View className="px-5">{ListHeader}</View>
      <View className="px-5 flex-1">
        {loading ? (
          <View className="pt-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} />)}</View>
        ) : (
          <FlashList
            data={providers}
            keyExtractor={(p) => p.id}
            renderItem={renderCard}
            ListEmptyComponent={Empty}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.5}
            onEndReached={() => { if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage(); }}
            ListHeaderComponent={<View className="h-3" />}
            ListFooterComponent={
              providers.length ? (
                <Text className="font-sans text-center py-2 text-text-secondary dark:text-text-secondary-dark text-xs">{search.hasNextPage ? 'Loading more…' : `That's everyone — ${providers.length} loaded.`}</Text>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 28) }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {savedIds.length >= 2 && !loading ? (
        <Animated.View entering={enter()} className="absolute left-[18px] right-[18px] bottom-[24px]">
          <Tap onPress={() => setStep('compare')}><View className="bg-primary rounded-[13px] py-4 flex-row items-center justify-center gap-1.5"><Text className="font-sans-bold text-white text-base">Compare {Math.min(savedIds.length, 3)} selected</Text><ChevronRight size={18} color="#fff" /></View></Tap>
        </Animated.View>
      ) : null}

      <SortSheet visible={sheet === 'sort'} value={sort} geo={!!coords} onSelect={(v) => { setSort(v); setSheet(null); }} onClose={() => setSheet(null)} />
      <CrisisSheet visible={sheet === 'crisis'} onClose={() => setSheet(null)} />
    </SafeAreaView>
  );
}

/* ----------------------------- profile step ----------------------------- */
function Row({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  const { colorScheme } = useColorScheme();
  const soft = colorScheme === 'dark' ? colors.text.secondary.dark : colors.text.secondary.light;
  return (
    <View className="flex-row items-center gap-3"><Icon size={17} color={soft} /><Text className="font-sans text-sm text-text-secondary dark:text-text-secondary-dark w-[104px]">{label}</Text><Text className="font-sans-medium text-sm text-text-primary dark:text-text-primary-dark flex-1">{value}</Text></View>
  );
}
function ProfileStep({ id, onBack, saved, onToggleSave, fireHaptic }: { id: string; onBack: () => void; saved: boolean; onToggleSave: () => void; fireHaptic: (e: 'affirm') => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ink = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const faint = isDark ? colors.text.tertiary.dark : colors.text.tertiary.light;
  const teal = isDark ? colors.teal[400] : colors.teal[600];
  const { data, isLoading } = useQuery({ queryKey: ['providers', 'detail', id], queryFn: () => getProviderById(id), enabled: !!id });
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-5 pt-1 pb-2"><Tap onPress={onBack}><View className="p-2.5"><ChevronLeft size={24} color={ink} /></View></Tap></View>
      {children}
    </SafeAreaView>
  );
  if (isLoading || !data) return <Shell><View className="flex-1 items-center justify-center"><Text className="font-sans text-text-secondary dark:text-text-secondary-dark">{isLoading ? 'Loading…' : 'This listing could not be loaded.'}</Text></View></Shell>;

  const p: ProviderWithDetails = data;
  const name = cleanDisplayName(p.display_name) || p.display_name;
  const locrow = p.locations.find((l) => l.is_primary) ?? p.locations[0] ?? null;
  const verified = formatVerified(p.verified_at);
  const badge = getTrustBadge({ status: p.status, verified_at: p.verified_at });

  return (
    <Shell>
      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3.5 items-center">
          <View style={{ backgroundColor: colorFor(p.id) }} className="w-[60px] h-[60px] rounded-full items-center justify-center"><Text className="font-sans-bold text-white text-xl">{initials(name)}</Text></View>
          <View className="flex-1"><Text className="font-display text-2xl text-text-primary dark:text-text-primary-dark">{name}</Text><Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm mt-0.5">{[p.provider_type?.label, p.credentials_suffix].filter(Boolean).join(' · ')}</Text></View>
          <Tap onPress={onToggleSave}><View className="pl-3"><Bookmark size={20} color={saved ? teal : faint} fill={saved ? teal : 'transparent'} /></View></Tap>
        </View>
        {verified && (badge === 'verified') ? (
          <View className="flex-row items-center gap-2 bg-surface-accent dark:bg-surface-accent-dark rounded-[10px] px-3 py-2.5 mt-3.5"><BadgeCheck size={16} color={teal} /><Text className="font-sans text-sm text-text-primary dark:text-text-primary-dark">NPI-verified · last confirmed {verified}</Text></View>
        ) : null}
        <View className="mt-4 gap-3">
          {p.npi_number ? <Row icon={Hash} label="NPI number" value={p.npi_number} /> : null}
          {p.provider_type?.label ? <Row icon={MessageSquare} label="Provider type" value={p.provider_type.label} /> : null}
          {p.license_number ? <Row icon={FileText} label="License" value={[p.license_number, p.license_state].filter(Boolean).join(' · ')} /> : null}
          {locrow?.city ? <Row icon={Building2} label="Practice city" value={[locrow.city, locrow.state_province].filter(Boolean).join(', ')} /> : null}
          {p.phone ? <Row icon={Phone} label="Phone" value={p.phone} /> : null}
        </View>
        <View className="bg-surface-active dark:bg-surface-active-dark rounded-2xl p-4 mt-4 mb-2"><Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm leading-5">This listing is drawn from the NPI registry. It's information, not a recommendation or endorsement by Psychage. Confirm license, availability, and fit directly with the provider.</Text></View>
        <View className="h-24" />
      </ScrollView>
      <View className="px-5 py-3 border-t border-border dark:border-border-dark gap-2">
        {p.phone ? (
          <Tap onPress={() => { fireHaptic('affirm'); dial(telUrl(p.phone as string)); }}>
            <View style={{ backgroundColor: teal }} className="rounded-[13px] py-4 flex-row items-center justify-center gap-2"><Phone size={17} color="#fff" /><Text className="font-sans-bold text-white text-base">Call {p.phone}</Text></View>
          </Tap>
        ) : null}
        <Tap onPress={() => router.push({ pathname: '/add-provider', params: { name, ...(p.phone ? { contact: p.phone } : {}) } })}>
          <View className="rounded-[13px] py-4 items-center border border-border dark:border-border-dark"><Text className="font-sans-bold text-base text-text-primary dark:text-text-primary-dark">Use in my therapist record</Text></View>
        </Tap>
      </View>
    </Shell>
  );
}

/* ----------------------------- compare step ----------------------------- */
function CompareStep({ ids, onBack, onRemove }: { ids: string[]; onBack: () => void; onRemove: (id: string) => void }) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const { data } = useQuery({
    queryKey: ['providers', 'compare', ids],
    queryFn: async () => (await Promise.all(ids.map((id) => getProviderById(id)))).filter((r): r is ProviderWithDetails => r != null),
    enabled: ids.length > 0,
  });
  const C = ({ l, v }: { l: string; v: string }) => (
    <View className="py-2 border-t border-border dark:border-border-dark"><Text className="font-sans-bold text-[11px] text-text-tertiary dark:text-text-tertiary-dark uppercase tracking-wide">{l}</Text><Text className="font-sans text-sm text-text-primary dark:text-text-primary-dark mt-0.5">{v}</Text></View>
  );
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2"><Tap onPress={onBack}><View className="p-2.5"><ChevronLeft size={24} color={ink} /></View></Tap><Text className="font-sans-bold text-base text-text-primary dark:text-text-primary-dark">Compare</Text><View className="w-8" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {(data ?? []).map((p) => {
          const name = cleanDisplayName(p.display_name) || p.display_name;
          const locrow = p.locations.find((l) => l.is_primary) ?? p.locations[0] ?? null;
          return (
            <View key={p.id} className="w-[180px] bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-3.5">
              <View style={{ backgroundColor: colorFor(p.id) }} className="w-[46px] h-[46px] rounded-full items-center justify-center self-center mb-2"><Text className="font-sans-bold text-white">{initials(name)}</Text></View>
              <Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base text-center">{name}</Text>
              <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-xs text-center mb-3">{p.credentials_suffix ?? ' '}</Text>
              <C l="Type" v={p.provider_type?.label ?? '—'} />
              <C l="Location" v={locrow?.city ? [locrow.city, locrow.state_province].filter(Boolean).join(', ') : '—'} />
              <C l="NPI" v={p.npi_number ?? '—'} />
              <C l="License" v={[p.license_number, p.license_state].filter(Boolean).join(' · ') || '—'} />
              <C l="Verified" v={formatVerified(p.verified_at) ?? '—'} />
              <Tap onPress={() => onRemove(p.id)}><View className="py-2 mt-1.5 items-center"><Text className="font-sans-bold text-primary dark:text-primary-dark text-sm">Remove</Text></View></Tap>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------- sheets ----------------------------- */
function SortSheet({ visible, value, geo, onSelect, onClose }: { visible: boolean; value: string; geo: boolean; onSelect: (v: 'relevance' | 'name' | 'distance') => void; onClose: () => void }) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const teal = colorScheme === 'dark' ? colors.teal[400] : colors.teal[600];
  const opts: [string, string][] = [['relevance', 'Relevance'], ...(geo ? ([['distance', 'Nearest']] as [string, string][]) : []), ['name', 'Name A–Z']];
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/35 justify-end" onPress={onClose}>
        <Pressable onPress={() => {}} className="bg-background dark:bg-background-dark rounded-t-[20px]">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2.5 border-b border-border dark:border-border-dark"><View className="w-14" /><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">Sort</Text><Tap onPress={onClose}><X size={20} color={ink} /></Tap></View>
          <View className="px-5 pb-6 pt-1">
            <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm leading-5 mb-1">Sorting changes order only. It is not a ranking of quality.</Text>
            {opts.map(([v, l]) => (
              <Tap key={v} onPress={() => onSelect(v as 'relevance' | 'name' | 'distance')}>
                <View className="flex-row items-center justify-between py-4 border-b border-border dark:border-border-dark"><Text className="font-sans text-base text-text-primary dark:text-text-primary-dark">{l}</Text>{value === v ? <Check size={18} color={teal} /> : null}</View>
              </Tap>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
function CrisisSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const red = colorScheme === 'dark' ? colors.crisis.dark : colors.crisis.light;
  const rows = [
    { t: '988 Suicide & Crisis Lifeline', s: 'Call or text 988 (U.S.)', I: Phone },
    { t: 'Crisis Text Line', s: 'Text HOME to 741741', I: MessageSquare },
    { t: 'Emergency services', s: 'Call 911', I: LifeBuoy },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/35 justify-end" onPress={onClose}>
        <Pressable onPress={() => {}} className="bg-background dark:bg-background-dark rounded-t-[20px]">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2.5 border-b border-border dark:border-border-dark"><View className="w-14" /><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">Get help now</Text><Tap onPress={onClose}><X size={20} color={ink} /></Tap></View>
          <View className="px-5 pb-6 pt-1">
            <Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm leading-5 mb-1">If you're in immediate danger, call your local emergency number now.</Text>
            {rows.map((r) => (
              <View key={r.t} className="flex-row items-center gap-3.5 py-4 border-b border-border dark:border-border-dark">
                <View className="w-10 h-10 rounded-[10px] bg-crisis/10 dark:bg-crisis-dark/20 items-center justify-center"><r.I size={18} color={red} /></View>
                <View><Text className="font-sans-bold text-text-primary dark:text-text-primary-dark text-base">{r.t}</Text><Text className="font-sans text-text-secondary dark:text-text-secondary-dark text-sm">{r.s}</Text></View>
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
