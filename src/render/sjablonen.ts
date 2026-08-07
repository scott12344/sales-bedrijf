/**
 * Beeldsjablonen. Elk sjabloon is één functie die op het canvas tekent en die
 * zich aanpast aan het formaat: hetzelfde ontwerp werkt op een vierkante feed,
 * een verticale story en een A5-flyer, zonder dat er tekst wegvalt.
 *
 * De opbouw gaat van onder naar boven. Eerst wordt gemeten hoeveel ruimte de
 * merkbalk, de knop en de kop nodig hebben; wat overblijft is voor het beeld.
 * Daardoor kan tekst nooit over de knop of over de contactgegevens vallen,
 * ongeacht hoe lang de kop is of hoe smal het formaat.
 */

import type { Merk } from '../types';
import type { Formaat } from '../data/kanalen';
import { lettertypeStack } from '../data/merk';
import {
  badge,
  beeldVullend,
  helderheid,
  leesbaarOp,
  maakCtx,
  metAlfa,
  passendeGrootte,
  patroon,
  pijl,
  rechthoek,
  regelsVoor,
  scrim,
  scrimBoven,
  sterren,
  tekst,
  verloop,
  vinkje,
  type Ctx,
} from './paint';

export interface Inhoud {
  badge: string;
  kop: string;
  subkop: string;
  bullets: string[];
  cta: string;
  ctaSub: string;
}

export interface RenderSpec {
  sjabloonId: string;
  formaat: Formaat;
  merk: Merk;
  inhoud: Inhoud;
  beeldVoor?: CanvasImageSource | null;
  beeldNa?: CanvasImageSource | null;
  logo?: CanvasImageSource | null;
}

export interface Sjabloon {
  id: string;
  label: string;
  omschrijving: string;
  /** Welke beelden dit sjabloon gebruikt. */
  beelden: 'geen' | 'een' | 'twee';
  hoeken: string[];
  teken: (x: Ctx, s: RenderSpec) => void;
}

/* ------------------------------------------------------------ hulpstukken */

const kopFont = (m: Merk) => lettertypeStack(m.typografie.kopFont);
const tekstFont = (m: Merk) => lettertypeStack(m.typografie.tekstFont);

/** Is het beeld duidelijk hoger dan breed? Bepaalt of we stapelen of naast elkaar zetten. */
const staand = (x: Ctx) => x.h / x.w > 1.25;

/** Ruimte onderaan die het platform zelf gebruikt (knoppen bij Reels en TikTok). */
const onderInset = (x: Ctx) => x.h - (x.veilig.y + x.veilig.h);

const BALK_H = (x: Ctx) => x.u * 9;
const CTA_H = (x: Ctx) => x.u * 8;

/** Bovenkant van de merkbalk. Daaronder mag geen inhoud meer staan. */
const balkTop = (x: Ctx) => x.h - onderInset(x) - BALK_H(x);

/**
 * Tot waar het beeld doorloopt. Bij story- en TikTok-formaten is de onderrand
 * een brede strook die het platform zelf afdekt met knoppen; daar laten we de
 * foto gewoon doorlopen in plaats van een leeg gekleurd vlak achter te laten.
 */
const beeldBodem = (x: Ctx) => (onderInset(x) > x.u * 10 ? x.h : balkTop(x));

function achtergrondBeeld(x: Ctx, s: RenderSpec, beeld: CanvasImageSource | null | undefined, hoogte = x.h) {
  if (beeld) {
    beeldVullend(x, beeld, 0, 0, x.w, hoogte);
  } else {
    patroon(x, 0, 0, x.w, hoogte, metAlfa(s.merk.kleuren.primair, 0.35), s.merk.kleuren.primairDonker);
    tekst(x, 'Zet hier je foto neer', x.veilig.x, hoogte / 2 - x.u * 2, x.veilig.w, {
      font: tekstFont(s.merk),
      grootte: x.u * 3.2,
      gewicht: '600',
      kleur: 'rgba(255,255,255,0.5)',
      regelhoogte: 1.3,
      uitlijning: 'center',
    });
  }
}

/**
 * Merkbalk onderaan: bedrijfsnaam, telefoon en website. De balk loopt door tot
 * de onderrand van het beeld, maar de tekst blijft binnen het veilige gebied.
 */
function merkbalk(x: Ctx, s: RenderSpec, opties: { donker?: boolean } = {}) {
  const m = s.merk;
  const top = balkTop(x);
  const hoogte = BALK_H(x);
  const achter = opties.donker ? m.kleuren.primairDonker : m.kleuren.primair;
  const op = leesbaarOp(achter);

  // Bij feedformaten loopt de balk door tot de onderrand; bij story-formaten
  // blijft hij een band, zodat de foto eronder zichtbaar blijft.
  const onder = onderInset(x) > x.u * 10 ? top + hoogte : x.h;
  rechthoek(x, 0, top, x.w, onder - top, achter);
  rechthoek(x, 0, top, x.w, x.u * 0.55, m.kleuren.accent);

  const padding = x.veilig.x;
  const midden = top + hoogte / 2 + x.u * 0.2;
  let cursor = padding;
  let beschikbaar = x.w - padding * 2;

  if (s.logo) {
    const logoH = hoogte * 0.5;
    const iw = (s.logo as HTMLImageElement).naturalWidth || 1;
    const ih = (s.logo as HTMLImageElement).naturalHeight || 1;
    const logoW = Math.min((iw / ih) * logoH, x.w * 0.28);
    x.c.drawImage(s.logo, cursor, top + (hoogte - logoH) / 2, logoW, logoH);
    cursor += logoW + x.u * 2;
    beschikbaar -= logoW + x.u * 2;
  }

  x.c.save();
  x.c.textBaseline = 'middle';

  // Naam en contact mogen elkaar nooit overlappen: eerst meten, dan pas kiezen
  // wat er nog bij past en hoe groot.
  let naamGrootte = x.u * 3;
  x.c.font = `800 ${naamGrootte}px ${kopFont(m)}`;
  const naam = m.bedrijfsnaam.toUpperCase();
  let naamBreedte = x.c.measureText(naam).width;

  const contactDelen = [m.telefoon, m.website].filter(Boolean);
  let contact = contactDelen.join('   ·   ');
  let contactGrootte = x.u * 2.6;
  const meetContact = () => {
    x.c.font = `600 ${contactGrootte}px ${tekstFont(m)}`;
    return contact ? x.c.measureText(contact).width : 0;
  };
  let contactBreedte = meetContact();
  const tussenruimte = x.u * 3;

  while (naamBreedte + contactBreedte + tussenruimte > beschikbaar && naamGrootte > x.u * 1.9) {
    naamGrootte -= x.u * 0.1;
    contactGrootte -= x.u * 0.09;
    x.c.font = `800 ${naamGrootte}px ${kopFont(m)}`;
    naamBreedte = x.c.measureText(naam).width;
    contactBreedte = meetContact();
  }
  // Past het dan nog niet, dan valt de website weg en houden we het nummer.
  if (naamBreedte + contactBreedte + tussenruimte > beschikbaar && contactDelen.length > 1) {
    contact = contactDelen[0];
    contactBreedte = meetContact();
  }
  if (naamBreedte + contactBreedte + tussenruimte > beschikbaar) {
    contact = '';
    contactBreedte = 0;
  }

  x.c.font = `800 ${naamGrootte}px ${kopFont(m)}`;
  x.c.fillStyle = op;
  x.c.textAlign = 'left';
  x.c.fillText(naam, cursor, midden);

  if (contact) {
    x.c.font = `600 ${contactGrootte}px ${tekstFont(m)}`;
    x.c.fillStyle = metAlfa(op === '#FFFFFF' ? '#FFFFFF' : '#111827', 0.85);
    x.c.textAlign = 'right';
    x.c.fillText(contact, x.w - padding, midden);
  }
  x.c.restore();
}

