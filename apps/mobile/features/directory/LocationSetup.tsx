import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, LifeBuoy, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CT4_FIND } from '@/features/find/copy';
import { useHaptics } from '@/lib/haptic-context';
import { useDirectoryLocation } from '@/lib/use-directory-location';
import { useThemeColors } from '@/lib/use-theme-colors';

import { ABBR, STATES } from './states';

// One-time location setup for the Find tab (replaces the prototype's run-every-
// visit wizard). Completing it persists a home browse scope so a returning user
// lands straight in scoped results. Reachable again later via the location chip
// (resetLocation). Token-clean rebuild — no hardcoded hex, no serif. The tabs
// GlobalHeader (with the crisis pill) sits above this content.

const t = CT4_FIND;

type Step = 'state' | 'city' | 'outside';

function Row({
  label,
  meta,
  emphasis,
  onPress,
  testID,
}: {
  label: string;
  meta?: string;
  emphasis?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const tc = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      className="min-h-[44px] flex-row items-center justify-between border-b border-border py-3.5 dark:border-border-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text variant={emphasis ? 'bodyLarge' : 'body'}>{label}</Text>
      <View className="flex-row items-center gap-2">
        {meta ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {meta}
          </Text>
        ) : null}
        <ChevronRight size={18} color={tc.inkSecondary} strokeWidth={1.75} />
      </View>
    </Pressable>
  );
}

export function LocationSetup() {
  const { setLocation } = useDirectoryLocation();
  const { fireHaptic } = useHaptics();
  const tc = useThemeColors();

  const [step, setStep] = useState<Step>('state');
  const [stateName, setStateName] = useState<string | null>(null);
  const [stateQ, setStateQ] = useState('');
  const [cityQ, setCityQ] = useState('');

  const matches = useMemo(
    () => STATES.filter((s) => s.toLowerCase().includes(stateQ.trim().toLowerCase())),
    [stateQ],
  );

  const pickState = (name: string) => {
    fireHaptic('tab');
    setStateName(name);
    setCityQ('');
    setStep('city');
  };

  const finish = (city: string | null) => {
    setLocation({
      stateName,
      stateAbbr: stateName ? (ABBR[stateName] ?? null) : null,
      city,
    });
  };

  const browseAll = () => {
    fireHaptic('tab');
    setLocation({ stateName: null, stateAbbr: null, city: null });
  };

  // ── Outside the U.S. ───────────────────────────────────────────────────────
  if (step === 'outside') {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => setStep('state')}
          hitSlop={8}
          className="min-h-[44px] flex-row items-center gap-1 self-start"
        >
          <ChevronLeft size={20} color={tc.inkSecondary} strokeWidth={2} />
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.outsideBack}
          </Text>
        </Pressable>

        <Text variant="h1" className="mt-2">
          {t.outsideTitle}
        </Text>
        <Text variant="body" className="mt-2 text-text-secondary dark:text-text-secondary-dark">
          {t.outsideBody}
        </Text>

        <View className="mt-5 rounded-xl bg-surface-accent p-4 dark:bg-surface-accent-dark">
          <View className="flex-row items-center gap-2">
            <LifeBuoy size={18} color={tc.crisis} strokeWidth={1.75} />
            <Text variant="bodyLarge">{t.outsideCrisisTitle}</Text>
          </View>
          <Text variant="caption" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
            {t.outsideCrisisBody}
          </Text>
          <View className="mt-3">
            <Button variant="primary" onPress={() => router.push('/crisis')} testID="setup-outside-crisis">
              {t.outsideCrisisCta}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // ── City (optional) ────────────────────────────────────────────────────────
  if (step === 'city' && stateName) {
    const typed = cityQ.trim();
    return (
      <View className="flex-1 bg-background dark:bg-background-dark px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to states"
          onPress={() => setStep('state')}
          hitSlop={8}
          className="min-h-[44px] flex-row items-center gap-1 self-start"
        >
          <ChevronLeft size={20} color={tc.inkSecondary} strokeWidth={2} />
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {stateName}
          </Text>
        </Pressable>

        <Text variant="h1" className="mt-2">
          {t.setupCityTitle}
        </Text>
        <Text variant="body" className="mt-2 text-text-secondary dark:text-text-secondary-dark">
          {t.setupCityBody}
        </Text>

        <View className="mt-4 flex-row items-center gap-2 rounded-lg border border-border bg-surface px-3 dark:border-border-dark dark:bg-surface-dark">
          <Search size={18} color={tc.inkTertiary} strokeWidth={1.75} />
          <TextInput
            accessibilityLabel={t.setupCitySearch(stateName)}
            value={cityQ}
            onChangeText={setCityQ}
            placeholder={t.setupCitySearch(stateName)}
            placeholderTextColor={tc.inkTertiary}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => finish(typed || null)}
            className="min-h-[44px] flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark"
          />
        </View>

        <View className="mt-4">
          <Button variant="primary" onPress={() => finish(null)} testID="setup-all-cities">
            {t.setupAllCities(stateName)}
          </Button>
        </View>
        {typed ? (
          <View className="mt-2">
            <Button variant="secondary" onPress={() => finish(typed)} testID="setup-use-city">
              {t.setupUseCity(typed)}
            </Button>
          </View>
        ) : null}
      </View>
    );
  }

  // ── State (entry) ──────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background dark:bg-background-dark px-4 pt-2">
      <Text variant="h1">{t.setupStateTitle}</Text>
      <Text variant="body" className="mt-2 text-text-secondary dark:text-text-secondary-dark">
        {t.setupStateBody}
      </Text>

      <View className="mt-4 flex-row items-center gap-2 rounded-lg border border-border bg-surface px-3 dark:border-border-dark dark:bg-surface-dark">
        <Search size={18} color={tc.inkTertiary} strokeWidth={1.75} />
        <TextInput
          accessibilityLabel={t.setupStateSearch}
          value={stateQ}
          onChangeText={setStateQ}
          placeholder={t.setupStateSearch}
          placeholderTextColor={tc.inkTertiary}
          autoCorrect={false}
          returnKeyType="search"
          className="min-h-[44px] flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark"
        />
      </View>

      <View className="mt-3 flex-1">
        <FlashList
          data={matches}
          keyExtractor={(s) => s}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Row label={item} meta={ABBR[item]} onPress={() => pickState(item)} testID={`setup-state-${ABBR[item]}`} />
          )}
        />
      </View>

      {/* Persistent escape hatches, always visible below the list. */}
      <View className="pb-1">
        <Row label={t.setupBrowseAll} emphasis onPress={browseAll} testID="setup-browse-all" />
        <Row label={t.setupOutside} onPress={() => setStep('outside')} testID="setup-outside" />
      </View>
    </View>
  );
}
