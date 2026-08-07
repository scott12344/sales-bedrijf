/**
 * Kalendermotor: zorgt dat er continu marketing draait.
 *
 * Uit de contentmix, de actieve kanalen en de ideeënbank rolt een planning van
 * weken vooruit. Elke week bevat de juiste verhouding tussen bewijs, aanbod,
 * uitleg en mensen — zodat de tijdlijn niet één lange reclamefolder wordt.
 */

import type { Campagne, Idee, Instellingen, KanaalId, Merk, Post } from '../types';
import { IDEEENBANK, ideeenVoorMaand, type IdeeSjabloon } from '../data/ideeen';
import { PILAREN } from '../data/pilaren';
import { kanaalById } from '../data/kanalen';
import { werkIdeeUit } from './copy';
import { maakRng } from './tekst';

export interface PlanRegel {
  datum: string;
  tijd: string;
  kanalen: KanaalId[];
  pilaar: string;
  idee: IdeeSjabloon;
}

const isoDatum = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Verdeelt het aantal posts per week over de pilaren volgens de ingestelde mix. */
function pilaarVolgorde(mix: Record<string, number>, aantal: number): string[] {
  const totaal = Object.values(mix).reduce((a, b) => a + b, 0) || 1;
  const rest: { id: string; waarde: number; toegekend: number }[] = PILAREN.map((p) => ({
    id: p.id,
    waarde: ((mix[p.id] ?? p.aandeel) / totaal) * aantal,
    toegekend: 0,
  }));

  const uit: string[] = [];
  // Grootste-restmethode: verdeelt eerlijk, ook bij 3 posts over 4 pilaren.
  for (let i = 0; i < aantal; i++) {
    rest.sort((a, b) => b.waarde - b.toegekend - (a.waarde - a.toegekend));
    rest[0].toegekend += 1;
    uit.push(rest[0].id);
  }
  return uit;
}

/** Spreidt n posts over de week, met het zwaartepunt op dinsdag t/m donderdag. */
function dagenVoorWeek(aantal: number): number[] {
  // 0 = maandag. Dinsdag t/m donderdag eerst: daar zit in deze branche de meeste
  // interactie, het weekend gebruiken we pas als er meer posts per week zijn.
  const voorkeur = [1, 3, 5, 2, 0, 4, 6]; // di, do, za, wo, ma, vr, zo
  return voorkeur.slice(0, Math.min(aantal, 7)).sort((a, b) => a - b);
}

export function genereerPlan(
  instellingen: Instellingen,
  weken: number,
  startdatum: Date = new Date(),
): PlanRegel[] {
  const rng = maakRng(startdatum.getFullYear() * 1000 + startdatum.getMonth() * 31 + startdatum.getDate());
  const regels: PlanRegel[] = [];
  const gebruikt = new Set<string>();

  const start = new Date(startdatum);
  start.setHours(0, 0, 0, 0);
  // Naar de eerstvolgende maandag, zodat weken netjes beginnen.
  const naarMaandag = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - naarMaandag);

  const kanalen = instellingen.actieveKanalen.length
    ? instellingen.actieveKanalen
    : (['instagram-feed', 'facebook-feed'] as KanaalId[]);

  for (let w = 0; w < weken; w++) {
    const perWeek = Math.max(1, instellingen.postsPerWeek);
    const pilaren = pilaarVolgorde(instellingen.mix, perWeek);
    const dagen = dagenVoorWeek(perWeek);

    for (let i = 0; i < perWeek; i++) {
      const datum = new Date(start);
      datum.setDate(start.getDate() + w * 7 + (dagen[i % dagen.length] ?? i % 7));
      const maand = datum.getMonth() + 1;
      const pilaar = pilaren[i];

      // Kies een idee dat past bij pilaar en maand, en dat nog niet gebruikt is.
      let opties = ideeenVoorMaand(maand, pilaar).filter((x) => !gebruikt.has(x.id));
      if (!opties.length) opties = ideeenVoorMaand(maand, pilaar);
      if (!opties.length) opties = IDEEENBANK.filter((x) => x.pilaar === pilaar);
      if (!opties.length) opties = IDEEENBANK;
      const idee = opties[Math.floor(rng() * opties.length) % opties.length];
      gebruikt.add(idee.id);

      // Kanalen: het hoofdkanaal roteert, stories gaan altijd mee.
      const hoofd = kanalen.filter((k) => !k.includes('story'));
      const stories = kanalen.filter((k) => k.includes('story'));
      const gekozenHoofd = hoofd.length ? [hoofd[(w * perWeek + i) % hoofd.length]] : [];
      const kanaalSet = [...gekozenHoofd, ...(i === 0 ? stories : [])];

      const tijden = kanaalById(kanaalSet[0] ?? 'instagram-feed').tijden;
      const tijd = tijden[i % tijden.length] === '—' ? '10:00' : tijden[i % tijden.length];

      regels.push({
        datum: isoDatum(datum),
        tijd,
        kanalen: kanaalSet.length ? kanaalSet : ['instagram-feed'],
        pilaar,
        idee,
      });
    }
  }

  return regels.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
}

/** Zet een planregel om in een echte campagne plus de bijbehorende posts. */
export function planRegelNaarCampagne(
  regel: PlanRegel,
  merk: Merk,
): { campagne: Campagne; posts: Post[] } {
  const actieveActie = merk.acties.find((a) => a.actief);
  const idee: Idee = {
    tekst: regel.idee.titel.replace('{plaats}', merk.werkgebied[0] ?? 'de regio'),
    doel: regel.idee.doel,
    hoek: regel.idee.hoek,
    doelgroepId: regel.idee.doelgroepId,
    actieId: regel.pilaar === 'aanbod' && actieveActie ? actieveActie.id : '',
    kanalen: regel.kanalen,
    sjabloonId: regel.idee.sjabloonId,
    context: '',
  };

  const seed = Math.floor(Math.random() * 1e9);
  const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const campagne: Campagne = {
    id,
    naam: regel.idee.titel.replace('{plaats}', merk.werkgebied[0] ?? 'de regio'),
    idee,
    uitwerking: werkIdeeUit(idee, merk, seed),
    aangepast: {},
    aangemaakt: Date.now(),
    gewijzigd: Date.now(),
    seed,
  };

  const posts: Post[] = regel.kanalen.map((kanaal, i) => ({
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}_${i}`,
    campagneId: id,
    kanaal,
    datum: regel.datum,
    tijd: regel.tijd,
    status: 'gepland',
    pilaar: regel.pilaar,
    notitie: regel.idee.beeld,
  }));

  return { campagne, posts };
}

/** Hoeveel posts staan er per pilaar in een periode — voor de balanscontrole. */
export function balans(posts: Post[]): Record<string, number> {
  const uit: Record<string, number> = {};
  for (const p of PILAREN) uit[p.id] = 0;
  for (const post of posts) uit[post.pilaar] = (uit[post.pilaar] ?? 0) + 1;
  return uit;
}
