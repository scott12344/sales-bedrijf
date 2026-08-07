/**
 * Controle op content vóór publicatie.
 *
 * Twee soorten meldingen:
 *  - regels: claims die je in Nederland alleen mag maken als je ze kunt
 *    onderbouwen. Sinds de implementatie van de Omnibusrichtlijn (Prijzenbesluit,
 *    gehandhaafd door de ACM) moet de doorgestreepte "van"-prijs de laagste
 *    prijs zijn die je de laatste 30 dagen hebt gerekend. Ook "op=op",
 *    "gratis" en garantietermijnen moeten kloppen.
 *  - vakwerk: dingen die niet verboden zijn maar je bereik of conversie kosten.
 *
 * Dit is geen juridisch advies; het is een checklist die je behoedt voor de
 * fouten die in deze branche het vaakst tot klachten leiden.
 */

import type { Actie, KanaalId, Merk, Uitwerking } from '../types';
import { kanaalById } from '../data/kanalen';
import { woorden } from './tekst';

export type Ernst = 'blokkerend' | 'let-op' | 'tip';

export interface Melding {
  ernst: Ernst;
  onderwerp: string;
  tekst: string;
  oplossing: string;
}

export function controleerActie(actie: Actie | null): Melding[] {
  const uit: Melding[] = [];
  if (!actie || !actie.actief) return uit;

  const heeftPercentage = /(\d+)\s*%/.test(actie.claim);
  const heeftGratis = /gratis|cadeau|0[ ,.]?-/i.test(actie.claim);

  if (heeftPercentage && !actie.referentieprijsGetoetst) {
    uit.push({
      ernst: 'blokkerend',
      onderwerp: 'Kortingsclaim niet getoetst',
      tekst:
        `Je claimt "${actie.claim}". Een kortingspercentage moet je berekenen vanaf de laagste prijs die je in de 30 dagen ` +
        'ervoor hebt gehanteerd. Doe je dat niet, dan is de claim misleidend en kan de ACM handhaven.',
      oplossing:
        'Vink bij de actie aan dat je de referentieprijs hebt getoetst en leg in het veld "onderbouwing" vast welke prijs je de afgelopen 30 dagen rekende.',
    });
  }

  if (heeftPercentage && !actie.waarop.trim()) {
    uit.push({
      ernst: 'blokkerend',
      onderwerp: 'Onduidelijk waarop de korting geldt',
      tekst:
        'Een percentage zonder te vermelden waarop het slaat wekt de indruk dat het voor de hele order geldt. Dat is de klacht die je het vaakst terugkrijgt.',
      oplossing: 'Vul bij de actie in waarop de korting precies geldt, bijvoorbeeld "op de montage bij een complete woning".',
    });
  }

  if (!actie.geldigTot) {
    uit.push({
      ernst: 'let-op',
      onderwerp: 'Geen einddatum',
      tekst:
        'Een actie zonder einddatum die maandenlang doorloopt verliest zijn werking én is juridisch kwetsbaar: het is dan geen actie meer maar je normale prijs.',
      oplossing: 'Zet een einddatum op de actie en verleng hem bewust in plaats van stilzwijgend.',
    });
  } else {
    const eind = new Date(actie.geldigTot);
    if (!Number.isNaN(eind.getTime()) && eind.getTime() < Date.now()) {
      uit.push({
        ernst: 'blokkerend',
        onderwerp: 'Actie is verlopen',
        tekst: `Deze actie liep tot ${actie.geldigTot}. Content die nu nog live gaat met deze claim klopt niet meer.`,
        oplossing: 'Verleng de actie met een nieuwe einddatum of zet hem op inactief.',
      });
    }
  }

  if (heeftGratis && !actie.voorwaarden.trim()) {
    uit.push({
      ernst: 'let-op',
      onderwerp: '"Gratis" zonder voorwaarden',
      tekst: 'Als er iets tegenover staat (minimale afname, combinatie met een opdracht) mag je het niet zonder meer gratis noemen.',
      oplossing: 'Zet de voorwaarde erbij, ook al is het klein op het beeld: "bij opdracht vanaf 6 elementen".',
    });
  }

  if (/op\s*=\s*op|laatste|nog \d+/i.test(actie.claim) && !actie.onderbouwing.trim()) {
    uit.push({
      ernst: 'let-op',
      onderwerp: 'Schaarste moet echt zijn',
      tekst: 'Claims als "op=op" of "nog 3 plekken" moeten kloppen. Terugkerende nep-schaarste is misleidend en kost je bovendien geloofwaardigheid.',
      oplossing: 'Leg in de onderbouwing vast hoeveel plekken er werkelijk zijn en wanneer je dat controleerde.',
    });
  }

  return uit;
}

