// CT3 VERIFIED crisis dataset — the source of truth for the bundled crisis surface.
//
// Provided by the founder/CT3 research pass (generated 2026-06-14). This is the verified
// core + flagged rows + explicit gaps, NOT all ~190 countries. `helplines.fixtures.ts`
// DERIVES the shipped `CRISIS_DATASET` from this seed; nothing consumes the seed's
// non-verified rows.
//
// `verificationStatus` GATES display (enforced in the fixture derivation, not here):
//   - 'verified'           → renders in the app.
//   - 'needs_verification' → seeded-but-hidden; retained here for founder promotion,
//                            NEVER shipped to the UI until promoted to 'verified'.
//   - 'do_not_publish'     → stored for audit only; NEVER rendered.
// A country with `hasVerifiedHelplines: false` therefore resolves to the S11 gap state
// (its only seed rows, if any, are non-verified). Descriptions are DRAFT → CT4 (factual
// five-word lines; final voice pass pending). `lastVerified` is the date the research
// confirmed/flagged a row; the founder updates it on promotion.
//
// SR-4: nothing here is symptom data. Crisis content is reference data, bundled offline.

export type VerificationStatus = 'verified' | 'needs_verification' | 'do_not_publish';

export interface SeedCountry {
  readonly iso2: string;
  readonly countryName: string;
  readonly emergencyNumber: string;
  /** Disambiguation note (e.g. "110 police, 119 ambulance"). No UI slot yet → CT4. */
  readonly emergencyNote: string | null;
  readonly hasVerifiedHelplines: boolean;
  readonly lastVerified: string;
}

export interface SeedHelpline {
  readonly countryIso2: string;
  readonly name: string;
  readonly description: string;
  readonly callNumber: string | null;
  readonly textCapable: boolean;
  readonly textNumber: string | null;
  /** Hours/availability (e.g. "24/7", "4pm-12am daily"). No UI slot yet → CT4. */
  readonly availability: string;
  readonly languages: string;
  readonly sourceUrl: string;
  readonly verificationStatus: VerificationStatus;
  readonly isInternational: boolean;
  readonly displayOrder: number;
}

export interface CrisisSeed {
  readonly schemaVersion: string;
  readonly generated: string;
  readonly countries: readonly SeedCountry[];
  readonly helplines: readonly SeedHelpline[];
}