/** Oproepknop. Groot, accentkleur, altijd hetzelfde herkenbare blok. */
function ctaKnop(x: Ctx, s: RenderSpec, px: number, py: number, breedte: number, gecentreerd = false) {
  const m = s.merk;
  const hoogte = CTA_H(x);
  const bw = Math.min(breedte, x.u * 46);
  const bx = gecentreerd ? px + (breedte - bw) / 2 : px;

  rechthoek(x, bx, py, bw, hoogte, m.kleuren.accent, x.u * 1.2);
  x.c.save();
  x.c.font = `800 ${x.u * 3.2}px ${kopFont(m)}`;
  x.c.fillStyle = m.kleuren.opAccent;
  x.c.textAlign = 'center';
  x.c.textBaseline = 'middle';
  x.c.fillText(s.inhoud.cta.toUpperCase(), bx + bw / 2, py + hoogte / 2 + x.u * 0.2);
  x.c.restore();
}

function actiebadge(x: Ctx, s: RenderSpec, px: number, py: number, gecentreerd = false) {
  if (!s.inhoud.badge) return { w: 0, h: 0 };
  const grootte = x.u * 3.1;
  let bx = px;
  if (gecentreerd) {
    x.c.save();
    x.c.font = `800 ${grootte}px ${kopFont(s.merk)}`;
    const bw = x.c.measureText(s.inhoud.badge.toUpperCase()).width + grootte * 1.4;
    x.c.restore();
    bx = (x.w - bw) / 2;
  }
  return badge(x, s.inhoud.badge, bx, py, {
    achtergrond: s.merk.kleuren.accent,
    kleur: s.merk.kleuren.opAccent,
    font: kopFont(s.merk),
    grootte,
  });
}

/** Label linksboven op een deel van een vóór/ná-beeld. */
function beeldLabel(x: Ctx, s: RenderSpec, waarde: string, px: number, py: number, donker: boolean) {
  badge(x, waarde, px, py, {
    achtergrond: donker ? 'rgba(17,24,39,0.86)' : s.merk.kleuren.accent,
    kleur: donker ? '#FFFFFF' : s.merk.kleuren.opAccent,
    font: kopFont(s.merk),
    grootte: x.u * 2.9,
  });
}

const BULLET_GROOTTE = (x: Ctx) => x.u * 2.9;

/**
 * Hoogte van een puntenlijst, met terugloop meegerekend. Een punt dat over twee
 * regels loopt is hoger dan een punt van één regel; zonder dat te meten schuift
 * de laatste regel onder de knop.
 */
function meetBullets(x: Ctx, s: RenderSpec, breedte: number, maxAantal: number): number {
  const grootte = BULLET_GROOTTE(x);
  const inspringing = grootte * 1.8;
  const tekstOpties = {
    font: tekstFont(s.merk),
    grootte,
    gewicht: '600',
    kleur: '#000',
    regelhoogte: 1.25,
  };
  return s.inhoud.bullets
    .filter(Boolean)
    .slice(0, maxAantal)
    .reduce((som, item) => {
      const regels = regelsVoor(x, item, breedte - inspringing, tekstOpties).length;
      return som + Math.max(grootte * 1.15, regels * grootte * 1.25) + grootte * 0.75;
    }, 0);
}

function bulletsBlok(
  x: Ctx,
  s: RenderSpec,
  px: number,
  py: number,
  breedte: number,
  kleur: string,
  maxAantal = 4,
  ondergrens = Infinity,
): number {
  const m = s.merk;
  const grootte = BULLET_GROOTTE(x);
  const inspringing = grootte * 1.8;
  const items = s.inhoud.bullets.filter(Boolean).slice(0, maxAantal);

  const tekstOpties = {
    font: tekstFont(m),
    grootte,
    gewicht: '600',
    kleur,
    regelhoogte: 1.25,
  };

  let y = py;
  for (const item of items) {
    const regels = regelsVoor(x, item, breedte - inspringing, tekstOpties).length;
    const hoogte = Math.max(grootte * 1.15, regels * grootte * 1.25);
    // Eerst kijken of het punt er nog helemaal bij past; anders stoppen.
    if (y + hoogte > ondergrens) break;
    vinkje(x, px, y, grootte * 1.15, m.kleuren.accent, m.kleuren.opAccent);
    tekst(x, item, px + inspringing, y - grootte * 0.05, breedte - inspringing, tekstOpties);
    y += hoogte + grootte * 0.75;
  }
  return y - py;
}

/* --------------------------------------------------------------- onderblok */