export function controleerUitwerking(uitwerking: Uitwerking, merk: Merk, kanalen: KanaalId[]): Melding[] {
  const uit: Melding[] = [];

  const alleTekst = [
    uitwerking.kop,
    uitwerking.subkop,
    ...uitwerking.bullets,
    ...Object.values(uitwerking.captions),
  ]
    .join(' ')
    .toLowerCase();

  for (const woord of merk.verbodenWoorden) {
    if (woord.trim() && alleTekst.includes(woord.toLowerCase())) {
      uit.push({
        ernst: 'let-op',
        onderwerp: 'Verboden woord',
        tekst: `De tekst bevat "${woord}", dat je in je merkprofiel hebt uitgesloten.`,
        oplossing: 'Herschrijf die zin of haal het woord uit je lijst als het toch mag.',
      });
    }
  }

  if (/beste van nederland|goedkoopste|nummer 1|marktleider/i.test(alleTekst)) {
    uit.push({
      ernst: 'blokkerend',
      onderwerp: 'Superlatief zonder bewijs',
      tekst:
        'Claims als "goedkoopste" of "nummer 1" moet je hard kunnen maken met een vergelijkend onderzoek. Kun je dat niet, dan is het misleidende reclame.',
      oplossing: 'Vervang door een claim die je wél kunt bewijzen, bijvoorbeeld je reviewscore of het aantal projecten.',
    });
  }

  if (/\d+\s*%\s*(minder|besparing|bespaar)/i.test(alleTekst)) {
    uit.push({
      ernst: 'let-op',
      onderwerp: 'Besparingspercentage',
      tekst:
        'Een concreet besparingspercentage suggereert een resultaat dat per woning verschilt. Zonder "tot" en zonder uitleg van de uitgangssituatie is dat kwetsbaar.',
      oplossing: 'Schrijf "tot X%" en noem waarop het gebaseerd is, bijvoorbeeld enkel glas naar HR++.',
    });
  }

  if (/subsidie/i.test(alleTekst)) {
    uit.push({
      ernst: 'tip',
      onderwerp: 'Subsidie noemen',
      tekst: 'Subsidiebedragen en voorwaarden veranderen regelmatig. Een concreet bedrag is snel achterhaald.',
      oplossing: 'Houd het op "we zoeken uit wat er in jouw situatie mogelijk is" in plaats van een bedrag te noemen.',
    });
  }

  if (woorden(uitwerking.kop) > 8) {
    uit.push({
      ernst: 'let-op',
      onderwerp: 'Kop te lang voor op beeld',
      tekst: `De kop telt ${woorden(uitwerking.kop)} woorden. Op een tijdlijn wordt hij dan te klein gezet om nog te stoppen.`,
      oplossing: 'Kort in naar maximaal 6 woorden; de rest kan in de caption.',
    });
  }

  if (!merk.telefoon && !merk.website && !merk.whatsapp) {
    uit.push({
      ernst: 'blokkerend',
      onderwerp: 'Geen contactmogelijkheid',
      tekst: 'Er staat nergens hoe iemand je kan bereiken. Elke aanvraag die je hiermee misloopt is er één te veel.',
      oplossing: 'Vul in het merkprofiel minimaal een telefoonnummer of website in.',
    });
  }

  for (const kid of kanalen) {
    const kanaal = kanaalById(kid);
    const caption = uitwerking.captions[kid] ?? '';
    if (caption.length > kanaal.maxTekens) {
      uit.push({
        ernst: 'let-op',
        onderwerp: `Caption te lang voor ${kanaal.label}`,
        tekst: `${caption.length} tekens tegenover een praktische limiet van ${kanaal.maxTekens}.`,
        oplossing: 'Kort de caption in — de eerste twee regels doen toch het werk.',
      });
    }
    if (kanaal.klikbareLink === false && /https?:\/\//.test(caption)) {
      uit.push({
        ernst: 'tip',
        onderwerp: `Link werkt niet op ${kanaal.label}`,
        tekst: 'Op dit kanaal is een link in de tekst niet klikbaar; mensen typen hem zelden over.',
        oplossing: 'Verwijs naar de link in je bio, of gebruik een goed te onthouden telefoonnummer.',
      });
    }
  }

  if (merk.werkgebied.length === 0) {
    uit.push({
      ernst: 'tip',
      onderwerp: 'Geen werkgebied ingesteld',
      tekst: 'Zonder plaatsnamen mist je content de lokale haak die in deze branche het meeste oplevert.',
      oplossing: 'Vul je werkgebied in bij het merkprofiel; plaatsnamen komen dan automatisch in teksten en hashtags.',
    });
  }

  return uit;
}

export const ernstKleur: Record<Ernst, string> = {
  blokkerend: '#DC2626',
  'let-op': '#D97706',
  tip: '#2563EB',
};

export const ernstLabel: Record<Ernst, string> = {
  blokkerend: 'Los dit op',
  'let-op': 'Let op',
  tip: 'Tip',
};
