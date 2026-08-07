/**
 * Beeldbeheer: foto's inlezen, verkleinen en als object-URL beschikbaar stellen.
 *
 * Telefoonfoto's zijn tegenwoordig 4000 pixels breed en 6 MB groot. Voor social
 * heb je aan 2000 pixels ruim genoeg — dat scheelt opslagruimte en maakt het
 * tekenen van previews merkbaar sneller.
 */

import type { ID, MediaRecord } from '../types';
import { alleMedia, bewaarMedia, laadMedia, verwijderMedia } from './db';

const MAX_ZIJDE = 2000;

export const nieuwId = (voorvoegsel = 'm'): ID =>
  `${voorvoegsel}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Leest een bestand in, verkleint het en bewaart het. */
export async function voegBeeldToe(bestand: File, soort: MediaRecord['soort']): Promise<MediaRecord> {
  const bitmap = await laadBitmap(bestand);
  const schaal = Math.min(1, MAX_ZIJDE / Math.max(bitmap.width, bitmap.height));
  const breedte = Math.round(bitmap.width * schaal);
  const hoogte = Math.round(bitmap.height * schaal);

  const canvas = document.createElement('canvas');
  canvas.width = breedte;
  canvas.height = hoogte;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Kan het beeld niet verwerken in deze browser.');
  c.imageSmoothingQuality = 'high';
  c.drawImage(bitmap, 0, 0, breedte, hoogte);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Omzetten van het beeld is mislukt.'))),
      // Logo's kunnen transparant zijn; die bewaren we als PNG.
      soort === 'logo' ? 'image/png' : 'image/jpeg',
      0.86,
    ),
  );

  const record: MediaRecord = {
    id: nieuwId(),
    blob,
    naam: bestand.name,
    breedte,
    hoogte,
    soort,
    gemaakt: Date.now(),
    tags: [],
  };
  await bewaarMedia(record);
  return record;
}

async function laadBitmap(bestand: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // imageOrientation zorgt dat staande telefoonfoto's niet gekanteld binnenkomen.
      return await createImageBitmap(bestand, { imageOrientation: 'from-image' });
    } catch {
      /* val terug op de img-route */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(bestand);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Deze afbeelding kan niet gelezen worden.'));
    };
    img.src = url;
  });
}

/* Object-URL's en geladen <img>-elementen worden hergebruikt: hetzelfde beeld
   wordt in de studio door meerdere previews tegelijk getekend. */
const urlCache = new Map<ID, string>();
const imgCache = new Map<ID, HTMLImageElement>();

export async function beeldUrl(id: ID): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id) ?? null;
  const record = await laadMedia(id);
  if (!record) return null;
  const url = URL.createObjectURL(record.blob);
  urlCache.set(id, url);
  return url;
}

export async function beeldElement(id: ID): Promise<HTMLImageElement | null> {
  const bestaand = imgCache.get(id);
  if (bestaand?.complete && bestaand.naturalWidth) return bestaand;

  const url = await beeldUrl(id);
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imgCache.set(id, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function verwijderBeeld(id: ID): Promise<void> {
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
  imgCache.delete(id);
  await verwijderMedia(id);
}

export const haalAlleMedia = alleMedia;
