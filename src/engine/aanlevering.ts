/**
 * Aanlevering: campagnes van buitenaf naar binnen halen.
 *
 * Hiermee kan iemand anders — een tekstschrijver, een bureau of een AI-assistent
 * — een set posts aanleveren die je hier in één keer inleest. Wat is aangeleverd
 * wint; alles wat ontbreekt vult de tekstmotor zelf aan. Zo kun je een pakket
 * met alleen koppen inlezen en toch complete posts met captions terugkrijgen.
 *
 * In teksten mag je plaatshouders gebruiken: {plaats}, {bedrijf}, {actie},
 * {garantie}, {score}, {aantal}, {telefoon}, {website}. Die worden bij het
 * inlezen ingevuld met de gegevens uit het merkprofiel, waardoor hetzelfde
 * pakket bij elk bedrijf klopt.
 */

import type { Campagne, Doel, Hoek, Idee, KanaalId, Merk, Post, Uitwerking } from '../types';
import { KANALEN } from '../data/kanalen';
import { DOELGROEPEN } from '../data/doelgroepen';
import { HOEKEN, pilaarVoorHoek } from '../data/pilaren';
import { SJABLONEN } from '../render/sjablonen';
import { werkIdeeUit } from './copy';
import { bouwVariabelen, vul } from './tekst';

export const PAKKET_TYPE = 'kozijn-marketing-pakket';

/** Eén aangeleverde post. Alleen "kop" is echt nodig. */
export interface AangeleverdeCampagne {
  naam?: string;
  kop: string;
  subkop?: string;
  badge?: string;
  punten?: string[];
  cta?: string;
  hoek?: string;
  doel?: string;
  doelgroep?: string;
  sjabloon?: string;
  kanalen?: string[];
  datum?: string;
  tijd?: string;
  captions?: Record<string, string>;
  hashtags?: string[];
  /** Wat er gefotografeerd of gefilmd moet worden. */
  beeldnotitie?: string;
  /** Neem de lopende actie mee in deze post. */
  actie?: boolean;
  /** Extra context voor de tekstmotor. */
  context?: string;
}

export interface Pakket {
  type?: string;
  versie?: number;
  campagnes: AangeleverdeCampagne[];
}

export interface LeesResultaat {
  campagnes: Campagne[];
  posts: Post[];
  meldingen: string[];
}

const isoDatum = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const nieuwId = (voorvoegsel: string) =>
  `${voorvoegsel}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Leest JSON die ook in een ```json-blok of met wat rommel eromheen mag staan. */
export function leesPakket(invoer: string): Pakket {
  let tekst = invoer.trim();

  const blok = tekst.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blok) tekst = blok[1].trim();

  // Een los object of een kale array is ook goed.
  const eerste = tekst.search(/[[{]/);
  if (eerste > 0) tekst = tekst.slice(eerste);

  let data: unknown;
  try {
    data = JSON.parse(tekst);
  } catch (fout) {
    throw new Error(
      `Dit is geen geldige JSON (${(fout as Error).message}). Plak het pakket precies zoals je het gekregen hebt.`,
    );
  }

  if (Array.isArray(data)) return { campagnes: data as AangeleverdeCampagne[] };
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.campagnes)) return obj as unknown as Pakket;
  if (typeof obj.kop === 'string') return { campagnes: [obj as unknown as AangeleverdeCampagne] };

  throw new Error('Er zit geen "campagnes"-lijst in dit pakket.');
}

/**
 * Zoekt vrije plekken in de agenda: dagen waarop nog niets gepland staat,
 * beginnend morgen. Zo botst aangeleverde content niet met de autopiloot.
 */
export function vrijeDatums(bestaand: Post[], aantal: number, startOffset = 1): string[] {
  const bezet = new Set(bestaand.map((p) => p.datum));
  const uit: string[] = [];
  const dag = new Date();
  dag.setHours(0, 0, 0, 0);
  dag.setDate(dag.getDate() + startOffset);

  // Weekenden slaan we over: op ma t/m vr wordt er het meest gereageerd.
  for (let i = 0; uit.length < aantal && i < 400; i++) {
    const kandidaat = isoDatum(dag);
    const weekdag = dag.getDay();
    if (!bezet.has(kandidaat) && weekdag !== 0 && weekdag !== 6) {
      uit.push(kandidaat);
      bezet.add(kandidaat);
    }
    dag.setDate(dag.getDate() + 1);
  }
  return uit;
}

const geldigeHoek = (waarde: string | undefined): Hoek =>
  (HOEKEN.find((h) => h.id === waarde)?.id ?? 'resultaat') as Hoek;

const geldigDoel = (waarde: string | undefined): Doel => {
  const doelen: Doel[] = ['offerteaanvraag', 'bellen', 'whatsapp', 'bereik', 'volgers', 'vertrouwen'];
  return doelen.includes(waarde as Doel) ? (waarde as Doel) : 'offerteaanvraag';
};

