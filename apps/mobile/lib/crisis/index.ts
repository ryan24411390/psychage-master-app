// Crisis data layer — public API, wired to real storage + Supabase.
//
// Exposes the web-parity contract (getCrisisResources / listCrisisCountries)
// plus refreshCrisisCache() for the silent online refresh. The crisis surface
// reads fully offline from the committed bundle / MMKV cache; the network is
// never required (rules/offline.md §6).
//
// Integration note: this data layer is NOT yet consumed by the existing S11/S12
// screens in `features/crisis/` (they use the frozen 5-field presentational
// schema + bundled fixture). Reconciling the two is the crisis-UI wave's job —
// see `lib/crisis/HANDOFF.md`.

import bundleJson from '@/data/crisis/crisis-bundle.json';
import type { CrisisBundle } from '@/data/crisis/crisis-bundle.types';
import { storage } from '@/lib/adapters/storage';
import { getSupabaseClient } from '@/lib/supabase';

import { CrisisStore } from './store';
import type { CrisisCountrySummary, CrisisResources } from './types';

export type { CrisisCountrySummary, CrisisResources, HelplineRow } from './types';

const bundle = bundleJson as CrisisBundle;

/**
 * Fetch the freshest verified dataset from Supabase using the anon client.
 * RLS already restricts crisis_helplines to verified rows and exposes all
 * countries, so the anon read mirrors the build-time export. Returns `null`
 * on any failure (offline, no configured client, query error) — never throws.
 */
async function fetchVerified(): Promise<CrisisBundle | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const [countriesRes, helplinesRes] = await Promise.all([
      sb
        .from('crisis_countries')
        .select('iso2, country_name, emergency_number, emergency_note, has_verified_helplines')
        .order('country_name', { ascending: true }),
      sb
        .from('crisis_helplines')
        .select('country_iso2, name, description, call_number, text_capable, text_number, display_order')
        .eq('verification_status', 'verified')
        .order('country_iso2', { ascending: true })
        .order('display_order', { ascending: true }),
    ]);

    if (countriesRes.error || helplinesRes.error) return null;
    const countries = countriesRes.data;
    const helplines = helplinesRes.data;
    if (!countries || !helplines) return null;

    return {
      generated: new Date().toISOString(),
      countries: countries.map((c) => ({
        iso2: c.iso2,
        name: c.country_name,
        emergencyNumber: c.emergency_number,
        emergencyNote: c.emergency_note ?? null,
        hasVerifiedHelplines: c.has_verified_helplines,
      })),
      helplines: helplines.map((h) => ({
        region: h.country_iso2,
        name: h.name,
        description: h.description,
        callNumber: h.call_number ?? null,
        textCapable: h.text_capable,
        textNumber: h.text_number ?? null,
        displayOrder: h.display_order,
      })),
    };
  } catch {
    return null;
  }
}

const store = new CrisisStore({ storage, bundle, fetchVerified });

/** Resources for one country (S11). Reads offline-first; never requires network. */
export async function getCrisisResources(iso2: string): Promise<CrisisResources> {
  return store.getResources(iso2);
}

/** Every country (iso2 + name), ordered by name — for the S12 picker. */
export async function listCrisisCountries(): Promise<CrisisCountrySummary[]> {
  return store.listCountries();
}

/**
 * Silent refresh of the MMKV cache from Supabase. Call on app foreground
 * (rules/offline.md §6 "once per day on app foreground"). Returns true if the
 * cache was updated, false if offline / unavailable. Never throws.
 */
export async function refreshCrisisCache(): Promise<boolean> {
  return store.refresh();
}
