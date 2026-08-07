import { useEffect, useMemo, useRef, useState } from 'react';
import type { ID, KanaalId, Merk } from '../types';
import { formaatVan, kanaalById } from '../data/kanalen';
import { ontbrekendBeeld, tekenOpCanvas, type Inhoud } from '../render/sjablonen';
import { beeldElement } from '../store/media';
import { canvasNaarBlob, downloadBlob, veiligeNaam } from '../export/bestanden';

export interface PreviewProps {
  sjabloonId: string;
  kanaal: KanaalId;
  merk: Merk;
  inhoud: Inhoud;
  beeldVoorId?: ID;
  beeldNaId?: ID;
  naam: string;
  compact?: boolean;
}

/** Laadt beelden en houdt ze vast zolang de id's niet veranderen. */
function useBeelden(ids: (ID | undefined)[]) {
  const sleutel = ids.join('|');
  const [beelden, setBeelden] = useState<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    let afgebroken = false;
    Promise.all(ids.map((id) => (id ? beeldElement(id) : Promise.resolve(null)))).then((geladen) => {
      if (!afgebroken) setBeelden(geladen);
    });
    return () => {
      afgebroken = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleutel]);

  return beelden;
}

export function Preview(props: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kanaal = kanaalById(props.kanaal);
  const formaat = formaatVan(props.kanaal);
  const [voor, na, logo] = useBeelden([props.beeldVoorId, props.beeldNaId, props.merk.logoMediaId]);

  const spec = useMemo(
    () => ({
      sjabloonId: props.sjabloonId,
      formaat,
      merk: props.merk,
      inhoud: props.inhoud,
      beeldVoor: voor,
      beeldNa: na,
      logo,
    }),
    [props.sjabloonId, props.merk, props.inhoud, formaat, voor, na, logo],
  );

  useEffect(() => {
    if (canvasRef.current) tekenOpCanvas(canvasRef.current, spec);
  }, [spec]);

  const waarschuwing = ontbrekendBeeld(props.sjabloonId, spec);

  const download = async () => {
    if (!canvasRef.current) return;
    const blob = await canvasNaarBlob(canvasRef.current);
    downloadBlob(blob, `${veiligeNaam(props.naam)}-${props.kanaal}.png`);
  };

  return (
    <div className="preview">
      <div className="preview-kop">
        <span>{kanaal.label}</span>
        <span className="preview-maat">
          {formaat.breedte}×{formaat.hoogte}
        </span>
      </div>
      <canvas ref={canvasRef} />
      {waarschuwing && !props.compact && <p className="hulptekst">{waarschuwing}</p>}
      {!props.compact && (
        <div className="knoprij">
          <button type="button" className="knop klein" onClick={download}>
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}

/** Geeft het canvas terug als blob — gebruikt bij het exporteren van een pakket. */
export async function rendersVoorKanalen(
  kanalen: KanaalId[],
  basis: Omit<PreviewProps, 'kanaal' | 'naam' | 'compact'>,
  merkLogoId?: ID,
): Promise<{ kanaal: KanaalId; blob: Blob }[]> {
  const [voor, na, logo] = await Promise.all([
    basis.beeldVoorId ? beeldElement(basis.beeldVoorId) : null,
    basis.beeldNaId ? beeldElement(basis.beeldNaId) : null,
    merkLogoId ? beeldElement(merkLogoId) : null,
  ]);

  const uit: { kanaal: KanaalId; blob: Blob }[] = [];
  for (const kanaal of kanalen) {
    const canvas = document.createElement('canvas');
    tekenOpCanvas(canvas, {
      sjabloonId: basis.sjabloonId,
      formaat: formaatVan(kanaal),
      merk: basis.merk,
      inhoud: basis.inhoud,
      beeldVoor: voor,
      beeldNa: na,
      logo,
    });
    uit.push({ kanaal, blob: await canvasNaarBlob(canvas) });
  }
  return uit;
}