interface OnderblokOpties {
  /** Kleur van kop en subkop. */
  opTekst: string;
  zachteTekst: string;
  metCta: boolean;
  maxKopRegels: number;
  maxKopGrootte: number;
  schaduw?: boolean;
  gecentreerd?: boolean;
  /** Wordt aangeroepen met de bovenkant van het blok, vóór de tekst getekend wordt. */
  achtergrond?: (top: number, hoogte: number) => void;
}

/**
 * Meet hoeveel ruimte het onderblok nodig heeft, zonder te tekenen. Sjablonen
 * die eerst hun beeld moeten opbouwen weten zo vooraf waar het tekstblok begint.
 */
function meetOnderblok(x: Ctx, s: RenderSpec, o: OnderblokOpties): number {
  return onderblok(x, s, o, true);
}

/**
 * Zet badge, kop, subkop, knop en merkbalk onder elkaar, van de onderrand naar
 * boven. Geeft de bovenkant van het blok terug — daarboven is ruimte voor beeld.
 */
function onderblok(x: Ctx, s: RenderSpec, o: OnderblokOpties, alleenMeten = false): number {
  const m = s.merk;
  const padX = x.veilig.x;
  const breedte = x.veilig.w;
  const uitlijning: CanvasTextAlign = o.gecentreerd ? 'center' : 'left';

  const kopOpties = {
    font: kopFont(m),
    gewicht: '900',
    kleur: o.opTekst,
    regelhoogte: 1.04,
    spatiering: m.typografie.kopSpatiering,
    hoofdletters: m.typografie.kopHoofdletters,
    schaduw: o.schaduw,
    uitlijning,
  };
  const kopGrootte = passendeGrootte(x, s.inhoud.kop, breedte, kopOpties, o.maxKopGrootte, x.u * 3.4, o.maxKopRegels);
  const kopRegels = regelsVoor(x, s.inhoud.kop, breedte, { ...kopOpties, grootte: kopGrootte }).length;
  const kopH = kopRegels * kopGrootte * 1.04;

  const subOpties = {
    font: tekstFont(m),
    grootte: x.u * 3,
    gewicht: '600',
    kleur: o.zachteTekst,
    regelhoogte: 1.3,
    schaduw: o.schaduw,
    uitlijning,
  };
  const subBreedte = o.gecentreerd ? breedte * 0.86 : breedte * 0.9;
  const subRegels = s.inhoud.subkop ? regelsVoor(x, s.inhoud.subkop, subBreedte, subOpties).length : 0;
  const subH = subRegels ? Math.min(subRegels, 3) * subOpties.grootte * 1.3 : 0;

  const badgeH = s.inhoud.badge ? x.u * 3.1 * 1.9 : 0;
  const ctaH = o.metCta ? CTA_H(x) + x.u * 3 : 0;

  const marge = x.u * 2.2;
  const hoogte = badgeH + (badgeH ? marge : 0) + kopH + (subH ? marge * 0.7 + subH : 0) + ctaH + x.u * 3;
  const top = balkTop(x) - hoogte;
  if (alleenMeten) return top;

  o.achtergrond?.(top, hoogte);

  let y = top + x.u * 1.5;
  if (s.inhoud.badge) {
    actiebadge(x, s, padX, y, o.gecentreerd);
    y += badgeH + marge * 0.4;
  }
  y += tekst(x, s.inhoud.kop, padX, y, breedte, { ...kopOpties, grootte: kopGrootte });

  if (subH) {
    y += marge * 0.7;
    tekst(
      x,
      s.inhoud.subkop,
      o.gecentreerd ? padX + (breedte - subBreedte) / 2 : padX,
      y,
      subBreedte,
      subOpties,
    );
    y += subH;
  }

  if (o.metCta) {
    y += x.u * 2.4;
    ctaKnop(x, s, padX, y, breedte, o.gecentreerd);
  }

  merkbalk(x, s, { donker: o.schaduw });
  return top;
}

/* -------------------------------------------------------------- sjablonen */

const voorNaSplit: Sjabloon = {
  id: 'voor-na-split',
  label: 'Vóór / ná — gedeeld beeld',
  omschrijving:
    'Twee beelden naast of onder elkaar met een duidelijke scheidingslijn. Het sterkste format van deze branche.',
  beelden: 'twee',
  hoeken: ['voor-na', 'bewijs'],
  teken: (x, s) => {
    const m = s.merk;
    rechthoek(x, 0, 0, x.w, x.h, m.kleuren.achtergrond);

    const blok: OnderblokOpties = {
      opTekst: m.kleuren.tekst,
      zachteTekst: m.kleuren.tekstZacht,
      metCta: true,
      maxKopRegels: 2,
      maxKopGrootte: x.u * 8,
      achtergrond: (t, h) => rechthoek(x, 0, t, x.w, h + x.u * 2, m.kleuren.achtergrond),
    };

    // Eerst meten waar het tekstblok begint, dan het beeld daaronder opbouwen.
    // Bij story-formaten loopt de foto onder de merkbalk door.
    const zichtbaar = meetOnderblok(x, s, blok) - x.u * 1.5;
    const beeldH = Math.max(zichtbaar, beeldBodem(x));
    x.c.save();
    x.c.beginPath();
    x.c.rect(0, 0, x.w, beeldH);
    x.c.clip();

    if (staand(x)) {
      const helft = zichtbaar / 2;
      const onderhelft = beeldH - helft;
      if (s.beeldVoor) beeldVullend(x, s.beeldVoor, 0, 0, x.w, helft);
      else patroon(x, 0, 0, x.w, helft, metAlfa('#000000', 0.2), '#4B5563');
      if (s.beeldNa) beeldVullend(x, s.beeldNa, 0, helft, x.w, onderhelft);
      else patroon(x, 0, helft, x.w, onderhelft, metAlfa(m.kleuren.primair, 0.3), m.kleuren.primairDonker);

      rechthoek(x, 0, helft - x.u * 0.5, x.w, x.u, m.kleuren.accent);
      beeldLabel(x, s, 'vóór', x.u * 2.5, x.u * 2.5, true);
      beeldLabel(x, s, 'ná', x.u * 2.5, helft + x.u * 2.5, false);
      pijl(x, x.w - x.u * 7, helft, x.u * 3.4, m.kleuren.opAccent, m.kleuren.accent);
    } else {
      const helft = x.w / 2;
      if (s.beeldVoor) beeldVullend(x, s.beeldVoor, 0, 0, helft, beeldH);
      else patroon(x, 0, 0, helft, beeldH, metAlfa('#000000', 0.2), '#4B5563');
      if (s.beeldNa) beeldVullend(x, s.beeldNa, helft, 0, helft, beeldH);
      else patroon(x, helft, 0, helft, beeldH, metAlfa(m.kleuren.primair, 0.3), m.kleuren.primairDonker);

      rechthoek(x, helft - x.u * 0.5, 0, x.u, beeldH, m.kleuren.accent);
      beeldLabel(x, s, 'vóór', x.u * 2.5, x.u * 2.5, true);
      beeldLabel(x, s, 'ná', helft + x.u * 2.5, x.u * 2.5, false);
      pijl(x, helft, zichtbaar - x.u * 7, x.u * 3.4, m.kleuren.opAccent, m.kleuren.accent);
    }
    x.c.restore();

    onderblok(x, s, blok);
  },
};

