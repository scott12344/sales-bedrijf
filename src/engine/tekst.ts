/** Gedeelde tekstgereedschappen voor de contentmotor. */

import type { Merk } from '../types';

/** Deterministische pseudo-random: dezelfde seed geeft altijd dezelfde campagne. */
export function maakRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function kies<T>(rng: () => number, lijst: T[]): T {
  return lijst[Math.floor(rng() * lijst.length) % lijst.length];
}

export function kiesMeerdere<T>(rng: () => number, lijst: T[], aantal: number): T[] {
  const kopie = [...lijst];
  const uit: T[] = [];
  while (kopie.length && uit.length < aantal) {
    uit.push(kopie.splice(Math.floor(rng() * kopie.length), 1)[0]);
  }
  return uit;
}

export interface Variabelen {
  bedrijf: string;
  plaats: string;
  actie: string;
  actieWaarop: string;
  garantie: string;
  jaren: string;
  jaarOpgericht: string;
  score: string;
  aantal: string;
  telefoon: string;
  website: string;
  whatsapp: string;
  projecten: string;
}

export function bouwVariabelen(merk: Merk, actieClaim: string, actieWaarop: string): Variabelen {
  const jaar = new Date().getFullYear();
  const opgericht = parseInt(merk.bewijs.jaarOpgericht, 10);
  return {
    bedrijf: merk.bedrijfsnaam || 'ons bedrijf',
    plaats: merk.werkgebied[0] || 'de regio',
    actie: actieClaim || 'onze actie',
    actieWaarop: actieWaarop || '',
    garantie: merk.bewijs.garantieJaren || '10',
    jaren: Number.isFinite(opgericht) ? String(jaar - opgericht) : 'jaren',
    jaarOpgericht: merk.bewijs.jaarOpgericht || '',
    score: merk.bewijs.reviewScore || '9,2',
    aantal: merk.bewijs.reviewAantal || '100',
    telefoon: merk.telefoon,
    website: merk.website,
    whatsapp: merk.whatsapp || merk.telefoon,
    projecten: merk.bewijs.projectenPerJaar || '',
  };
}

/** Vervangt {variabelen} in een tekst. Onbekende plaatshouders blijven staan zodat je ze ziet. */
export function vul(tekst: string, v: Variabelen): string {
  return tekst.replace(/\{(\w+)\}/g, (heel, naam: string) => {
    const waarde = (v as unknown as Record<string, string>)[naam];
    return waarde !== undefined && waarde !== '' ? waarde : heel;
  });
}

/** Ruimt achtergebleven plaatshouders en dubbele spaties op. */
export function opschonen(tekst: string): string {
  return tekst
    .replace(/\{\w+\}/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([.,!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function titelCase(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Kort af op een woordgrens, zodat captions binnen de kanaallimiet blijven. */
export function kortAf(tekst: string, max: number): string {
  if (tekst.length <= max) return tekst;
  const geknipt = tekst.slice(0, max - 1);
  const spatie = geknipt.lastIndexOf(' ');
  return `${geknipt.slice(0, spatie > max * 0.6 ? spatie : geknipt.length)}…`;
}

/** Telt woorden — gebruikt om te waarschuwen bij te lange koppen op beeld. */
export const woorden = (t: string): number => t.trim().split(/\s+/).filter(Boolean).length;
