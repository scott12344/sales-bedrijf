/**
 * Downloaden en exporteren.
 *
 * Alles gebeurt in de browser: PNG's uit het canvas, een ZIP die hier ter
 * plekke wordt opgebouwd (zonder externe bibliotheek), en een back-up van je
 * volledige werkbestand als JSON.
 */

export function downloadBlob(blob: Blob, bestandsnaam: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = bestandsnaam;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Even wachten: Safari heeft de URL nog nodig als de download start.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function canvasNaarBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kon het beeld niet opslaan.'))), type, 0.92),
  );
}

export const veiligeNaam = (naam: string): string =>
  naam
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) || 'campagne';

/* -------------------------------------------------------------------- zip */

/** CRC32, nodig voor een geldige ZIP-header. */
const crcTabel = (() => {
  const tabel = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabel[i] = c >>> 0;
  }
  return tabel;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTabel[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipBestand {
  naam: string;
  data: Uint8Array;
}

/**
 * Bouwt een ZIP zonder compressie (methode "stored"). Onze inhoud is vooral
 * JPEG en PNG — die comprimeren toch niet verder — dus dat kost niets en
 * scheelt een afhankelijkheid.
 */
export function maakZip(bestanden: ZipBestand[]): Blob {
  const codeer = new TextEncoder();
  const delen: Uint8Array[] = [];
  const centraal: Uint8Array[] = [];
  let offset = 0;

  for (const bestand of bestanden) {
    const naam = codeer.encode(bestand.naam);
    const crc = crc32(bestand.data);
    const maat = bestand.data.length;

    const lokaal = new Uint8Array(30 + naam.length);
    const lv = new DataView(lokaal.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, maat, true);
    lv.setUint32(22, maat, true);
    lv.setUint16(26, naam.length, true);
    lv.setUint16(28, 0, true);
    lokaal.set(naam, 30);

    delen.push(lokaal, bestand.data);

    const kop = new Uint8Array(46 + naam.length);
    const kv = new DataView(kop.buffer);
    kv.setUint32(0, 0x02014b50, true);
    kv.setUint16(4, 20, true);
    kv.setUint16(6, 20, true);
    kv.setUint16(8, 0, true);
    kv.setUint16(10, 0, true);
    kv.setUint16(12, 0, true);
    kv.setUint16(14, 0, true);
    kv.setUint32(16, crc, true);
    kv.setUint32(20, maat, true);
    kv.setUint32(24, maat, true);
    kv.setUint16(28, naam.length, true);
    kv.setUint32(42, offset, true);
    kop.set(naam, 46);
    centraal.push(kop);

    offset += lokaal.length + maat;
  }

  const centraalMaat = centraal.reduce((a, b) => a + b.length, 0);
  const eind = new Uint8Array(22);
  const ev = new DataView(eind.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, bestanden.length, true);
  ev.setUint16(10, bestanden.length, true);
  ev.setUint32(12, centraalMaat, true);
  ev.setUint32(16, offset, true);

  return new Blob([...delen, ...centraal, eind] as BlobPart[], { type: 'application/zip' });
}

export async function blobNaarBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

export const tekstNaarBytes = (tekst: string): Uint8Array => new TextEncoder().encode(tekst);

/* ---------------------------------------------------- zelfstandige kopie */

/**
 * De volledige pagina zoals hij bij het laden binnenkwam. In de gebouwde versie
 * zit de hele app in dat ene HTML-bestand, waardoor we er een werkende kopie
 * van kunnen wegschrijven met gegevens er al in.
 */
export let paginaBron = '';

export function bewaarPaginaBron() {
  paginaBron = `<!doctype html>\n${document.documentElement.outerHTML}`;
}

export function maakZelfstandigeKopie(gegevens: unknown, titel: string): Blob | null {
  if (!paginaBron || paginaBron.includes('/src/main.tsx')) return null;
  const json = JSON.stringify(gegevens).replace(/</g, '\\u003c');
  const injectie = `<script id="ingebedde-gegevens" type="application/json">${json}</script>`;
  const html = paginaBron
    .replace(/<title>[^<]*<\/title>/, `<title>${titel}</title>`)
    .replace('</body>', `${injectie}</body>`);
  return new Blob([html], { type: 'text/html' });
}