const voorNaSchuif: Sjabloon = {
  id: 'voor-na-schuif',
  label: 'Vóór / ná — diagonaal',
  omschrijving: 'Eén beeld dat diagonaal overgaat in het andere. Valt meer op in een tijdlijn dan een rechte deling.',
  beelden: 'twee',
  hoeken: ['voor-na'],
  teken: (x, s) => {
    const m = s.merk;
    const beeldH = beeldBodem(x);

    if (s.beeldVoor) beeldVullend(x, s.beeldVoor, 0, 0, x.w, beeldH);
    else patroon(x, 0, 0, x.w, beeldH, metAlfa('#000000', 0.2), '#4B5563');

    // Het "ná"-beeld in een diagonaal masker eroverheen.
    x.c.save();
    x.c.beginPath();
    x.c.moveTo(x.w * 0.38, 0);
    x.c.lineTo(x.w, 0);
    x.c.lineTo(x.w, beeldH);
    x.c.lineTo(x.w * 0.62, beeldH);
    x.c.closePath();
    x.c.clip();
    if (s.beeldNa) beeldVullend(x, s.beeldNa, 0, 0, x.w, beeldH);
    else patroon(x, 0, 0, x.w, beeldH, metAlfa(m.kleuren.primair, 0.3), m.kleuren.primairDonker);
    x.c.restore();

    x.c.save();
    x.c.strokeStyle = m.kleuren.accent;
    x.c.lineWidth = x.u * 1.1;
    x.c.beginPath();
    x.c.moveTo(x.w * 0.38, 0);
    x.c.lineTo(x.w * 0.62, beeldH);
    x.c.stroke();
    x.c.restore();

    scrimBoven(x, 0.22, 0.4);
    beeldLabel(x, s, 'vóór', x.u * 2.5, x.u * 2.5, true);
    beeldLabel(x, s, 'ná', x.w - x.u * 14, x.u * 2.5, false);

    onderblok(x, s, {
      opTekst: '#FFFFFF',
      zachteTekst: 'rgba(255,255,255,0.9)',
      metCta: true,
      maxKopRegels: 3,
      maxKopGrootte: x.u * 9,
      schaduw: true,
      achtergrond: (top) =>
        verloop(x, 0, top - x.u * 14, x.w, balkTop(x) - top + x.u * 14, [
          [0, 'rgba(0,0,0,0)'],
          [0.5, 'rgba(0,0,0,0.62)'],
          [1, 'rgba(0,0,0,0.88)'],
        ]),
    });
  },
};

const aanbod: Sjabloon = {
  id: 'aanbod',
  label: 'Aanbod / actie',
  omschrijving: 'De actie zo groot mogelijk in beeld, met voorwaarden klein eronder en één duidelijke oproep.',
  beelden: 'een',
  hoeken: ['aanbod', 'urgentie', 'seizoen'],
  teken: (x, s) => {
    const m = s.merk;
    const padX = x.veilig.x;
    const op = leesbaarOp(m.kleuren.primair);
    const claim = s.inhoud.badge || s.inhoud.kop;
    const heeftClaim = Boolean(s.inhoud.badge);

    // Van onder naar boven meten: merkbalk, knop, voorwaarden, punten, kop, claim.
    const ctaY = balkTop(x) - x.u * 3 - CTA_H(x);

    const subOpties = {
      font: tekstFont(m),
      grootte: x.u * 2.2,
      gewicht: '500',
      kleur: metAlfa(op, 0.7),
      regelhoogte: 1.3,
    };
    const subRegels = s.inhoud.subkop ? regelsVoor(x, s.inhoud.subkop, x.veilig.w, subOpties).length : 0;
    const subH = subRegels * subOpties.grootte * 1.3;

    let bulletAantal = Math.min(s.inhoud.bullets.filter(Boolean).length, staand(x) ? 4 : 3);
    let bulletsH = meetBullets(x, s, x.veilig.w * 0.92, bulletAantal);

    const kopOpties = {
      font: kopFont(m),
      gewicht: '800',
      kleur: op,
      regelhoogte: 1.12,
      hoofdletters: false,
    };
    const kopGrootte = heeftClaim ? passendeGrootte(x, s.inhoud.kop, x.veilig.w, kopOpties, x.u * 5.2, x.u * 3, 2) : 0;
    const kopH = heeftClaim
      ? regelsVoor(x, s.inhoud.kop, x.veilig.w, { ...kopOpties, grootte: kopGrootte }).length * kopGrootte * 1.12
      : 0;

    const claimOpties = {
      font: kopFont(m),
      gewicht: '900',
      kleur: m.kleuren.accent,
      regelhoogte: 0.98,
      spatiering: -0.03,
      hoofdletters: true,
    };
    let claimGrootte = passendeGrootte(x, claim, x.veilig.w, claimOpties, x.u * 13, x.u * 5.5, 2);
    let claimH = regelsVoor(x, claim, x.veilig.w, { ...claimOpties, grootte: claimGrootte }).length * claimGrootte * 0.98;

    const marge = x.u * 2;
    let toonSub = subH > 0;
    const meet = () =>
      claimH +
      (kopH ? marge * 0.8 + kopH : 0) +
      (bulletsH ? marge + bulletsH : 0) +
      (toonSub ? marge * 0.6 + subH : 0);

    /* De foto moet minstens een kwart van het beeld houden. Past de tekst daar
       niet in, dan gaat er eerst een punt af, dan de voorwaardenregel, en pas
       als laatste wordt de claim kleiner gezet. Zo loopt er nooit tekst over de
       knop, hoe lang de ingevoerde tekst ook is. */
    const minPaneelTop = x.h * 0.26;
    const beschikbaar = () => ctaY - x.u * 6 - minPaneelTop;

    while (bulletAantal > 1 && meet() > beschikbaar()) {
      bulletAantal -= 1;
      bulletsH = meetBullets(x, s, x.veilig.w * 0.92, bulletAantal);
    }
    if (meet() > beschikbaar() && toonSub) toonSub = false;
    if (meet() > beschikbaar() && bulletsH) {
      bulletAantal = 0;
      bulletsH = 0;
    }
    while (meet() > beschikbaar() && claimGrootte > x.u * 5) {
      claimGrootte -= x.u * 0.5;
      claimH = regelsVoor(x, claim, x.veilig.w, { ...claimOpties, grootte: claimGrootte }).length * claimGrootte * 0.98;
    }

    const paneelTop = Math.max(minPaneelTop, ctaY - x.u * 6 - meet());

    // Beeld bovenin, gekleurd paneel eronder.
    achtergrondBeeld(x, s, s.beeldNa ?? s.beeldVoor, paneelTop);
    rechthoek(x, 0, paneelTop, x.w, x.h - paneelTop, m.kleuren.primair);
    verloop(x, 0, paneelTop - x.u * 7, x.w, x.u * 7, [
      [0, 'rgba(0,0,0,0)'],
      [1, metAlfa(m.kleuren.primair, 1)],
    ]);

    // Bij het tekenen geldt een harde ondergrens: niets mag onder de knop komen.
    const grens = ctaY - x.u * 2;
    let y = paneelTop + x.u * 3;
    y += tekst(x, claim, padX, y, x.veilig.w, { ...claimOpties, grootte: claimGrootte });
    if (kopH && y + marge * 0.8 + kopH <= grens) {
      y += marge * 0.8;
      y += tekst(x, s.inhoud.kop, padX, y, x.veilig.w, { ...kopOpties, grootte: kopGrootte });
    }
    if (bulletsH && y + marge + bulletsH <= grens) {
      y += marge;
      y += bulletsBlok(x, s, padX, y, x.veilig.w * 0.92, metAlfa(op, 0.92), bulletAantal, grens);
    }
    if (toonSub && y + marge * 0.6 + subH <= grens) {
      y += marge * 0.6;
      tekst(x, s.inhoud.subkop, padX, y, x.veilig.w, subOpties);
    }

    ctaKnop(x, s, padX, ctaY, x.veilig.w);
    merkbalk(x, s, { donker: true });
  },
};

