import { useEffect, useState } from 'react';
import type { MediaRecord } from '../types';
import { beeldUrl, haalAlleMedia, verwijderBeeld, voegBeeldToe } from '../store/media';
import { Kaart, Leeg } from './ui';

const SOORTEN: { id: MediaRecord['soort']; label: string; uitleg: string }[] = [
  { id: 'voor', label: 'Vóór', uitleg: 'De oude situatie. Fotografeer recht van voren, bij daglicht.' },
  { id: 'na', label: 'Ná', uitleg: 'Exact hetzelfde standpunt als de vóór-foto. Dat maakt het verschil zichtbaar.' },
  { id: 'sfeer', label: 'Sfeer', uitleg: 'Details, licht door de pui, een mooi opgeleverde gevel.' },
  { id: 'team', label: 'Team', uitleg: 'Monteurs aan het werk, de bus, de koffiepauze.' },
  { id: 'review', label: 'Review', uitleg: 'Schermafbeeldingen van beoordelingen.' },
  { id: 'logo', label: 'Logo', uitleg: 'Bij voorkeur PNG met transparante achtergrond.' },
];

export function MediaScherm() {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<MediaRecord['soort'] | 'alles'>('alles');
  const [soort, setSoort] = useState<MediaRecord['soort']>('na');
  const [sleep, setSleep] = useState(false);
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

  const upload = async (bestanden: FileList | File[] | null) => {
    if (!bestanden) return;
    setBezig(true);
    setFout(null);
    try {
      for (const bestand of Array.from(bestanden)) {
        if (!bestand.type.startsWith('image/')) continue;
        await voegBeeldToe(bestand, soort);
      }
      await ververs();
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  const zichtbaar = filter === 'alles' ? media : media.filter((m) => m.soort === filter);
  const totaalMb = media.reduce((som, m) => som + m.blob.size, 0) / 1024 / 1024;

  return (
    <div>
      <Kaart
        titel="Beeldbank"
        hulp="Foto's blijven op dit apparaat. Ze worden automatisch verkleind naar maximaal 2000 pixels."
        rechts={<span className="telling">{media.length} bestanden · {totaalMb.toFixed(1)} MB</span>}
      >
        <div className="chips" style={{ marginBottom: 12 }}>
          {SOORTEN.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip"
              aria-pressed={soort === s.id}
              onClick={() => setSoort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="hulptekst" style={{ marginTop: 0 }}>
          {SOORTEN.find((s) => s.id === soort)?.uitleg}
        </p>

        <label
          className={`dropzone${sleep ? ' actief' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setSleep(true);
          }}
          onDragLeave={() => setSleep(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSleep(false);
            void upload(e.dataTransfer.files);
          }}
        >
          {bezig ? 'Bezig met verwerken…' : `Sleep foto's hierheen of klik om te kiezen — ze komen binnen als "${SOORTEN.find((s) => s.id === soort)?.label}"`}
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

        {fout && <div className="banner" style={{ marginTop: 12 }}>{fout}</div>}
      </Kaart>

      <Kaart
        titel="Alle beelden"
        rechts={
          <div className="chips">
            <button
              type="button"
              className="chip"
              aria-pressed={filter === 'alles'}
              onClick={() => setFilter('alles')}
            >
              Alles
            </button>
            {SOORTEN.map((s) => (
              <button
                key={s.id}
                type="button"
                className="chip"
                aria-pressed={filter === s.id}
                onClick={() => setFilter(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      >
        {zichtbaar.length === 0 ? (
          <Leeg tekst="Nog geen beelden in deze categorie." />
        ) : (
          <div className="medialijst">
            {zichtbaar.map((m) => (
              <div key={m.id} className="mediakaart">
                {urls[m.id] && <img src={urls[m.id]} alt={m.naam} />}
                <div className="onder">
                  <span>
                    {m.soort} · {m.breedte}×{m.hoogte}
                  </span>
                  <button
                    type="button"
                    className="knop klein stil"
                    onClick={async () => {
                      await verwijderBeeld(m.id);
                      await ververs();
                    }}
                    title="Verwijderen"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Kaart>
    </div>
  );
}