export const CRISIS_SEED: CrisisSeed = {
  schemaVersion: '1.0.0',
  generated: '2026-06-14',
  countries: [
    { iso2: 'US', countryName: 'United States', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'CA', countryName: 'Canada', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'MX', countryName: 'Mexico', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'GB', countryName: 'United Kingdom', emergencyNumber: '999', emergencyNote: '112 also works', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'IE', countryName: 'Ireland', emergencyNumber: '112', emergencyNote: '999 also works', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'FR', countryName: 'France', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'DE', countryName: 'Germany', emergencyNumber: '112', emergencyNote: '110 police', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'ES', countryName: 'Spain', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'IT', countryName: 'Italy', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'NL', countryName: 'Netherlands', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'DK', countryName: 'Denmark', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'FI', countryName: 'Finland', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'IS', countryName: 'Iceland', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'GR', countryName: 'Greece', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'HR', countryName: 'Croatia', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'CY', countryName: 'Cyprus', emergencyNumber: '112', emergencyNote: '199 also works', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'CZ', countryName: 'Czech Republic', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'EE', countryName: 'Estonia', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'HU', countryName: 'Hungary', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'LT', countryName: 'Lithuania', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'LV', countryName: 'Latvia', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'LU', countryName: 'Luxembourg', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'MT', countryName: 'Malta', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'NO', countryName: 'Norway', emergencyNumber: '112', emergencyNote: '113 medical', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'SE', countryName: 'Sweden', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'CH', countryName: 'Switzerland', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'BE', countryName: 'Belgium', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'AT', countryName: 'Austria', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'PT', countryName: 'Portugal', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'PL', countryName: 'Poland', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'IN', countryName: 'India', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'BD', countryName: 'Bangladesh', emergencyNumber: '999', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-15' },
    { iso2: 'CN', countryName: 'China', emergencyNumber: '120', emergencyNote: '110 police, 120 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'JP', countryName: 'Japan', emergencyNumber: '119', emergencyNote: '110 police, 119 fire/ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'KR', countryName: 'South Korea', emergencyNumber: '119', emergencyNote: '112 police, 119 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'SG', countryName: 'Singapore', emergencyNumber: '995', emergencyNote: '999 police, 995 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'MY', countryName: 'Malaysia', emergencyNumber: '999', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'PH', countryName: 'Philippines', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'HK', countryName: 'Hong Kong', emergencyNumber: '999', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'IL', countryName: 'Israel', emergencyNumber: '101', emergencyNote: '100 police, 101 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'LB', countryName: 'Lebanon', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'ID', countryName: 'Indonesia', emergencyNumber: '119', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'TH', countryName: 'Thailand', emergencyNumber: '1669', emergencyNote: '191 police, 1669 ambulance', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'IR', countryName: 'Iran', emergencyNumber: '115', emergencyNote: '110 police, 115 ambulance', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'AE', countryName: 'United Arab Emirates', emergencyNumber: '999', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'SA', countryName: 'Saudi Arabia', emergencyNumber: '997', emergencyNote: '911 in some regions, 997 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'QA', countryName: 'Qatar', emergencyNumber: '999', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'JO', countryName: 'Jordan', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'AU', countryName: 'Australia', emergencyNumber: '000', emergencyNote: '112 from mobile', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'NZ', countryName: 'New Zealand', emergencyNumber: '111', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'FJ', countryName: 'Fiji', emergencyNumber: '911', emergencyNote: '917 also used', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'BR', countryName: 'Brazil', emergencyNumber: '192', emergencyNote: '190 police, 192 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'KY', countryName: 'Cayman Islands', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'GY', countryName: 'Guyana', emergencyNumber: '913', emergencyNote: '999 police, 913 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'AR', countryName: 'Argentina', emergencyNumber: '911', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'CL', countryName: 'Chile', emergencyNumber: '131', emergencyNote: '133 police, 131 ambulance', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'CO', countryName: 'Colombia', emergencyNumber: '123', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'ZA', countryName: 'South Africa', emergencyNumber: '10177', emergencyNote: '10111 police, 10177 ambulance, 112 from mobile', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'KE', countryName: 'Kenya', emergencyNumber: '999', emergencyNote: '112 also works', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'ZM', countryName: 'Zambia', emergencyNumber: '999', emergencyNote: '112 also works', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'BW', countryName: 'Botswana', emergencyNumber: '997', emergencyNote: '999 police, 997 ambulance', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'UG', countryName: 'Uganda', emergencyNumber: '999', emergencyNote: '112 also works', hasVerifiedHelplines: true, lastVerified: '2026-06-14' },
    { iso2: 'NG', countryName: 'Nigeria', emergencyNumber: '112', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'GH', countryName: 'Ghana', emergencyNumber: '999', emergencyNote: null, hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'RW', countryName: 'Rwanda', emergencyNumber: '912', emergencyNote: '112 police, 912 ambulance', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'TZ', countryName: 'Tanzania', emergencyNumber: '112', emergencyNote: '999 also works', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'ZW', countryName: 'Zimbabwe', emergencyNumber: '994', emergencyNote: '995 police, 994 ambulance', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'ET', countryName: 'Ethiopia', emergencyNumber: '907', emergencyNote: '911 police, 907 ambulance; varies regionally', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'EG', countryName: 'Egypt', emergencyNumber: '123', emergencyNote: '122 police, 123 ambulance', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
    { iso2: 'MA', countryName: 'Morocco', emergencyNumber: '15', emergencyNote: '19 police, 15 ambulance (SAMU)', hasVerifiedHelplines: false, lastVerified: '2026-06-14' },
  ],
  helplines: [
    { countryIso2: 'US', name: '988 Suicide & Crisis Lifeline', description: 'National suicide and crisis line', callNumber: '988', textCapable: true, textNumber: '988', availability: '24/7', languages: 'English, Spanish (240+ via interpreter on calls)', sourceUrl: 'https://988lifeline.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'US', name: 'Crisis Text Line', description: 'Free 24/7 crisis text support', callNumber: null, textCapable: true, textNumber: '741741', availability: '24/7', languages: 'English', sourceUrl: 'https://www.crisistextline.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'CA', name: '9-8-8 Suicide Crisis Helpline', description: 'National suicide crisis helpline', callNumber: '988', textCapable: true, textNumber: '988', availability: '24/7', languages: 'English, French', sourceUrl: 'https://988.ca/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'MX', name: 'SAPTEL', description: 'Red Cross crisis counseling line', callNumber: '+52 55 5259 8121', textCapable: false, textNumber: null, availability: '24/7', languages: 'Spanish', sourceUrl: 'https://www.saptel.org.mx/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'MX', name: 'Linea de la Vida', description: 'Government addiction and crisis line', callNumber: '800 911 2000', textCapable: false, textNumber: null, availability: '24/7', languages: 'Spanish', sourceUrl: 'https://www.gob.mx/salud/conadic', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 2 },
    { countryIso2: 'GB', name: 'Samaritans', description: 'Round-the-clock emotional support line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.samaritans.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'GB', name: 'Shout', description: 'Free 24/7 crisis text line', callNumber: null, textCapable: true, textNumber: '85258', availability: '24/7', languages: 'English', sourceUrl: 'https://giveusashout.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'IE', name: 'Samaritans Ireland', description: 'Round-the-clock emotional support line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.samaritans.org/ireland/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'IE', name: 'Text About It (50808)', description: 'Free 24/7 crisis text line', callNumber: null, textCapable: true, textNumber: '50808', availability: '24/7', languages: 'English', sourceUrl: 'https://text50808.ie/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'FR', name: '3114', description: 'National suicide prevention line', callNumber: '3114', textCapable: false, textNumber: null, availability: '24/7', languages: 'French', sourceUrl: 'https://3114.fr/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'DE', name: 'Telefonseelsorge', description: 'Free round-the-clock counseling line', callNumber: '0800 111 0 111', textCapable: false, textNumber: null, availability: '24/7', languages: 'German', sourceUrl: 'https://www.telefonseelsorge.de/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ES', name: 'Linea 024', description: 'National suicidal behavior support line', callNumber: '024', textCapable: false, textNumber: null, availability: '24/7', languages: 'Spanish', sourceUrl: 'https://www.sanidad.gob.es/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ES', name: 'Telefono de la Esperanza', description: 'Emotional crisis support line', callNumber: '717 003 717', textCapable: false, textNumber: null, availability: '24/7', languages: 'Spanish', sourceUrl: 'https://telefonodelaesperanza.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'IT', name: 'Telefono Amico Italia', description: 'Emotional support phone line', callNumber: '02 2327 2327', textCapable: false, textNumber: null, availability: 'Daily, see site for hours', languages: 'Italian', sourceUrl: 'https://www.telefonoamico.it/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'NL', name: '113 Zelfmoordpreventie', description: 'National suicide prevention line', callNumber: '0800 0113', textCapable: false, textNumber: null, availability: '24/7', languages: 'Dutch', sourceUrl: 'https://www.113.nl/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'DK', name: 'Livslinien', description: 'Suicide prevention phone line', callNumber: '70 201 201', textCapable: false, textNumber: null, availability: '11am-4am daily', languages: 'Danish', sourceUrl: 'https://www.livslinien.dk/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'FI', name: 'MIELI Crisis Line', description: 'National crisis phone line', callNumber: '09 2525 0111', textCapable: false, textNumber: null, availability: '24/7', languages: 'Finnish (Swedish, Arabic, English lines)', sourceUrl: 'https://mieli.fi/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'IS', name: 'Red Cross Helpline 1717', description: 'Free emotional support line', callNumber: '1717', textCapable: false, textNumber: null, availability: '24/7', languages: 'Icelandic', sourceUrl: 'https://www.raudikrossinn.is/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'GR', name: 'Klimaka Suicide Line 1018', description: 'Suicide prevention phone line', callNumber: '1018', textCapable: false, textNumber: null, availability: '24/7', languages: 'Greek', sourceUrl: 'https://www.klimaka.org.gr/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'HR', name: 'Plavi Telefon', description: 'Emotional support phone line', callNumber: '01 4833 888', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Croatian', sourceUrl: 'https://plavi-telefon.hr/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CY', name: 'Cyprus Samaritans', description: 'Emotional support phone line', callNumber: '8000 7773', textCapable: false, textNumber: null, availability: '4pm-12am daily', languages: 'Greek, English', sourceUrl: 'https://www.cyprussamaritans.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CZ', name: 'Linka pomoci / adult line 116 123', description: 'Free emotional support line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'Czech', sourceUrl: 'https://linkapomoci.cz/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'EE', name: 'Hingehoiutelefon', description: 'Emotional support phone line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '4pm-12am daily', languages: 'Estonian, Russian, English', sourceUrl: 'https://www.eluliin.ee/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'HU', name: 'LESZ / 116 123', description: 'Free emotional crisis line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'Hungarian', sourceUrl: 'https://www.sos116123.hu/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'LT', name: 'Vilties Linija (Hope Line)', description: 'Emotional support phone line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'Lithuanian', sourceUrl: 'https://www.kpsc.lt/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'LV', name: 'Skalbes', description: 'Emotional support phone line', callNumber: '+371 67222922', textCapable: false, textNumber: null, availability: '24/7', languages: 'Latvian', sourceUrl: 'https://www.skalbes.lv/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'LU', name: 'SOS Detresse', description: 'Emotional distress support line', callNumber: '45 45 45', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Luxembourgish, French, German', sourceUrl: 'https://www.454545.lu/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'MT', name: 'Appogg Support Line 179', description: 'Free social support helpline', callNumber: '179', textCapable: false, textNumber: null, availability: '24/7', languages: 'Maltese, English', sourceUrl: 'https://fsws.gov.mt/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'NO', name: 'Mental Helse Hjelpetelefonen', description: 'Emotional support phone line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'Norwegian', sourceUrl: 'https://mentalhelse.no/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'SE', name: 'Mind Sjalvmordslinjen', description: 'Suicide prevention support line', callNumber: '90101', textCapable: false, textNumber: null, availability: '24/7', languages: 'Swedish', sourceUrl: 'https://mind.se/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CH', name: 'Die Dargebotene Hand', description: 'Emotional support phone line', callNumber: '143', textCapable: false, textNumber: null, availability: '24/7', languages: 'German, French, Italian', sourceUrl: 'https://www.143.ch/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'BE', name: 'Zelfmoordlijn 1813', description: 'Suicide prevention support line', callNumber: '1813', textCapable: false, textNumber: null, availability: '24/7', languages: 'Dutch', sourceUrl: 'https://www.zelfmoord1813.be/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'AT', name: 'Telefonseelsorge 142', description: 'Free emotional support line', callNumber: '142', textCapable: false, textNumber: null, availability: '24/7', languages: 'German', sourceUrl: 'https://www.telefonseelsorge.at/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'PT', name: 'SNS24', description: 'National health support line', callNumber: '808 24 24 24', textCapable: false, textNumber: null, availability: '24/7', languages: 'Portuguese', sourceUrl: 'https://www.sns24.gov.pt/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'PL', name: 'Crisis line 116 123', description: 'Emotional support phone line', callNumber: '116 123', textCapable: false, textNumber: null, availability: '24/7', languages: 'Polish', sourceUrl: 'https://liniawsparcia.pl/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'IN', name: 'KIRAN', description: 'Government mental health helpline', callNumber: '1800-599-0019', textCapable: false, textNumber: null, availability: '24/7', languages: '13 languages', sourceUrl: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=1652240', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'IN', name: 'Tele-MANAS', description: 'Government mental health helpline', callNumber: '14416', textCapable: false, textNumber: null, availability: '24/7', languages: 'Multiple Indian languages', sourceUrl: 'https://telemanas.mohfw.gov.in/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'IN', name: 'AASRA', description: 'Suicide prevention support line', callNumber: '+91 22 27546669', textCapable: false, textNumber: null, availability: '24/7', languages: 'English, Hindi', sourceUrl: 'http://www.aasra.info/', verificationStatus: 'verified', isInternational: false, displayOrder: 3 },
    { countryIso2: 'BD', name: 'Kaan Pete Roi', description: 'Free emotional support, by phone', callNumber: '09612119911', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Bengali, English', sourceUrl: 'https://findahelpline.com/countries/bd', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CN', name: 'Beijing Suicide Research & Prevention Center', description: 'WHO-affiliated crisis phone line', callNumber: '800 810 1117', textCapable: false, textNumber: null, availability: '24/7', languages: 'Mandarin', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CN', name: 'National mental health hotline 12356', description: 'New unified national support line', callNumber: '12356', textCapable: false, textNumber: null, availability: '24/7', languages: 'Mandarin', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 2 },
    { countryIso2: 'JP', name: 'Yorisoi Hotline', description: 'Free multilingual support line', callNumber: '0120-279-338', textCapable: false, textNumber: null, availability: '24/7', languages: 'Japanese, others (press 2)', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'JP', name: 'TELL Lifeline', description: 'English-language emotional support line', callNumber: '0800-300-8355', textCapable: false, textNumber: null, availability: 'See telljp.com for hours', languages: 'English', sourceUrl: 'https://telljp.com/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'KR', name: 'Lifeline Korea', description: 'Suicide prevention phone line', callNumber: '1588-9191', textCapable: false, textNumber: null, availability: '24/7', languages: 'Korean', sourceUrl: 'https://www.lifeline.or.kr/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'KR', name: 'Suicide Prevention Line 109', description: 'Unified suicide prevention line', callNumber: '109', textCapable: false, textNumber: null, availability: '24/7', languages: 'Korean', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 2 },
    { countryIso2: 'SG', name: 'Samaritans of Singapore (SOS)', description: 'National suicide prevention line', callNumber: '1767', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.sos.org.sg/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'MY', name: 'Befrienders KL', description: 'Emotional support phone line', callNumber: '03-76272929', textCapable: false, textNumber: null, availability: '24/7', languages: 'English, Malay', sourceUrl: 'https://www.befrienders.org.my/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'PH', name: 'NCMH Crisis Hotline', description: 'National mental health crisis line', callNumber: '1553', textCapable: false, textNumber: null, availability: '24/7', languages: 'Filipino, English', sourceUrl: 'https://ncmh.gov.ph/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'HK', name: 'The Samaritans Hong Kong', description: 'Multilingual emotional support line', callNumber: '2896 0000', textCapable: false, textNumber: null, availability: '24/7', languages: 'Multilingual', sourceUrl: 'https://samaritans.org.hk/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'IL', name: 'ERAN', description: 'Emotional first-aid support line', callNumber: '1201', textCapable: true, textNumber: '076-88444-00', availability: 'Call 24/7; SMS Sun-Fri 2pm-6pm', languages: 'Hebrew, Arabic, others', sourceUrl: 'https://www.eran.org.il/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'LB', name: 'Embrace Lifeline', description: 'National emotional support line', callNumber: '1564', textCapable: false, textNumber: null, availability: '24/7', languages: 'Arabic, English, French', sourceUrl: 'https://embracelebanon.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ID', name: 'Ministry of Health line 1500-567', description: 'Government health support line', callNumber: '1500-567', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Indonesian', sourceUrl: 'https://www.kemkes.go.id/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'TH', name: 'Department of Mental Health 1323', description: 'Government mental health line', callNumber: '1323', textCapable: false, textNumber: null, availability: '24/7', languages: 'Thai', sourceUrl: 'https://www.dmh.go.th/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'IR', name: 'Behzisti Social Emergency 123', description: 'Government social emergency line', callNumber: '123', textCapable: false, textNumber: null, availability: '24/7', languages: 'Persian', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'AE', name: 'National Mental Support Line', description: 'Free emotional support line', callNumber: '800-4673', textCapable: false, textNumber: null, availability: '8am-8pm', languages: 'Arabic, English', sourceUrl: 'https://hope.hw.gov.ae/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'SA', name: 'Ministry of Health Line 937', description: 'Government health support line', callNumber: '937', textCapable: false, textNumber: null, availability: '24/7', languages: 'Arabic, English', sourceUrl: 'https://www.moh.gov.sa/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'QA', name: 'National Mental Health Helpline', description: 'Hamad Medical crisis line', callNumber: '16000', textCapable: false, textNumber: null, availability: '24/7', languages: 'Arabic, English', sourceUrl: 'https://www.hamad.qa/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'JO', name: 'Families & Children helpline 110', description: 'Family and child support line', callNumber: '110', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Arabic', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'AU', name: 'Lifeline', description: 'National crisis support line', callNumber: '13 11 14', textCapable: true, textNumber: '0477 13 11 14', availability: '24/7', languages: 'English', sourceUrl: 'https://www.lifeline.org.au/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'AU', name: 'Beyond Blue', description: 'Mental health support line', callNumber: '1300 22 4636', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.beyondblue.org.au/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'AU', name: '13YARN', description: 'First Nations crisis support line', callNumber: '13 92 76', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.13yarn.org.au/', verificationStatus: 'verified', isInternational: false, displayOrder: 3 },
    { countryIso2: 'NZ', name: '1737 Need to Talk?', description: 'Free national support line', callNumber: '1737', textCapable: true, textNumber: '1737', availability: '24/7', languages: 'English', sourceUrl: 'https://1737.org.nz/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'NZ', name: 'Suicide Crisis Helpline', description: 'Suicide crisis support line', callNumber: '0508 828 865', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://mentalhealth.org.nz/helplines', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'FJ', name: 'Lifeline Fiji', description: 'Crisis counseling phone line', callNumber: '132454', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'English, Fijian', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'BR', name: 'Centro de Valorizacao da Vida (CVV)', description: 'National emotional support line', callNumber: '188', textCapable: false, textNumber: null, availability: '24/7', languages: 'Portuguese', sourceUrl: 'https://www.cvv.org.br/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'KY', name: 'CayMind Helpline', description: 'Local emotional support line', callNumber: '1-800-534-6463', textCapable: false, textNumber: null, availability: 'Mon-Fri 6-11pm', languages: 'English', sourceUrl: 'https://www.caymind.ky/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'GY', name: 'Inter-agency Suicide Prevention Helpline', description: 'National suicide prevention line', callNumber: '223-0001', textCapable: true, textNumber: '600-7896', availability: '24/7', languages: 'English', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'AR', name: 'Centro de Asistencia al Suicida', description: 'Suicide assistance phone line', callNumber: '135', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Spanish', sourceUrl: 'https://www.casbuenosaires.com.ar/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CL', name: 'Salud Responde', description: 'Government health support line', callNumber: '600 360 7777', textCapable: false, textNumber: null, availability: '24/7', languages: 'Spanish', sourceUrl: 'https://www.minsal.cl/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'CO', name: 'Linea 106', description: 'Emotional support phone line', callNumber: '106', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Spanish', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ZA', name: 'SADAG Suicide Crisis Line', description: 'National suicide crisis line', callNumber: '0800 567 567', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.sadag.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ZA', name: 'SADAG Mental Health Line', description: 'Mental health support line', callNumber: '011 234 4837', textCapable: false, textNumber: null, availability: '24/7', languages: 'English', sourceUrl: 'https://www.sadag.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'KE', name: 'one2one (LVCT Health)', description: 'Free toll-free support line', callNumber: '1190', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'English, Swahili', sourceUrl: 'https://lvcthealth.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'KE', name: 'Befrienders Kenya', description: 'Emotional support phone line', callNumber: '+254 722 178 177', textCapable: false, textNumber: null, availability: '24/7', languages: 'English, Swahili', sourceUrl: 'https://www.befrienderskenya.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'ZM', name: 'LifeLine/ChildLine Zambia', description: 'Free national support line', callNumber: '933', textCapable: true, textNumber: '933', availability: '24/7', languages: 'English, 7 local languages', sourceUrl: 'https://www.clzambia.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ZM', name: 'ChildLine Zambia', description: 'Free child and youth line', callNumber: '116', textCapable: true, textNumber: '116', availability: '24/7', languages: 'English, local languages', sourceUrl: 'https://www.clzambia.org/', verificationStatus: 'verified', isInternational: false, displayOrder: 2 },
    { countryIso2: 'BW', name: 'Lifeline Botswana (FTMTB)', description: 'Emotional support call and text', callNumber: '+267 75527590', textCapable: true, textNumber: '+267 73807492', availability: 'See site for hours', languages: 'English, Setswana', sourceUrl: 'https://findahelpline.com/countries/bw', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'UG', name: 'Mental Health Uganda', description: 'Free emotional support line', callNumber: '0800 21 21 21', textCapable: false, textNumber: null, availability: 'Mon-Fri 8:30am-5pm', languages: 'English, Luganda, Luo, Runyakitara', sourceUrl: 'https://findahelpline.com/', verificationStatus: 'verified', isInternational: false, displayOrder: 1 },
    { countryIso2: 'NG', name: 'Mentally Aware Nigeria Initiative (MANI)', description: 'Youth mental health support', callNumber: null, textCapable: false, textNumber: null, availability: '24/7 via stated channels', languages: 'English', sourceUrl: 'https://findahelpline.com/organizations/mentally-aware-nigeria-initiative-mani', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'NG', name: 'SURPIN', description: 'Suicide prevention initiative line', callNumber: '080 0078 7746', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'English, Hausa, Igbo, Yoruba', sourceUrl: 'https://businessday.ng/news/article/5-free-suicide-helplines-in-nigeria-that-could-save-a-life/', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 2 },
    { countryIso2: 'GH', name: 'Mental Health Authority psychosocial line', description: 'Government psychosocial support line', callNumber: '0800 678 678', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'English', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'RW', name: 'RBC Mental Health Line 114', description: 'Government mental health line', callNumber: '114', textCapable: false, textNumber: null, availability: 'See site for hours', languages: 'Kinyarwanda, English', sourceUrl: 'https://www.africa-press.net/rwanda/all-news/new-suicide-prevention-helpline-how-it-works', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'TZ', name: 'Afya general health line 199', description: 'Government health support line', callNumber: '199', textCapable: false, textNumber: null, availability: '24/7 (mainland)', languages: 'Swahili, English', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'ZW', name: 'Youth Advocates Helpline', description: 'Youth support call and text', callNumber: '393', textCapable: true, textNumber: '+263 777 469 107', availability: 'See site for hours', languages: 'English, Shona', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines', verificationStatus: 'needs_verification', isInternational: false, displayOrder: 1 },
    { countryIso2: 'EG', name: 'Befrienders Cairo (DEFUNCT)', description: 'DO NOT PUBLISH - numbers non-working', callNumber: '762 2381', textCapable: false, textNumber: null, availability: 'Reported non-working / shut c.2005', languages: 'Arabic', sourceUrl: 'https://egyptianstreets.com/2019/12/16/suicide-prevention-assistance-the-road-to-recovery-in-egypt/', verificationStatus: 'do_not_publish', isInternational: false, displayOrder: 1 },
    { countryIso2: 'MA', name: 'Sourire de Reda (DISSOLVED 2025)', description: 'DO NOT PUBLISH - org dissolved Feb 2025', callNumber: null, textCapable: false, textNumber: null, availability: 'Dissolved 20 February 2025', languages: 'Arabic, French', sourceUrl: 'https://medias24.com/2025/02/05/lassociation-sourire-de-reda-tire-sa-reverence-apres-16-ans-de-bons-et-loyaux-services/', verificationStatus: 'do_not_publish', isInternational: false, displayOrder: 1 },
  ],
};