const statement: Sjabloon = {
  id: 'statement',
  label: 'Beeldvullend statement',
  omschrijving: 'Eén sterke foto met een korte, harde kop eroverheen. Werkt overal en is in tien seconden klaar.',
  beelden: 'een',
  hoeken: ['bewijs', 'achter-de-schermen', 'urgentie', 'seizoen'],
  teken: (x, s) => {
    achtergrondBeeld(x, s, s.beeldNa ?? s.beeldVoor);
    scrimBoven(x, 0.25, 0.45);

    onderblok(x, s, {
      opTekst: '#FFFFFF',
      zachteTekst: 'rgba(255,255,255,0.92)',
      metCta: true,
      maxKopRegels: 3,
      maxKopGrootte: x.u * 10,
      schaduw: true,
      achtergrond: (top) =>
        verloop(x, 0, top - x.u * 16, x.w, x.h - top + x.u * 16, [
          [0, 'rgba(0,0,0,0)'],
          [0.45, 'rgba(0,0,0,0.6)'],
          [1, 'rgba(0,0,0,0.9)'],
        ]),
    });
  },
};

const review: Sjabloon = {
  id: 'review',
  label: 'Klantbeoordeling',
  omschrijving: 'Een letterlijk citaat met sterren. Bewijs uit de mond van een klant overtuigt sterker dan elke claim.',
  beelden: 'een',
  hoeken: ['bewijs'],
  teken: (x, s) => {
    const m = s.merk;
    const kaartX = x.veilig.x;
    const kaartW = x.w - kaartX * 2;
    const padX = kaartX + x.u * 4;
    const breedte = kaartW - x.u * 8;

    /* De kaart wordt zo hoog als zijn inhoud en staat onderaan vast; wat
       overblijft is voor de foto. Een kort citaat levert dus een grote foto op
       in plaats van een half lege kaart. */
    const sterrenH = x.u * 6.5;
    const naamH = x.u * 2.6 * 1.3;
    const ctaH = CTA_H(x);

    const citaatOpties = {
      font: kopFont(m),
      gewicht: '800',
      kleur: m.kleuren.tekst,
      regelhoogte: 1.18,
      hoofdletters: false,
    };
    const citaat = `“${s.inhoud.kop}”`;
    const grootte = passendeGrootte(x, citaat, breedte, citaatOpties, x.u * 6.5, x.u * 2.6, 6);
    const citaatH = regelsVoor(x, citaat, breedte, { ...citaatOpties, grootte }).length * grootte * 1.18;

    const kaartH = x.u * 4 + sterrenH + citaatH + x.u * 2 + naamH + x.u * 3.5 + ctaH + x.u * 4;
    const kaartY = Math.max(x.h * 0.28, balkTop(x) - x.u * 3 - kaartH);
    const beeldH = kaartY + x.u * 6;

    achtergrondBeeld(x, s, s.beeldNa ?? s.beeldVoor, beeldH);
    rechthoek(x, 0, beeldH, x.w, x.h - beeldH, m.kleuren.vlak);
    rechthoek(x, kaartX, kaartY, kaartW, kaartH, m.kleuren.achtergrond, x.u * 2);

    let y = kaartY + x.u * 4;
    sterren(x, padX, y, x.u * 4, m.kleuren.accent);

    // Het label komt linksboven over de rand van de kaart, nooit buiten beeld.
    if (s.inhoud.badge) actiebadge(x, s, padX, kaartY - x.u * 3);

    y += sterrenH;
    y += tekst(x, citaat, padX, y, breedte, { ...citaatOpties, grootte });

    y += x.u * 2;
    y += tekst(x, s.inhoud.subkop || '— tevreden klant', padX, y, breedte, {
      font: tekstFont(m),
      grootte: x.u * 2.6,
      gewicht: '600',
      kleur: m.kleuren.tekstZacht,
      regelhoogte: 1.3,
    });

    ctaKnop(x, s, padX, kaartY + kaartH - ctaH - x.u * 4, breedte);
    merkbalk(x, s);
  },
};

