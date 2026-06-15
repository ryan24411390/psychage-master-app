// CT4 FIXTURE — Find tab copy (S28). NOT final. New location-setup strings are
// CT-pending: clinically reviewed (non-clinical, person-first) before ship.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_FIND = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  title: 'Find care',
  intro: 'Browse the provider directory. A listing is information, not a recommendation.',
  openDirectory: 'Open the directory',

  // Location setup (one-time gate, editable later). CT-pending.
  setupStateTitle: 'Where are you looking for care?',
  setupStateBody: 'Providers are licensed by state, so this sets who can legally see you. You can change it anytime.',
  setupStateSearch: 'Search states',
  setupBrowseAll: 'Browse all states',
  setupOutside: "I'm outside the United States",
  setupCityTitle: 'Which city?',
  setupCityBody: 'Narrow to a city, or browse the whole state.',
  setupCitySearch: (state: string) => `Type a city in ${state}`,
  setupAllCities: (state: string) => `All cities in ${state}`,
  setupUseCity: (city: string) => `Use “${city}”`,

  // Outside-US note. CT-pending.
  outsideTitle: 'The directory is U.S.-only for now',
  outsideBody: 'Psychage currently lists providers registered in the United States. More regions are on the way.',
  outsideCrisisTitle: 'Need support right now?',
  outsideCrisisBody: 'You can still reach help. If you are in immediate danger, contact your local emergency number.',
  outsideCrisisCta: 'See crisis resources',
  outsideBack: "I'm in the U.S.",
} as const;
