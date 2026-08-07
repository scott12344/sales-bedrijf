import type { Kleurenschema, Merk } from '../types';

/**
 * Kleurpaletten. Het uitgangspunt voor deze branche: een diepe, betrouwbare
 * basiskleur met één warme accentkleur die de aandacht naar het aanbod en de
 * knop trekt. Elk palet is getest op leesbaar contrast van witte tekst op de
 * primaire kleur en donkere tekst op het accent.
 */
export interface Palet {
  id: string;
  naam: string;
  omschrijving: string;
  kleuren: Kleurenschema;
}

export const PALETTEN: Palet[] = [
  {
    id: 'nachtblauw-oranje',
    naam: 'Nachtblauw & oranje',
    omschrijving:
      'Vertrouwd en vakkundig, met een accent dat op elke tijdlijn opvalt. De veilige keuze voor bouw en verduurzaming.',
    kleuren: {
      primair: '#0F2A47',
      primairDonker: '#081A2E',
      accent: '#FF6B1A',
      tekst: '#0F1B26',
      tekstZacht: '#5A6B7A',
      achtergrond: '#FFFFFF',
      vlak: '#F1F5F9',
      opPrimair: '#FFFFFF',
      opAccent: '#1A0C00',
    },
  },
  {
    id: 'antraciet-geel',
    naam: 'Antraciet & signaalgeel',
    omschrijving:
      'Modern en scherp. Antraciet is de populairste kozijnkleur van dit moment; het geel maakt aanbiedingen onontkoombaar.',
    kleuren: {
      primair: '#22282C',
      primairDonker: '#14181B',
      accent: '#FFC61A',
      tekst: '#14181B',
      tekstZacht: '#616B72',
      achtergrond: '#FFFFFF',
      vlak: '#F2F4F5',
      opPrimair: '#FFFFFF',
      opAccent: '#1B1400',
    },
  },
  {
    id: 'bosgroen-koper',
    naam: 'Bosgroen & koper',
    omschrijving: 'Duurzaam en hoogwaardig. Past bij verduurzaming, subsidie en een wat welvarender doelgroep.',
    kleuren: {
      primair: '#14332A',
      primairDonker: '#0B211B',
      accent: '#C9803A',
      tekst: '#122019',
      tekstZacht: '#57685F',
      achtergrond: '#FFFFFF',
      vlak: '#F0F4F1',
      opPrimair: '#FFFFFF',
      opAccent: '#1A0F04',
    },
  },
  {
    id: 'diepblauw-limoen',
    naam: 'Diepblauw & limoen',
    omschrijving: 'Fris en jong. Werkt goed op TikTok en Reels, richting starters en jonge gezinnen.',
    kleuren: {
      primair: '#132B5C',
      primairDonker: '#0A1A3C',
      accent: '#B6F02A',
      tekst: '#101828',
      tekstZacht: '#5B667E',
      achtergrond: '#FFFFFF',
      vlak: '#F2F5FB',
      opPrimair: '#FFFFFF',
      opAccent: '#141C00',
    },
  },
  {
    id: 'bordeaux-zand',
    naam: 'Bordeaux & zand',
    omschrijving: 'Warm en gevestigd. Onderscheidt zich juist doordat vrijwel geen enkele concurrent deze kleur voert.',
    kleuren: {
      primair: '#5A1220',
      primairDonker: '#3B0B15',
      accent: '#E8C39E',
      tekst: '#221016',
      tekstZacht: '#6E5A5F',
      achtergrond: '#FFFFFF',
      vlak: '#F7F2EE',
      opPrimair: '#FFFFFF',
      opAccent: '#2A1206',
    },
  },
];

/**
 * Lettertypefamilies. Bewust alleen stacks die op Windows, macOS, iOS en
 * Android al aanwezig zijn — het systeem werkt offline en mag niets ophalen.
 */
export const LETTERTYPEN: { id: string; label: string; stack: string; omschrijving: string }[] = [
  {
    id: 'systeem',
    label: 'Modern (systeem)',
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    omschrijving: 'Strak en neutraal. Leest overal goed en veroudert niet.',
  },
  {
    id: 'impact',
    label: 'Vet & luid',
    stack: '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif',
    omschrijving: 'Zware koppen die op een tijdlijn schreeuwen. Sterk voor kortingen en acties.',
  },
  {
    id: 'grotesk',
    label: 'Zakelijk breed',
    stack: '"Trebuchet MS", "Segoe UI", Verdana, system-ui, sans-serif',
    omschrijving: 'Iets vriendelijker en breder. Goed leesbaar voor een ouder publiek.',
  },
  {
    id: 'serif',
    label: 'Klassiek (serif)',
    stack: 'Georgia, "Times New Roman", serif',
    omschrijving: 'Gevestigd en hoogwaardig. Past bij premium en bij monumentale panden.',
  },
];

export const lettertypeStack = (id: string): string =>
  LETTERTYPEN.find((l) => l.id === id)?.stack ?? LETTERTYPEN[0].stack;

/** Startprofiel. Alles is in de app aan te passen; dit is het vertrekpunt. */
export function standaardMerk(): Merk {
  return {
    bedrijfsnaam: 'Jouw Kozijnbedrijf',
    slogan: 'Kozijnen die je huis warm, stil en onderhoudsvrij maken',
    telefoon: '',
    whatsapp: '',
    website: '',
    email: '',
    werkgebied: [],
    kleuren: { ...PALETTEN[0].kleuren },
    typografie: {
      kopFont: 'impact',
      tekstFont: 'systeem',
      kopHoofdletters: true,
      kopSpatiering: -0.02,
    },
    toon: 'direct',
    bewijs: {
      jaarOpgericht: '',
      projectenPerJaar: '',
      reviewScore: '',
      reviewAantal: '',
      garantieJaren: '10',
      keurmerken: [],
      usps: [
        'Gratis inmeten en advies aan huis',
        'Eigen vaste monteurs',
        'Vaste prijs, alles inclusief',
        'Oude kozijnen worden afgevoerd',
      ],
    },
    acties: [
      {
        id: 'actie-start',
        naam: 'Voorbeeldactie',
        type: 'korting',
        claim: '50% KORTING',
        waarop: 'op de montage bij een complete woning',
        voorwaarden: 'Bij opdracht van minimaal 6 elementen. Niet in combinatie met andere acties.',
        geldigVan: '',
        geldigTot: '',
        referentieprijsGetoetst: false,
        onderbouwing: '',
        actief: false,
      },
    ],
    verbodenWoorden: ['gratis geld', 'goedkoopste van Nederland', 'nu of nooit'],
  };
}