const uspLijst: Sjabloon = {
  id: 'usp-lijst',
  label: 'Waarom wij — puntenlijst',
  omschrijving: 'Foto boven, jouw belangrijkste argumenten eronder met vinkjes. Ideaal als vaste terugkerende post.',
  beelden: 'een',
  hoeken: ['aanbod', 'bewijs', 'educatie'],
  teken: (x, s) => {
    const m = s.merk;
    const padX = x.veilig.x;
    const ctaY = balkTop(x) - x.u * 3 - CTA_H(x);

    const bulletAantal = Math.min(s.inhoud.bullets.filter(Boolean).length, staand(x) ? 4 : 3);
    const bulletsH = meetBullets(x, s, x.veilig.w, bulletAantal);

    const kopOpties = {
      font: kopFont(m),
      gewicht: '900',
      kleur: m.kleuren.tekst,
      regelhoogte: 1.04,
      spatiering: m.typografie.kopSpatiering,
      hoofdletters: m.typografie.kopHoofdletters,
    };
    const kopGrootte = passendeGrootte(x, s.inhoud.kop, x.veilig.w, kopOpties, x.u * 7.5, x.u * 3.4, 2);
    const kopH = regelsVoor(x, s.inhoud.kop, x.veilig.w, { ...kopOpties, grootte: kopGrootte }).length * kopGrootte * 1.04;
    const badgeH = s.inhoud.badge ? x.u * 3.1 * 1.9 + x.u * 1.6 : 0;

    const paneelTop = Math.max(x.u * 6, ctaY - x.u * 3 - (badgeH + kopH + x.u * 3 + bulletsH));

    achtergrondBeeld(x, s, s.beeldNa ?? s.beeldVoor, paneelTop);
    rechthoek(x, 0, paneelTop, x.w, x.h - paneelTop, m.kleuren.achtergrond);

    let y = paneelTop + x.u * 3;
    if (badgeH) {
      actiebadge(x, s, padX, y);
      y += badgeH;
    }
    y += tekst(x, s.inhoud.kop, padX, y, x.veilig.w, { ...kopOpties, grootte: kopGrootte });
    y += x.u * 3;
    bulletsBlok(x, s, padX, y, x.veilig.w, m.kleuren.tekst, bulletAantal, ctaY - x.u * 2);

    ctaKnop(x, s, padX, ctaY, x.veilig.w);
    merkbalk(x, s);
  },
};

const vergelijking: Sjabloon = {
  id: 'vergelijking',
  label: 'Dit versus dat',
  omschrijving: 'Twee kolommen naast elkaar. Neemt twijfel weg bij mensen die nog aan het vergelijken zijn.',
  beelden: 'geen',
  hoeken: ['vergelijking', 'educatie'],
  teken: (x, s) => {
    const m = s.merk;
    rechthoek(x, 0, 0, x.w, x.h, m.kleuren.vlak);

    const padX = x.veilig.x;
    const ctaY = balkTop(x) - x.u * 3 - CTA_H(x);
    let y = x.veilig.y;

    if (s.inhoud.badge) {
      const b = actiebadge(x, s, padX, y);
      y += b.h + x.u * 2;
    }

    const kopOpties = {
      font: kopFont(m),
      gewicht: '900',
      kleur: m.kleuren.tekst,
      regelhoogte: 1.04,
      spatiering: m.typografie.kopSpatiering,
      hoofdletters: m.typografie.kopHoofdletters,
    };
    const kopGrootte = passendeGrootte(x, s.inhoud.kop, x.veilig.w, kopOpties, x.u * 7, x.u * 3.2, 3);
    y += tekst(x, s.inhoud.kop, padX, y, x.veilig.w, { ...kopOpties, grootte: kopGrootte });
    y += x.u * 3;

    const kolomW = (x.veilig.w - x.u * 3) / 2;
    const kolomH = ctaY - y - x.u * 3;
    const alle = s.inhoud.bullets.filter(Boolean);
    const links = alle.slice(0, Math.ceil(alle.length / 2));
    const rechts = alle.slice(Math.ceil(alle.length / 2));

    const kolom = (px: number, titel: string, items: string[], accent: boolean) => {
      rechthoek(x, px, y, kolomW, kolomH, accent ? m.kleuren.primair : m.kleuren.achtergrond, x.u * 1.6);
      const op = accent ? leesbaarOp(m.kleuren.primair) : m.kleuren.tekst;
      rechthoek(x, px, y, kolomW, x.u * 7, accent ? m.kleuren.accent : '#E2E8F0', x.u * 1.6);
      rechthoek(x, px, y + x.u * 4, kolomW, x.u * 3, accent ? m.kleuren.accent : '#E2E8F0');

      x.c.save();
      x.c.font = `900 ${x.u * 3}px ${kopFont(m)}`;
      x.c.fillStyle = accent ? m.kleuren.opAccent : m.kleuren.tekst;
      x.c.textAlign = 'center';
      x.c.textBaseline = 'middle';
      x.c.fillText(titel.toUpperCase(), px + kolomW / 2, y + x.u * 3.6);
      x.c.restore();

      let iy = y + x.u * 10;
      for (const item of items.slice(0, 5)) {
        if (iy > y + kolomH - x.u * 5) break;
        vinkje(x, px + x.u * 2, iy, x.u * 3, accent ? m.kleuren.accent : '#94A3B8', accent ? m.kleuren.opAccent : '#FFFFFF');
        iy +=
          tekst(x, item, px + x.u * 6, iy - x.u * 0.2, kolomW - x.u * 8, {
            font: tekstFont(m),
            grootte: x.u * 2.6,
            gewicht: '600',
            kleur: op,
            regelhoogte: 1.25,
          }) + x.u * 2;
      }
    };

    kolom(padX, 'Nu', links.length ? links : ['Tocht en kou'], false);
    kolom(padX + kolomW + x.u * 3, 'Straks', rechts.length ? rechts : ['Warm en stil'], true);

    ctaKnop(x, s, padX, ctaY, x.veilig.w);
    merkbalk(x, s);
  },
};

