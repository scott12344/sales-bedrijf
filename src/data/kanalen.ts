import type { FormaatId, KanaalId } from '../types';

export interface Formaat {
  id: FormaatId;
  label: string;
  breedte: number;
  hoogte: number;
  /** Veilige marges in pixels: hierbinnen valt niets weg achter de interface van het platform. */
  veilig: { boven: number; onder: number; links: number; rechts: number };
}

export const FORMATEN: Record<FormaatId, Formaat> = {
  vierkant: {
    id: 'vierkant',
    label: 'Vierkant 1:1',
    breedte: 1080,
    hoogte: 1080,
    veilig: { boven: 60, onder: 60, links: 60, rechts: 60 },
  },
  portret: {
    id: 'portret',
    label: 'Portret 4:5',
    breedte: 1080,
    hoogte: 1350,
    veilig: { boven: 70, onder: 90, links: 70, rechts: 70 },
  },
  verticaal: {
    id: 'verticaal',
    label: 'Verticaal 9:16',
    breedte: 1080,
    hoogte: 1920,
    // Bovenin staat de profielbalk, onderin de knoppen van Reels/TikTok.
    veilig: { boven: 260, onder: 420, links: 80, rechts: 180 },
  },
  liggend: {
    id: 'liggend',
    label: 'Liggend 1.91:1',
    breedte: 1200,
    hoogte: 628,
    veilig: { boven: 50, onder: 50, links: 60, rechts: 60 },
  },
  'a5-staand': {
    id: 'a5-staand',
    label: 'A5 flyer (300 dpi)',
    breedte: 1748,
    hoogte: 2480,
    // 5 mm afloop plus 10 mm binnenmarge, omgerekend naar pixels bij 300 dpi.
    veilig: { boven: 180, onder: 180, links: 180, rechts: 180 },
  },
  'bord-liggend': {
    id: 'bord-liggend',
    label: 'Bouwbord 2:1',
    breedte: 2400,
    hoogte: 1200,
    veilig: { boven: 100, onder: 100, links: 120, rechts: 120 },
  },
};

export interface Kanaal {
  id: KanaalId;
  label: string;
  groep: 'online' | 'advertentie' | 'offline';
  platform: 'instagram' | 'facebook' | 'tiktok' | 'meta' | 'print' | 'direct';
  formaat: FormaatId;
  /** Praktische limiet voor de caption; niet altijd de harde limiet van het platform. */
  maxTekens: number;
  hashtags: number;
  /** Aanbevolen posttijden op een doordeweekse dag. */
  tijden: string[];
  /** Hoe de tekst zich hoort te gedragen op dit kanaal. */
  stijl: string;
  klikbareLink: boolean;
}

export const KANALEN: Kanaal[] = [
  {
    id: 'instagram-feed',
    label: 'Instagram feed',
    groep: 'online',
    platform: 'instagram',
    formaat: 'portret',
    maxTekens: 2200,
    hashtags: 12,
    tijden: ['12:00', '19:30'],
    stijl:
      'Eerste zin is de hook — alles daarna staat achter "meer". Korte alinea\'s, witregels, één duidelijke oproep. Link in bio.',
    klikbareLink: false,
  },
  {
    id: 'instagram-story',
    label: 'Instagram story',
    groep: 'online',
    platform: 'instagram',
    formaat: 'verticaal',
    maxTekens: 120,
    hashtags: 2,
    tijden: ['08:30', '17:00', '21:00'],
    stijl: 'Eén boodschap per scherm, dikke tekst, sticker met vraag of link. Reageert op tempo, niet op diepgang.',
    klikbareLink: true,
  },
  {
    id: 'instagram-reel',
    label: 'Instagram reel',
    groep: 'online',
    platform: 'instagram',
    formaat: 'verticaal',
    maxTekens: 900,
    hashtags: 8,
    tijden: ['12:30', '20:00'],
    stijl: 'Hook in de eerste 2 seconden, tekst op beeld, ondertiteling altijd aan. Caption ondersteunt, verklapt niet.',
    klikbareLink: false,
  },
  {
    id: 'facebook-feed',
    label: 'Facebook feed',
    groep: 'online',
    platform: 'facebook',
    formaat: 'vierkant',
    maxTekens: 1200,
    hashtags: 3,
    tijden: ['09:00', '13:00', '19:00'],
    stijl:
      'Publiek is ouder en leest langer. Noem de plaats, schrijf als mens, en zet de telefoonnummer/link er letterlijk bij.',
    klikbareLink: true,
  },
  {
    id: 'facebook-story',
    label: 'Facebook story',
    groep: 'online',
    platform: 'facebook',
    formaat: 'verticaal',
    maxTekens: 120,
    hashtags: 0,
    tijden: ['08:30', '18:30'],
    stijl: 'Zelfde beeld als de Instagram story, dezelfde korte boodschap.',
    klikbareLink: true,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    groep: 'online',
    platform: 'tiktok',
    formaat: 'verticaal',
    maxTekens: 2200,
    hashtags: 6,
    tijden: ['12:00', '18:00', '21:30'],
    stijl:
      'Rauw en echt wint van glad. Praat tegen de camera, laat het werk zien, geen bedrijfstaal. Hook binnen 1,5 seconde.',
    klikbareLink: false,
  },
  {
    id: 'meta-ads',
    label: 'Meta advertentie',
    groep: 'advertentie',
    platform: 'meta',
    formaat: 'vierkant',
    maxTekens: 500,
    hashtags: 0,
    tijden: ['—'],
    stijl:
      'Kop max 40 tekens, primaire tekst met de eerste 125 tekens als dragende boodschap, één helder voordeel en één CTA-knop.',
    klikbareLink: true,
  },
  {
    id: 'flyer-a5',
    label: 'Flyer A5',
    groep: 'offline',
    platform: 'print',
    formaat: 'a5-staand',
    maxTekens: 600,
    hashtags: 0,
    tijden: ['—'],
    stijl: 'Van 2 meter afstand leesbaar: één kop, één aanbod, één actie. Telefoonnummer groot.',
    klikbareLink: false,
  },
  {
    id: 'bouwbord',
    label: 'Bouwbord / banner',
    groep: 'offline',
    platform: 'print',
    formaat: 'bord-liggend',
    maxTekens: 120,
    hashtags: 0,
    tijden: ['—'],
    stijl: 'Maximaal 6 woorden kop en een telefoonnummer dat je vanuit een rijdende auto leest.',
    klikbareLink: false,
  },
  {
    id: 'email',
    label: 'E-mail',
    groep: 'offline',
    platform: 'direct',
    formaat: 'liggend',
    maxTekens: 1500,
    hashtags: 0,
    tijden: ['08:00', '16:00'],
    stijl: 'Onderwerpregel bepaalt of hij geopend wordt. Persoonlijk, kort, één link.',
    klikbareLink: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    groep: 'offline',
    platform: 'direct',
    formaat: 'vierkant',
    maxTekens: 400,
    hashtags: 0,
    tijden: ['10:00', '15:00'],
    stijl: 'Alsof je het typt aan één persoon. Geen marketingtaal, wel een concrete vraag aan het eind.',
    klikbareLink: true,
  },
];

export const kanaalById = (id: KanaalId): Kanaal => KANALEN.find((k) => k.id === id) ?? KANALEN[0];
export const formaatVan = (id: KanaalId): Formaat => FORMATEN[kanaalById(id).formaat];
