/** Datamodel van het marketingplatform. */

export type ID = string;

/* ------------------------------------------------------------------ merk */

export type ToneOfVoice = 'direct' | 'vertrouwd' | 'premium' | 'nuchter';

export interface Kleurenschema {
  primair: string;
  primairDonker: string;
  accent: string;
  /** Kleur van tekst op een lichte ondergrond. */
  tekst: string;
  tekstZacht: string;
  achtergrond: string;
  vlak: string;
  /** Kleur van tekst op de primaire/accentkleur. */
  opPrimair: string;
  opAccent: string;
}

export interface Typografie {
  kopFont: string;
  tekstFont: string;
  kopHoofdletters: boolean;
  /** Letterafstand van koppen, in em. Negatief = strakker. */
  kopSpatiering: number;
}

export interface Bewijs {
  jaarOpgericht: string;
  projectenPerJaar: string;
  reviewScore: string;
  reviewAantal: string;
  garantieJaren: string;
  keurmerken: string[];
  usps: string[];
}

export type ActieType =
  | 'korting'
  | 'cadeau'
  | 'financiering'
  | 'subsidie'
  | 'geen-kosten'
  | 'gratis-extra'
  | 'geen';

export interface Actie {
  id: ID;
  naam: string;
  type: ActieType;
  /** De claim zoals hij op het beeld komt, bijv. "50% KORTING". */
  claim: string;
  /** Waarop de actie geldt, bijv. "op de montage bij een complete woning". */
  waarop: string;
  voorwaarden: string;
  geldigVan: string;
  geldigTot: string;
  /** Bevestiging dat de referentieprijs de laagste prijs van de laatste 30 dagen is. */
  referentieprijsGetoetst: boolean;
  /** Onderbouwing die je kunt tonen als de ACM of een klant ernaar vraagt. */
  onderbouwing: string;
  actief: boolean;
}

export interface Merk {
  bedrijfsnaam: string;
  slogan: string;
  telefoon: string;
  whatsapp: string;
  website: string;
  email: string;
  werkgebied: string[];
  logoMediaId?: ID;
  kleuren: Kleurenschema;
  typografie: Typografie;
  toon: ToneOfVoice;
  bewijs: Bewijs;
  acties: Actie[];
  /** Woorden die nooit in content mogen voorkomen. */
  verbodenWoorden: string[];
}

/* --------------------------------------------------------------- kanalen */

export type KanaalId =
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-reel'
  | 'facebook-feed'
  | 'facebook-story'
  | 'tiktok'
  | 'meta-ads'
  | 'flyer-a5'
  | 'bouwbord'
  | 'email'
  | 'whatsapp';

export type FormaatId =
  | 'vierkant'
  | 'portret'
  | 'verticaal'
  | 'liggend'
  | 'a5-staand'
  | 'bord-liggend';

/* -------------------------------------------------------------- campagne */

export type Doel = 'offerteaanvraag' | 'bellen' | 'whatsapp' | 'bereik' | 'volgers' | 'vertrouwen';

export type Hoek =
  | 'aanbod'
  | 'resultaat'
  | 'probleem-oplossing'
  | 'bewijs'
  | 'educatie'
  | 'achter-de-schermen'
  | 'urgentie'
  | 'vergelijking'
  | 'seizoen'
  | 'vraag-antwoord';

export interface Idee {
  tekst: string;
  doel: Doel;
  hoek: Hoek;
  doelgroepId: string;
  actieId: ID | '';
  kanalen: KanaalId[];
  sjabloonId: string;
  /** Het beeld bij deze post. */
  mediaId?: ID;
  /** Vrije notitie van de gebruiker die de motor meeneemt. */
  context: string;
}

export interface AdVariant {
  kop: string;
  tekst: string;
  beschrijving: string;
  cta: string;
  koopreden: string;
  doelgroep: string;
}

export interface VideoScene {
  van: number;
  tot: number;
  beeld: string;
  tekstOpBeeld: string;
  voiceover: string;
}

export interface Uitwerking {
  badge: string;
  kop: string;
  subkop: string;
  bullets: string[];
  cta: string;
  ctaSub: string;
  /** Caption per kanaal. */
  captions: Partial<Record<KanaalId, string>>;
  hashtags: string[];
  koopredenen: string[];
  advarianten: AdVariant[];
  video: { hook: string; scenes: VideoScene[]; muziek: string; lengte: number };
  offline: { flyerKop: string; flyerTekst: string; bordTekst: string; emailOnderwerp: string; emailTekst: string; whatsapp: string };
}

export interface Campagne {
  id: ID;
  naam: string;
  idee: Idee;
  uitwerking: Uitwerking;
  /** Handmatige overschrijvingen op de gegenereerde uitwerking. */
  aangepast: Partial<Uitwerking>;
  aangemaakt: number;
  gewijzigd: number;
  seed: number;
}

/* ------------------------------------------------------------------ post */

export type PostStatus = 'concept' | 'gepland' | 'goedgekeurd' | 'gepubliceerd' | 'mislukt';

export interface Post {
  id: ID;
  campagneId: ID;
  kanaal: KanaalId;
  /** ISO-datum yyyy-mm-dd. */
  datum: string;
  tijd: string;
  status: PostStatus;
  /** Pilaar uit de contentmix, voor de balans in de kalender. */
  pilaar: string;
  notitie: string;
  resultaat?: { bereik: number; interacties: number; leads: number };
  gepubliceerdOp?: number;
  fout?: string;
}

/* ----------------------------------------------------------------- media */

export interface MediaRecord {
  id: ID;
  blob: Blob;
  naam: string;
  breedte: number;
  hoogte: number;
  soort: 'project' | 'sfeer' | 'detail' | 'team' | 'review' | 'logo';
  gemaakt: number;
  tags: string[];
}

/* ------------------------------------------------------------ koppeling */

export type KoppelingType = 'meta' | 'tiktok' | 'webhook' | 'handmatig';

export interface Koppeling {
  id: ID;
  type: KoppelingType;
  naam: string;
  actief: boolean;
  /** Kanalen die via deze koppeling gepubliceerd worden. */
  kanalen: KanaalId[];
  /** Endpoint voor webhook-koppelingen (Make, Zapier, eigen server). */
  webhookUrl: string;
  /** Alleen ingevuld bij een eigen publicatieserver. */
  apiBasis: string;
  /** Statusnotitie, bijv. waar de app-review op staat. */
  status: string;
}

/* --------------------------------------------------------------- systeem */

export interface Autopiloot {
  /** Vult de kalender zelf bij zodra er te weinig gepland staat. */
  aan: boolean;
  /** Hoeveel weken de planning vooruit moet lopen. */
  wekenVooruit: number;
  /** Onder dit aantal openstaande posts wordt er bijgevuld. */
  ondergrens: number;
  /** Nieuwe posts meteen op goedgekeurd zetten in plaats van ter goedkeuring. */
  directGoedkeuren: boolean;
  /** Wanneer er voor het laatst automatisch is bijgevuld. */
  laatsteAanvulling: number;
}

export interface Instellingen {
  /** Aantal posts per week dat het ritme aanhoudt. */
  postsPerWeek: number;
  actieveKanalen: KanaalId[];
  /** Verdeling over de contentpilaren, in procenten. */
  mix: Record<string, number>;
  startDag: number;
  autopiloot: Autopiloot;
}

export interface AppState {
  merk: Merk;
  campagnes: Campagne[];
  posts: Post[];
  koppelingen: Koppeling[];
  instellingen: Instellingen;
  versie: number;
}