const lijstTips: Sjabloon = {
  id: 'lijst-tips',
  label: 'Genummerde lijst',
  omschrijving: 'Uitleg in genummerde punten. Wordt veel opgeslagen en gedeeld — goed voor bereik.',
  beelden: 'een',
  hoeken: ['educatie', 'vraag-antwoord'],
  teken: (x, s) => {
    const m = s.merk;
    rechthoek(x, 0, 0, x.w, x.h, m.kleuren.primair);

    if (s.beeldNa ?? s.beeldVoor) {
      x.c.save();
      x.c.globalAlpha = 0.22;
      beeldVullend(x, (s.beeldNa ?? s.beeldVoor) as CanvasImageSource, 0, 0, x.w, x.h);
      x.c.restore();
    }

    const op = leesbaarOp(m.kleuren.primair);
    const padX = x.veilig.x;
    const ctaY = balkTop(x) - x.u * 3 - CTA_H(x);
    let y = x.veilig.y;

    if (s.inhoud.badge) {
      const b = actiebadge(x, s, padX, y);
      y += b.h + x.u * 2.5;
    }

    const kopOpties = {
      font: kopFont(m),
      gewicht: '900',
      kleur: op,
      regelhoogte: 1.04,
      spatiering: m.typografie.kopSpatiering,
      hoofdletters: m.typografie.kopHoofdletters,
    };
    const kopGrootte = passendeGrootte(x, s.inhoud.kop, x.veilig.w, kopOpties, x.u * 8, x.u * 3.4, 3);
    y += tekst(x, s.inhoud.kop, padX, y, x.veilig.w, { ...kopOpties, grootte: kopGrootte });
    y += x.u * 3.5;

    const items = s.inhoud.bullets.filter(Boolean).slice(0, 5);
    const maat = x.u * 5.2;
    for (const [i, item] of items.entries()) {
      // Niets tekenen wat onder de knop zou vallen.
      if (y + maat > ctaY - x.u * 2) break;
      rechthoek(x, padX, y, maat, maat, m.kleuren.accent, x.u * 1);
      x.c.save();
      x.c.font = `900 ${maat * 0.6}px ${kopFont(m)}`;
      x.c.fillStyle = m.kleuren.opAccent;
      x.c.textAlign = 'center';
      x.c.textBaseline = 'middle';
      x.c.fillText(String(i + 1), padX + maat / 2, y + maat / 2 + maat * 0.03);
      x.c.restore();

      const hoogte = tekst(x, item, padX + maat + x.u * 2.5, y + x.u * 0.4, x.veilig.w - maat - x.u * 2.5, {
        font: tekstFont(m),
        grootte: x.u * 3,
        gewicht: '600',
        kleur: op,
        regelhoogte: 1.28,
      });
      y += Math.max(maat, hoogte) + x.u * 2.4;
    }

    ctaKnop(x, s, padX, ctaY, x.veilig.w);
    merkbalk(x, s, { donker: true });
  },
};

const probleem: Sjabloon = {
  id: 'probleem',
  label: 'Probleem in beeld',
  omschrijving: 'Benoemt de ergernis groot en centraal. Mensen herkennen zichzelf en lezen door.',
  beelden: 'een',
  hoeken: ['probleem-oplossing', 'seizoen'],
  teken: (x, s) => {
    const m = s.merk;
    achtergrondBeeld(x, s, s.beeldVoor ?? s.beeldNa);
    rechthoek(x, 0, 0, x.w, x.h, metAlfa(m.kleuren.primairDonker, 0.72));

    onderblok(x, s, {
      opTekst: '#FFFFFF',
      zachteTekst: 'rgba(255,255,255,0.9)',
      metCta: true,
      maxKopRegels: 4,
      maxKopGrootte: x.u * 10,
      gecentreerd: true,
      schaduw: true,
    });
  },
};

const vraag: Sjabloon = {
  id: 'vraag',
  label: 'Vraag & antwoord',
  omschrijving: 'De vraag groot, het antwoord eronder. Beantwoordt precies wat mensen anders aan de concurrent vragen.',
  beelden: 'een',
  hoeken: ['vraag-antwoord', 'educatie'],
  teken: (x, s) => {
    const m = s.merk;
    rechthoek(x, 0, 0, x.w, x.h, m.kleuren.achtergrond);

    const vraagH = staand(x) ? x.h * 0.4 : x.h * 0.44;
    rechthoek(x, 0, 0, x.w, vraagH, m.kleuren.primair);
    if (s.beeldNa ?? s.beeldVoor) {
      x.c.save();
      x.c.globalAlpha = 0.25;
      beeldVullend(x, (s.beeldNa ?? s.beeldVoor) as CanvasImageSource, 0, 0, x.w, vraagH);
      x.c.restore();
    }

    const op = leesbaarOp(m.kleuren.primair);
    const padX = x.veilig.x;
    const ctaY = balkTop(x) - x.u * 3 - CTA_H(x);

    x.c.save();
    x.c.font = `900 ${x.u * 14}px ${kopFont(m)}`;
    x.c.fillStyle = metAlfa(m.kleuren.accent, 0.85);
    x.c.textBaseline = 'top';
    x.c.fillText('?', padX, x.veilig.y - x.u * 1.5);
    x.c.restore();

    const kopOpties = {
      font: kopFont(m),
      gewicht: '900',
      kleur: op,
      regelhoogte: 1.08,
      hoofdletters: false,
    };
    const kopGrootte = passendeGrootte(x, s.inhoud.kop, x.veilig.w, kopOpties, x.u * 7, x.u * 3.2, 3);
    const kopH = regelsVoor(x, s.inhoud.kop, x.veilig.w, { ...kopOpties, grootte: kopGrootte }).length * kopGrootte * 1.08;
    tekst(x, s.inhoud.kop, padX, vraagH - kopH - x.u * 4, x.veilig.w, { ...kopOpties, grootte: kopGrootte });

    let y = vraagH + x.u * 4;
    if (s.inhoud.subkop) {
      const antwoordOpties = {
        font: tekstFont(m),
        grootte: x.u * 3.2,
        gewicht: '600',
        kleur: m.kleuren.tekst,
        regelhoogte: 1.35,
      };
      y += tekst(x, s.inhoud.subkop, padX, y, x.veilig.w, antwoordOpties);
      y += x.u * 3;
    }
    if (y < ctaY - x.u * 6) {
      bulletsBlok(x, s, padX, y, x.veilig.w, m.kleuren.tekstZacht, 4, ctaY - x.u * 2);
    }

    ctaKnop(x, s, padX, ctaY, x.veilig.w);
    merkbalk(x, s);
  },
};