const geldigeKanalen = (waarde: string[] | undefined): KanaalId[] => {
  const geldig = (waarde ?? []).filter((k) => KANALEN.some((kanaal) => kanaal.id === k)) as KanaalId[];
  return geldig.length ? geldig : (['instagram-feed', 'facebook-feed'] as KanaalId[]);
};

/** Zet een aangeleverd pakket om in campagnes en ingeplande posts. */
export function verwerkPakket(
  pakket: Pakket,
  merk: Merk,
  bestaandePosts: Post[],
  opties: { status: Post['status'] } = { status: 'concept' },
): LeesResultaat {
  const meldingen: string[] = [];
  const campagnes: Campagne[] = [];
  const posts: Post[] = [];

  const actieveActie = merk.acties.find((a) => a.actief) ?? null;
  const v = bouwVariabelen(merk, actieveActie?.claim ?? '', actieveActie?.waarop ?? '');

  const zonderDatum = pakket.campagnes.filter((c) => !c.datum).length;
  const vrij = vrijeDatums(bestaandePosts, zonderDatum);
  let vrijIndex = 0;

  pakket.campagnes.forEach((aangeleverd, i) => {
    if (!aangeleverd?.kop?.trim()) {
      meldingen.push(`Post ${i + 1} is overgeslagen: er staat geen "kop" in.`);
      return;
    }

    if (aangeleverd.hoek && !HOEKEN.some((h) => h.id === aangeleverd.hoek)) {
      meldingen.push(`Post ${i + 1}: invalshoek "${aangeleverd.hoek}" bestaat niet, "resultaat" gebruikt.`);
    }
    if (aangeleverd.sjabloon && !SJABLONEN.some((s) => s.id === aangeleverd.sjabloon)) {
      meldingen.push(`Post ${i + 1}: sjabloon "${aangeleverd.sjabloon}" bestaat niet, standaard gebruikt.`);
    }
    if (aangeleverd.actie && !actieveActie) {
      meldingen.push(`Post ${i + 1}: er is om de actie gevraagd, maar er staat geen actie aan bij Merk & aanbod.`);
    }

    const hoek = geldigeHoek(aangeleverd.hoek);
    const doelgroepId = DOELGROEPEN.some((d) => d.id === aangeleverd.doelgroep)
      ? (aangeleverd.doelgroep as string)
      : 'breed';
    const sjabloonId = SJABLONEN.some((s) => s.id === aangeleverd.sjabloon)
      ? (aangeleverd.sjabloon as string)
      : (SJABLONEN.find((s) => s.hoeken.includes(hoek))?.id ?? 'beeld-kader');

    const kanalen = geldigeKanalen(aangeleverd.kanalen);

    const idee: Idee = {
      tekst: vul(aangeleverd.naam ?? aangeleverd.kop, v),
      doel: geldigDoel(aangeleverd.doel),
      hoek,
      doelgroepId,
      actieId: aangeleverd.actie && actieveActie ? actieveActie.id : '',
      kanalen,
      sjabloonId,
      context: vul(aangeleverd.context ?? '', v),
    };

    const seed = Math.floor(Math.random() * 1e9);
    const basis = werkIdeeUit(idee, merk, seed);

    // Alleen wat is aangeleverd overschrijft de gegenereerde tekst.
    const aangepast: Partial<Uitwerking> = {};
    aangepast.kop = vul(aangeleverd.kop, v);
    if (aangeleverd.subkop !== undefined) aangepast.subkop = vul(aangeleverd.subkop, v);
    if (aangeleverd.badge !== undefined) aangepast.badge = vul(aangeleverd.badge, v);
    if (aangeleverd.punten?.length) aangepast.bullets = aangeleverd.punten.map((p) => vul(p, v));
    if (aangeleverd.cta) aangepast.cta = vul(aangeleverd.cta, v);
    if (aangeleverd.hashtags?.length) aangepast.hashtags = aangeleverd.hashtags;
    if (aangeleverd.captions) {
      const captions = { ...basis.captions };
      for (const [kanaal, tekst] of Object.entries(aangeleverd.captions)) {
        if (KANALEN.some((k) => k.id === kanaal)) captions[kanaal as KanaalId] = vul(tekst, v);
        else meldingen.push(`Post ${i + 1}: caption voor onbekend kanaal "${kanaal}" genegeerd.`);
      }
      aangepast.captions = captions;
    }

    const id = nieuwId('c');
    campagnes.push({
      id,
      naam: vul(aangeleverd.naam ?? aangeleverd.kop, v),
      idee,
      uitwerking: basis,
      aangepast,
      aangemaakt: Date.now(),
      gewijzigd: Date.now(),
      seed,
    });

    const datum = aangeleverd.datum || vrij[vrijIndex++] || isoDatum(new Date());
    const tijd = aangeleverd.tijd || '12:00';

    for (const kanaal of kanalen) {
      posts.push({
        id: nieuwId('p'),
        campagneId: id,
        kanaal,
        datum,
        tijd,
        status: opties.status,
        pilaar: pilaarVoorHoek(hoek).id,
        notitie: aangeleverd.beeldnotitie ?? '',
      });
    }
  });

  return { campagnes, posts, meldingen };
}

