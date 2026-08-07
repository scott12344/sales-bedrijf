import { useEffect, useState } from 'react';
import type { ID, MediaRecord } from '../types';
import { beeldUrl, haalAlleMedia, voegBeeldToe } from '../store/media';

/**
 * Kiest een beeld uit de bibliotheek of neemt er meteen een op. Op een telefoon
 * opent "Nieuwe foto" direct de camera, zodat je op locatie kunt vastleggen.
 */
export function BeeldKiezer({
  label,
  soort,
  gekozen,
  zet,
}: {
  label: string;
  soort: MediaRecord['soort'];
  gekozen?: ID;
  zet: (id: ID | undefined) => void;
}) {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const ververs = async () => {
    const alles = await haalAlleMedia();
    alles.sort((a, b) => b.gemaakt - a.gemaakt);
    setMedia(alles);
    const nieuw: Record<string, string> = {};
    for (const m of alles) {
      const url = await beeldUrl(m.id);
      if (url) nieuw[m.id] = url;
    }
    setUrls(nieuw);
  };

  useEffect(() => {
    void ververs();
  }, []);

  const upload = async (bestanden: FileList | null) => {
    if (!bestanden?.length) return;
    setBezig(true);
    setFout(null);
    try {
      let laatste: ID | undefined;
      for (const bestand of Array.from(bestanden)) {
        const record = await voegBeeldToe(bestand, soort);
        laatste = record.id;
      }
      await ververs();
      if (laatste) zet(laatste);
      setOpen(false);
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="veld">
      <span>{label}</span>
      <div className="knoprij" style={{ marginBottom: 8 }}>
        {gekozen && urls[gekozen] ? (
          <img
            src={urls[gekozen]}
            alt=""
            style={{ width: 84, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--rand)' }}
          />
        ) : (
          <div
            style={{
              width: 84,
              height: 60,
              borderRadius: 8,
              border: '1px dashed var(--rand)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--tekst-uit)',
              fontSize: 11,
            }}
          >
            geen
          </div>
        )}
        <div className="knoprij">
          <button type="button" className="knop klein" onClick={() => setOpen((o) => !o)}>
            {open ? 'Sluiten' : 'Kiezen'}
          </button>
          <label className="knop klein" style={{ cursor: 'pointer' }}>
            {bezig ? 'Bezig…' : 'Nieuwe foto'}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          {gekozen && (
            <button type="button" className="knop klein stil" onClick={() => zet(undefined)}>
              Wissen
            </button>
          )}
        </div>
      </div>

      {fout && <p className="hulptekst" style={{ color: 'var(--fout)' }}>{fout}</p>}

      {open && (
        <div className="medialijst" style={{ marginTop: 8 }}>
          {media.length === 0 && <p className="hulptekst">Nog geen foto's. Voeg er een toe met "Nieuwe foto".</p>}
          {media.map((m) => (
            <button
              key={m.id}
              type="button"
              className="mediakaart"
              style={{
                padding: 0,
                cursor: 'pointer',
                outline: gekozen === m.id ? '2px solid var(--accent)' : 'none',
              }}
              onClick={() => {
                zet(m.id);
                setOpen(false);
              }}
            >
              {urls[m.id] && <img src={urls[m.id]} alt={m.naam} />}
              <div className="onder">
                <span>{m.soort}</span>
                <span>
                  {m.breedte}×{m.hoogte}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
