/**
 * Tekengereedschap voor de sjablonen.
 *
 * Alles wordt op een canvas van de exacte exportmaat getekend. Daardoor is wat
 * je op het scherm ziet precies wat je downloadt — er zit geen tweede
 * renderstap tussen die dingen verschuift.
 */

import type { Formaat } from '../data/kanalen';

export interface Ctx {
  c: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Basiseenheid: schaalt alle maten mee met het formaat. */
  u: number;
  veilig: { x: number; y: number; w: number; h: number };
}

export function maakCtx(c: CanvasRenderingContext2D, formaat: Formaat): Ctx {
  const { breedte: w, hoogte: h, veilig } = formaat;
  return {
    c,
    w,
    h,
    u: Math.min(w, h) / 100,
    veilig: {
      x: veilig.links,
      y: veilig.boven,
      w: w - veilig.links - veilig.rechts,
      h: h - veilig.boven - veilig.onder,
    },
  };
}

/* --------------------------------------------------------------- vormen */

export function rechthoek(x: Ctx, px: number, py: number, pw: number, ph: number, kleur: string, radius = 0) {
  const { c } = x;
  c.fillStyle = kleur;
  if (radius > 0) {
    c.beginPath();
    c.roundRect(px, py, pw, ph, radius);
    c.fill();
  } else {
    c.fillRect(px, py, pw, ph);
  }
}

export function verloop(
  x: Ctx,
  px: number,
  py: number,
  pw: number,
  ph: number,
  stops: [number, string][],
  richting: 'verticaal' | 'horizontaal' = 'verticaal',
) {
  const { c } = x;
  const g =
    richting === 'verticaal'
      ? c.createLinearGradient(px, py, px, py + ph)
      : c.createLinearGradient(px, py, px + pw, py);
  for (const [pos, kleur] of stops) g.addColorStop(pos, kleur);
  c.fillStyle = g;
  c.fillRect(px, py, pw, ph);
}

/** Zwart verloop onderaan zodat witte tekst op elke foto leesbaar blijft. */
export function scrim(x: Ctx, vanaf = 0.35, sterkte = 0.85) {
  verloop(x, 0, x.h * vanaf, x.w, x.h * (1 - vanaf), [
    [0, 'rgba(0,0,0,0)'],
    [0.55, `rgba(0,0,0,${sterkte * 0.6})`],
    [1, `rgba(0,0,0,${sterkte})`],
  ]);
}

export function scrimBoven(x: Ctx, hoogte = 0.3, sterkte = 0.5) {
  verloop(x, 0, 0, x.w, x.h * hoogte, [
    [0, `rgba(0,0,0,${sterkte})`],
    [1, 'rgba(0,0,0,0)'],
  ]);
}

/* ---------------------------------------------------------------- beeld */

/** Tekent een afbeelding beeldvullend binnen een kader, zonder vervorming. */
export function beeldVullend(
  x: Ctx,
  img: CanvasImageSource,
  px: number,
  py: number,
  pw: number,
  ph: number,
  focus: { x: number; y: number } = { x: 0.5, y: 0.45 },
) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height;
  if (!iw || !ih) return;

  const schaal = Math.max(pw / iw, ph / ih);
  const bw = iw * schaal;
  const bh = ih * schaal;
  const bx = px + (pw - bw) * focus.x;
  const by = py + (ph - bh) * focus.y;

  x.c.save();
  x.c.beginPath();
  x.c.rect(px, py, pw, ph);
  x.c.clip();
  x.c.drawImage(img, bx, by, bw, bh);
  x.c.restore();
}

/** Vlak met een subtiel patroon van diagonale strepen — voor lege beeldvlakken. */
export function patroon(x: Ctx, px: number, py: number, pw: number, ph: number, kleur: string, achter: string) {
  rechthoek(x, px, py, pw, ph, achter);
  const { c } = x;
  c.save();
  c.beginPath();
  c.rect(px, py, pw, ph);
  c.clip();
  c.strokeStyle = kleur;
  c.lineWidth = x.u * 0.6;
  const stap = x.u * 4;
  for (let i = -ph; i < pw; i += stap) {
    c.beginPath();
    c.moveTo(px + i, py + ph);
    c.lineTo(px + i + ph, py);
    c.stroke();
  }
  c.restore();
}

/* ---------------------------------------------------------------- tekst */

export interface TekstOpties {
  font: string;
  grootte: number;
  gewicht: string;
  kleur: string;
  regelhoogte: number;
  spatiering?: number;
  hoofdletters?: boolean;
  uitlijning?: CanvasTextAlign;
  schaduw?: boolean;
}