/* ------------------------------------------------------------- uitleveren */

/** Zet bestaande campagnes om naar het aanleverformaat, om ze te laten bewerken. */
export function maakPakket(campagnes: Campagne[], posts: Post[]): Pakket {
  return {
    type: PAKKET_TYPE,
    versie: 1,
    campagnes: campagnes.map((c) => {
      const u = { ...c.uitwerking, ...c.aangepast };
      const post = posts.find((p) => p.campagneId === c.id);
      return {
        naam: c.naam,
        kop: u.kop,
        subkop: u.subkop,
        badge: u.badge,
        punten: u.bullets,
        cta: u.cta,
        hoek: c.idee.hoek,
        doel: c.idee.doel,
        doelgroep: c.idee.doelgroepId,
        sjabloon: c.idee.sjabloonId,
        kanalen: c.idee.kanalen,
        datum: post?.datum,
        tijd: post?.tijd,
        captions: u.captions as Record<string, string>,
        beeldnotitie: post?.notitie,
        actie: Boolean(c.idee.actieId),
      };
    }),
  };
}

/**
 * Korte briefing van het merk en de planning. Die stuur je mee als je iemand
 * vraagt content voor je te schrijven — dan klopt de toon en de context meteen.
 */
export function maakBriefing(merk: Merk, posts: Post[]): string {
  const actie = merk.acties.find((a) => a.actief);
  const komend = posts.filter((p) => p.status !== 'gepubliceerd').length;

  return [
    '# Briefing',
    '',
    `Bedrijf: ${merk.bedrijfsnaam}`,
    merk.slogan ? `Slogan: ${merk.slogan}` : '',
    merk.werkgebied.length ? `Werkgebied: ${merk.werkgebied.join(', ')}` : 'Werkgebied: nog niet ingevuld',
    `Contact: ${[merk.telefoon, merk.website, merk.whatsapp].filter(Boolean).join(' · ') || 'nog niet ingevuld'}`,
    `Toon: ${merk.toon}`,
    merk.bewijs.reviewScore ? `Beoordeling: ${merk.bewijs.reviewScore} uit ${merk.bewijs.reviewAantal}` : '',
    merk.bewijs.garantieJaren ? `Garantie: ${merk.bewijs.garantieJaren} jaar` : '',
    merk.bewijs.usps.length ? `Sterkste punten: ${merk.bewijs.usps.join(' | ')}` : '',
    actie ? `Lopende actie: ${actie.claim} ${actie.waarop} (t/m ${actie.geldigTot || 'geen einddatum'})` : 'Lopende actie: geen',
    merk.verbodenWoorden.length ? `Niet gebruiken: ${merk.verbodenWoorden.join(', ')}` : '',
    '',
    `Er staan nu ${komend} posts open in de planning.`,
    '',
    '# Wat ik terug wil',
    '',
    'Een JSON-pakket in dit formaat (plaatshouders {plaats}, {actie}, {garantie} mogen erin):',
    '',
    '```json',
    JSON.stringify(
      {
        type: PAKKET_TYPE,
        versie: 1,
        campagnes: [
          {
            naam: 'Korte werknaam',
            hoek: HOEKEN.map((h) => h.id).join(' | '),
            doel: 'offerteaanvraag | bellen | whatsapp | bereik | volgers | vertrouwen',
            doelgroep: DOELGROEPEN.map((d) => d.id).join(' | '),
            sjabloon: SJABLONEN.map((s) => s.id).join(' | '),
            kanalen: KANALEN.map((k) => k.id),
            kop: 'Maximaal 6 woorden, komt groot op het beeld',
            subkop: 'Eén regel eronder',
            badge: 'Klein label, bijv. {plaats}',
            punten: ['Kort punt', 'Nog een punt'],
            cta: 'Vraag je prijs op',
            captions: { 'instagram-feed': 'Volledige caption met witregels' },
            beeldnotitie: 'Wat er gefotografeerd moet worden',
            actie: false,
            datum: 'yyyy-mm-dd (mag weg, dan plant het systeem zelf)',
            tijd: '12:00',
          },
        ],
      },
      null,
      2,
    ),
    '```',
  ]
    .filter((r) => r !== '')
    .join('\n');
}
