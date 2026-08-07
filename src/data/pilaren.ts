import type { Hoek } from '../types';

/**
 * Contentpilaren: de vaste verhouding waarin je post. Een tijdlijn die alleen
 * uit aanbiedingen bestaat brandt op — het publiek leert de post te negeren.
 * Door bewijs, uitleg en menselijke content ertussen te zetten blijft het
 * aanbod bijzonder op het moment dat je het wél brengt.
 */

export interface Pilaar {
  id: string;
  label: string;
  /** Aandeel in de contentkalender, in procenten. */
  aandeel: number;
  doel: string;
  hoeken: Hoek[];
  voorbeelden: string[];
  kleurAccent: string;
}

export const PILAREN: Pilaar[] = [
  {
    id: 'bewijs',
    label: 'Bewijs & resultaat',
    aandeel: 35,
    doel: 'Laten zien dat je het echt kunt. Dit is de content die leads oplevert zonder dat je iets hoeft te beloven.',
    hoeken: ['bewijs', 'resultaat'],
    voorbeelden: [
      'Een opgeleverd project in de regio',
      'Klantreactie letterlijk geciteerd',
      'Detailfoto van een strakke afwerking',
      'Jullie cijfers van dit jaar',
    ],
    kleurAccent: '#2E9E5B',
  },
  {
    id: 'aanbod',
    label: 'Aanbod & actie',
    aandeel: 20,
    doel: 'Direct om de aanvraag vragen. Werkt alleen als de andere pilaren het vertrouwen al hebben opgebouwd.',
    hoeken: ['aanbod', 'urgentie', 'seizoen'],
    voorbeelden: [
      'Lopende actie met einddatum',
      'Laatste plekken in de planning',
      'Gratis inmeetweek in een specifieke plaats',
    ],
    kleurAccent: '#FF6B1A',
  },
  {
    id: 'uitleg',
    label: 'Uitleg & advies',
    aandeel: 25,
    doel: 'Twijfel wegnemen en autoriteit opbouwen. Beantwoordt de vragen die mensen anders bij de concurrent stellen.',
    hoeken: ['educatie', 'vergelijking', 'vraag-antwoord', 'probleem-oplossing'],
    voorbeelden: [
      'HR++ of triple: wanneer is welk glas zinvol?',
      'Waarom je kozijnen niet in de winter hoeft te laten liggen',
      'Wat kost het eigenlijk — en waar zit dat verschil in?',
      '3 dingen die je moet vragen aan elke kozijnverkoper',
    ],
    kleurAccent: '#2F6FEB',
  },
  {
    id: 'mensen',
    label: 'Mensen & bedrijf',
    aandeel: 20,
    doel: 'Van een logo naar een groep mensen die je vertrouwt. Dit is wat je onderscheidt van een landelijke ketenpartij.',
    hoeken: ['achter-de-schermen'],
    voorbeelden: [
      'Het team op locatie, koffie om 7 uur',
      'Nieuwe monteur stelt zich voor',
      'Hoe een inmeetafspraak er echt uitziet',
      'De bus die de straat in komt',
    ],
    kleurAccent: '#8B5CF6',
  },
];

export const pilaarById = (id: string): Pilaar => PILAREN.find((p) => p.id === id) ?? PILAREN[0];

export const pilaarVoorHoek = (hoek: Hoek): Pilaar =>
  PILAREN.find((p) => p.hoeken.includes(hoek)) ?? PILAREN[0];

export const HOEKEN: { id: Hoek; label: string; uitleg: string }[] = [
  { id: 'aanbod', label: 'Aanbod', uitleg: 'De actie of dienst centraal, met een duidelijke oproep.' },
  { id: 'resultaat', label: 'Resultaat', uitleg: 'Een opgeleverd project in beeld. Laat het werk voor zich spreken.' },
  { id: 'probleem-oplossing', label: 'Probleem → oplossing', uitleg: 'Benoem de ergernis, laat zien hoe het opgelost wordt.' },
  { id: 'bewijs', label: 'Bewijs', uitleg: 'Reviews, cijfers, keurmerken, opgeleverde projecten.' },
  { id: 'educatie', label: 'Uitleg', uitleg: 'Leer iets uit. Bouwt vertrouwen bij wie nog aan het oriënteren is.' },
  { id: 'achter-de-schermen', label: 'Achter de schermen', uitleg: 'Het team, de bus, de werkdag. Maakt je menselijk.' },
  { id: 'urgentie', label: 'Urgentie', uitleg: 'Reden om nú te reageren: einddatum, planning, seizoen.' },
  { id: 'vergelijking', label: 'Vergelijking', uitleg: 'Dit versus dat — kunststof vs hout, HR++ vs triple.' },
  { id: 'seizoen', label: 'Seizoen', uitleg: 'Haak aan op de tijd van het jaar: winterkou, voorjaarsklus, najaarsplanning.' },
  { id: 'vraag-antwoord', label: 'Vraag & antwoord', uitleg: 'Beantwoord letterlijk een vraag die klanten stellen.' },
];

/** Seizoensinvalshoeken zodat de kalender het hele jaar relevant blijft. */
export const SEIZOENSHAKEN: Record<number, { thema: string; hook: string }> = {
  1: { thema: 'Koudste maand', hook: 'Nu voel je precies waar je huis warmte verliest' },
  2: { thema: 'Stookkosten', hook: 'De rekening van januari is binnen — schrok je ook?' },
  3: { thema: 'Voorjaarsklus', hook: 'Voorjaar: het seizoen waarin je het eindelijk aanpakt' },
  4: { thema: 'Buiten leven', hook: 'Straks de tuindeuren open — staan die van jou nog goed?' },
  5: { thema: 'Licht & ruimte', hook: 'Meer daglicht binnen zonder te verbouwen' },
  6: { thema: 'Warmte weren', hook: 'Het is binnen niet te harden — dat kan anders' },
  7: { thema: 'Vakantieplanning', hook: 'Vakantie? Ideale week om je kozijnen te laten vervangen' },
  8: { thema: 'Vooruit plannen', hook: 'Wie nu boekt, zit vóór de winter warm' },
  9: { thema: 'Najaarsplanning', hook: 'De planning voor het najaar loopt vol' },
  10: { thema: 'Eerste kou', hook: 'Verwarming gaat aan — en het tocht nog steeds' },
  11: { thema: 'Winterklaar', hook: 'Laatste kans om je huis winterklaar te maken' },
  12: { thema: 'Jaarafsluiting', hook: 'Nieuw jaar, warm huis. Zet het nu in de planning' },
};