function zetFont(x: Ctx, o: TekstOpties) {
  x.c.font = `${o.gewicht} ${o.grootte}px ${o.font}`;
  x.c.textAlign = o.uitlijning ?? 'left';
  x.c.textBaseline = 'alphabetic';
  // letterSpacing wordt door Chrome, Edge en Safari ondersteund; elders genegeerd.
  (x.c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    `${(o.spatiering ?? 0) * o.grootte}px`;
}

export function regelsVoor(x: Ctx, tekst: string, breedte: number, o: TekstOpties): string[] {
  zetFont(x, o);
  const bron = o.hoofdletters ? tekst.toUpperCase() : tekst;
  const regels: string[] = [];
  for (const alinea of bron.split('\n')) {
    let huidig = '';
    for (const woord of alinea.split(' ')) {
      const kandidaat = huidig ? `${huidig} ${woord}` : woord;
      if (x.c.measureText(kandidaat).width > breedte && huidig) {
        regels.push(huidig);
        huidig = woord;
      } else {
        huidig = kandidaat;
      }
    }
    regels.push(huidig);
  }
  return regels;
}

/** Tekent tekst met terugloop en geeft de hoogte terug die is gebruikt. */
export function tekst(
  x: Ctx,
  waarde: string,
  px: number,
  py: number,
  breedte: number,
  o: TekstOpties,
): number {
  const regels = regelsVoor(x, waarde, breedte, o);
  zetFont(x, o);
  const { c } = x;
  const regelH = o.grootte * o.regelhoogte;

  c.save();
  if (o.schaduw) {
    c.shadowColor = 'rgba(0,0,0,0.45)';
    c.shadowBlur = o.grootte * 0.25;
    c.shadowOffsetY = o.grootte * 0.04;
  }
  c.fillStyle = o.kleur;
  regels.forEach((regel, i) => {
    const tx = o.uitlijning === 'center' ? px + breedte / 2 : o.uitlijning === 'right' ? px + breedte : px;
    c.fillText(regel, tx, py + o.grootte + i * regelH);
  });
  c.restore();

  (x.c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0px';
  return regels.length * regelH;
}

/**
 * Zoekt de grootste lettergrootte waarbij de tekst binnen breedte én
 * maximaal aantal regels past. Zo blijft een kop altijd zo groot mogelijk
 * zonder dat hij uit het kader loopt.
 */
export function passendeGrootte(
  x: Ctx,
  waarde: string,
  breedte: number,
  o: Omit<TekstOpties, 'grootte'>,
  max: number,
  min: number,
  maxRegels: number,
): number {
  let grootte = max;
  while (grootte > min) {
    const regels = regelsVoor(x, waarde, breedte, { ...o, grootte });
    const past =
      regels.length <= maxRegels &&
      regels.every((r) => {
        zetFont(x, { ...o, grootte });
        return x.c.measureText(r).width <= breedte;
      });
    if (past) break;
    grootte -= Math.max(1, Math.round(grootte * 0.04));
  }
  return grootte;
}

/* -------------------------------------------------------------- elementen */

/** Gekleurd label, bijvoorbeeld voor de actie of de plaatsnaam. */
export function badge(
  x: Ctx,
  waarde: string,
  px: number,
  py: number,
  o: { achtergrond: string; kleur: string; font: string; grootte: number; hoek?: number },
): { w: number; h: number } {
  const { c } = x;
  c.save();
  c.font = `800 ${o.grootte}px ${o.font}`;
  const tw = c.measureText(waarde.toUpperCase()).width;
  const padX = o.grootte * 0.7;
  const padY = o.grootte * 0.45;
  const bw = tw + padX * 2;
  const bh = o.grootte + padY * 2;

  if (o.hoek) {
    c.translate(px + bw / 2, py + bh / 2);
    c.rotate((o.hoek * Math.PI) / 180);
    c.translate(-(px + bw / 2), -(py + bh / 2));
  }
  c.fillStyle = o.achtergrond;
  c.beginPath();
  c.roundRect(px, py, bw, bh, o.grootte * 0.22);
  c.fill();
  c.fillStyle = o.kleur;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(waarde.toUpperCase(), px + padX, py + bh / 2 + o.grootte * 0.04);
  c.restore();
  return { w: bw, h: bh };
}

/** Vinkje voor opsommingen. */
export function vinkje(x: Ctx, px: number, py: number, maat: number, kleur: string, opKleur: string) {
  const { c } = x;
  c.save();
  c.fillStyle = kleur;
  c.beginPath();
  c.arc(px + maat / 2, py + maat / 2, maat / 2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = opKleur;
  c.lineWidth = maat * 0.13;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(px + maat * 0.27, py + maat * 0.52);
  c.lineTo(px + maat * 0.43, py + maat * 0.68);
  c.lineTo(px + maat * 0.74, py + maat * 0.33);
  c.stroke();
  c.restore();
}

export function sterren(x: Ctx, px: number, py: number, maat: number, kleur: string, aantal = 5) {
  const { c } = x;
  c.save();
  c.fillStyle = kleur;
  for (let i = 0; i < aantal; i++) {
    ster(c, px + i * maat * 1.2 + maat / 2, py + maat / 2, maat / 2);
  }
  c.restore();
}

function ster(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const straal = i % 2 === 0 ? r : r * 0.45;
    const hoek = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(hoek) * straal;
    const py = cy + Math.sin(hoek) * straal;
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
}

/** Pijl die naar het tweede beeld wijst in een vóór/ná. */
export function pijl(x: Ctx, px: number, py: number, maat: number, kleur: string, achter: string) {
  const { c } = x;
  c.save();
  c.fillStyle = achter;
  c.beginPath();
  c.arc(px, py, maat, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = kleur;
  c.lineWidth = maat * 0.16;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(px - maat * 0.35, py);
  c.lineTo(px + maat * 0.3, py);
  c.moveTo(px + maat * 0.05, py - maat * 0.3);
  c.lineTo(px + maat * 0.35, py);
  c.lineTo(px + maat * 0.05, py + maat * 0.3);
  c.stroke();
  c.restore();
}

/* ------------------------------------------------------------------ kleur */

export function metAlfa(hex: string, alfa: number): string {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alfa})`;
}

/** Relatieve helderheid volgens WCAG — bepaalt of tekst wit of donker moet zijn. */
export function helderheid(hex: string): number {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const kanalen = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * kanalen[0] + 0.7152 * kanalen[1] + 0.0722 * kanalen[2];
}

export const leesbaarOp = (achtergrond: string): string =>
  helderheid(achtergrond) > 0.45 ? '#111827' : '#FFFFFF';