const cijfers: Sjabloon = {
  id: 'cijfers',
  label: 'Cijfers & bewijs',
  omschrijving: 'Jouw harde cijfers in blokken. Bouwt in één beeld vertrouwen op bij wie je nog niet kent.',
  beelden: 'een',
  hoeken: ['bewijs'],
  teken: (x, s) => {
    const m = s.merk;
    achtergrondBeeld(x, s, s.beeldNa ?? s.beeldVoor);
    rechthoek(x, 0, 0, x.w, x.h, metAlfa(m.kleuren.primairDonker, 0.8));

    const padX = x.veilig.x;
    const ctaY = balkTop(x) - x.u * 3 - CTA_H(x);
    let y = x.veilig.y;

    const kopOpties = {
      font: kopFont(m),
      gewicht: '900',
      kleur: '#FFFFFF',
      regelhoogte: 1.04,
      spatiering: m.typografie.kopSpatiering,
      hoofdletters: m.typografie.kopHoofdletters,
    };
    const kopGrootte = passendeGrootte(x, s.inhoud.kop, x.veilig.w, kopOpties, x.u * 7.5, x.u * 3.4, 2);
    y += tekst(x, s.inhoud.kop, padX, y, x.veilig.w, { ...kopOpties, grootte: kopGrootte });
    y += x.u * 4;

    // Cijfers uit het merkprofiel; lege waarden slaan we over.
    const jaren = Number(m.bewijs.jaarOpgericht);
    const blokken = [
      m.bewijs.reviewScore ? { waarde: m.bewijs.reviewScore, label: 'gemiddelde beoordeling' } : null,
      m.bewijs.reviewAantal ? { waarde: `${m.bewijs.reviewAantal}+`, label: 'beoordelingen' } : null,
      Number.isFinite(jaren) && jaren > 1900
        ? { waarde: `${new Date().getFullYear() - jaren}`, label: 'jaar ervaring' }
        : null,
      m.bewijs.projectenPerJaar ? { waarde: m.bewijs.projectenPerJaar, label: 'woningen per jaar' } : null,
      { waarde: `${m.bewijs.garantieJaren}`, label: 'jaar garantie' },
    ].filter(Boolean) as { waarde: string; label: string }[];

    const kolommen = staand(x) ? 2 : 3;
    const rijen = Math.ceil(Math.min(blokken.length, kolommen * 2) / kolommen);
    const blokW = (x.veilig.w - x.u * 2 * (kolommen - 1)) / kolommen;
    const blokH = Math.min(x.u * 17, (ctaY - y - x.u * 2 * (rijen - 1) - x.u * 3) / rijen);

    blokken.slice(0, kolommen * 2).forEach((b, i) => {
      const bx = padX + (i % kolommen) * (blokW + x.u * 2);
      const by = y + Math.floor(i / kolommen) * (blokH + x.u * 2);
      rechthoek(x, bx, by, blokW, blokH, 'rgba(255,255,255,0.1)', x.u * 1.6);
      rechthoek(x, bx, by, blokW, x.u * 0.7, m.kleuren.accent, x.u * 0.35);

      x.c.save();
      x.c.textAlign = 'center';
      x.c.textBaseline = 'middle';
      x.c.font = `900 ${blokH * 0.4}px ${kopFont(m)}`;
      x.c.fillStyle = m.kleuren.accent;
      x.c.fillText(b.waarde, bx + blokW / 2, by + blokH * 0.42);
      x.c.restore();

      tekst(x, b.label, bx + x.u, by + blokH * 0.6, blokW - x.u * 2, {
        font: tekstFont(m),
        grootte: Math.min(x.u * 2.2, blokH * 0.14),
        gewicht: '600',
        kleur: 'rgba(255,255,255,0.85)',
        regelhoogte: 1.2,
        uitlijning: 'center',
      });
    });

    ctaKnop(x, s, padX, ctaY, x.veilig.w);
    merkbalk(x, s, { donker: true });
  },
};

export const SJABLONEN: Sjabloon[] = [
  voorNaSplit,
  voorNaSchuif,
  aanbod,
  statement,
  uspLijst,
  review,
  probleem,
  vergelijking,
  lijstTips,
  vraag,
  cijfers,
];

export const sjabloonById = (id: string): Sjabloon => SJABLONEN.find((s) => s.id === id) ?? SJABLONEN[0];

/** Tekent een sjabloon op een canvas van precies het exportformaat. */
export function tekenOpCanvas(canvas: HTMLCanvasElement, spec: RenderSpec) {
  canvas.width = spec.formaat.breedte;
  canvas.height = spec.formaat.hoogte;
  const c = canvas.getContext('2d');
  if (!c) return;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = spec.merk.kleuren.achtergrond;
  c.fillRect(0, 0, canvas.width, canvas.height);
  const x = maakCtx(c, spec.formaat);
  sjabloonById(spec.sjabloonId).teken(x, spec);
}

/** Waarschuwt als een sjabloon beelden nodig heeft die nog ontbreken. */
export function ontbrekendBeeld(sjabloonId: string, spec: RenderSpec): string | null {
  const sj = sjabloonById(sjabloonId);
  if (sj.beelden === 'twee' && (!spec.beeldVoor || !spec.beeldNa)) {
    return 'Dit sjabloon werkt met twee beelden: een vóór- en een ná-foto.';
  }
  if (sj.beelden === 'een' && !spec.beeldVoor && !spec.beeldNa) {
    return 'Voeg een foto toe — met beeld haalt deze post veel meer bereik.';
  }
  return null;
}

/** Alleen gebruikt door de contrastcontrole in de tests. */
export const _helderheid = helderheid;

/** Niet elk sjabloon gebruikt de zware scrim; hier gehouden voor hergebruik. */
export const _scrim = scrim;
