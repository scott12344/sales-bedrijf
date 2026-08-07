import { useState } from 'react';
import type { Post } from '../types';
import { kanaalById } from '../data/kanalen';
import { adapterVoor, koppelingVoorKanaal, ADAPTERS } from '../publish/adapters';
import { useStore } from '../store/store';
import { rendersVoorKanalen } from './Preview';
import { Kaart, KopieerKnop, Leeg, Tekst, Veld, Vinkje } from './ui';
import {
  downloadBlob,
  maakZelfstandigeKopie,
  veiligeNaam,
} from '../export/bestanden';
import { leegStaat } from '../store/store';

/** Beeld als data-URL, zodat een webhook of server het direct kan verwerken. */
async function beeldDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lezer = new FileReader();
    lezer.onload = () => resolve(String(lezer.result));
    lezer.onerror = () => reject(new Error('Kon het beeld niet omzetten.'));
    lezer.readAsDataURL(blob);
  });
}

export function KoppelingenScherm() {
  const { staat, verstuur } = useStore();
  const [bezig, setBezig] = useState<string | null>(null);
  const [log, setLog] = useState<{ tijd: string; tekst: string; gelukt: boolean }[]>([]);

  const meld = (tekst: string, gelukt: boolean) =>
    setLog((l) => [{ tijd: new Date().toLocaleTimeString('nl-NL'), tekst, gelukt }, ...l].slice(0, 20));

  const wachtrij = staat.posts
    .filter((p) => p.status === 'gepland' || p.status === 'goedgekeurd')
    .sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd))
    .slice(0, 25);

  const publiceer = async (post: Post) => {
    const campagne = staat.campagnes.find((c) => c.id === post.campagneId);
    if (!campagne) return;
    setBezig(post.id);
    try {
      const uitwerking = { ...campagne.uitwerking, ...campagne.aangepast };
      const koppeling = koppelingVoorKanaal(staat.koppelingen, post.kanaal);

      if (!koppeling) {
        meld(
          `Geen actieve koppeling voor ${kanaalById(post.kanaal).label}. Download het beeld en plaats het zelf.`,
          false,
        );
        return;
      }

      const adapter = adapterVoor(koppeling);
      if (!adapter.klaar(koppeling)) {
        meld(`${koppeling.naam}: ${adapter.uitleg(koppeling)}`, false);
        return;
      }

      const [render] = await rendersVoorKanalen(
        [post.kanaal],
        {
          sjabloonId: campagne.idee.sjabloonId,
          merk: staat.merk,
          inhoud: {
            badge: uitwerking.badge,
            kop: uitwerking.kop,
            subkop: uitwerking.subkop,
            bullets: uitwerking.bullets,
            cta: uitwerking.cta,
            ctaSub: uitwerking.ctaSub,
          },
          beeldVoorId: campagne.idee.mediaVoorId,
          beeldNaId: campagne.idee.mediaNaId,
        },
        staat.merk.logoMediaId,
      );

      const resultaat = await adapter.publiceer(koppeling, {
        post,
        campagne,
        kanaal: post.kanaal,
        caption: uitwerking.captions[post.kanaal] ?? '',
        beeld: await beeldDataUrl(render.blob),
        gepland: `${post.datum}T${post.tijd}`,
      });

      meld(`${kanaalById(post.kanaal).label}: ${resultaat.melding}`, resultaat.gelukt);
      if (resultaat.gelukt) {
        verstuur({
          type: 'post-bijwerken',
          post: { ...post, status: 'gepubliceerd', gepubliceerdOp: Date.now() },
        });
      } else {
        verstuur({ type: 'post-bijwerken', post: { ...post, status: 'mislukt', fout: resultaat.melding } });
      }
    } finally {
      setBezig(null);
    }
  };

  const backup = () => {
    const blob = new Blob([JSON.stringify(staat, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `marketing-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const herstel = (bestand: File | undefined) => {
    if (!bestand) return;
    const lezer = new FileReader();
    lezer.onload = () => {
      try {
        const gegevens = JSON.parse(String(lezer.result));
        verstuur({ type: 'alles-vervangen', staat: { ...leegStaat(), ...gegevens } });
        meld('Back-up teruggezet.', true);
      } catch {
        meld('Dit bestand kon niet gelezen worden.', false);
      }
    };
    lezer.readAsText(bestand);
  };

  const zelfstandigeKopie = () => {
    const blob = maakZelfstandigeKopie(staat, `${staat.merk.bedrijfsnaam} — marketing`);
    if (!blob) {
      meld(
        'Een zelfstandige kopie kan alleen vanuit de gebouwde versie (npm run build). In de ontwikkelmodus zit de code nog in losse bestanden.',
        false,
      );
      return;
    }
    downloadBlob(blob, `${veiligeNaam(staat.merk.bedrijfsnaam)}-marketing.html`);
    meld('Zelfstandige kopie gedownload.', true);
  };

  return (
    <div>
      <Kaart
        titel="Wat je moet weten over automatisch publiceren"
        hulp="Zodat je geen tijd verliest aan een route die niet kan werken."
      >
        <p>
          Instagram, Facebook en TikTok laten <strong>niet</strong> toe dat een webpagina rechtstreeks namens jou
          post. Dat moet altijd via een server met een toegangstoken, en met een app die door het platform is
          goedgekeurd. Daarom zijn er drie routes, van snel naar volledig:
        </p>
        <ol>
          <li>
            <strong>Webhook</strong> — werkt vandaag. Je vult de URL in van Make, Zapier, n8n of je eigen server;
            die ontvangt beeld en tekst en plaatst de post. Geen app-review nodig.
          </li>
          <li>
            <strong>Eigen publicatieserver</strong> — jij draait een server die met de Meta Graph API en de TikTok
            Content Posting API praat. Deze app stuurt de posts naar jouw server. Vereist bedrijfsaccounts en een
            goedgekeurde app; dat duurt doorgaans dagen tot weken.
          </li>
          <li>
            <strong>Handmatig</strong> — altijd beschikbaar: download het beeld, kopieer de tekst, plaats hem zelf.
          </li>
        </ol>
      </Kaart>

      <div className="raster raster-2">
        {staat.koppelingen.map((koppeling) => {
          const adapter = ADAPTERS[koppeling.type];
          const klaar = adapter.klaar(koppeling);
          return (
            <Kaart
              key={koppeling.id}
              titel={koppeling.naam}
              rechts={
                <span
                  className="label"
                  style={{
                    background: koppeling.actief && klaar ? 'var(--goed)' : 'var(--paneel-2)',
                    color: koppeling.actief && klaar ? '#0b1220' : undefined,
                  }}
                >
                  {koppeling.actief ? (klaar ? 'Actief' : 'Onvolledig') : 'Uit'}
                </span>
              }
            >
              <p className="hulptekst">{adapter.uitleg(koppeling)}</p>

              {koppeling.type === 'webhook' && (
                <Tekst
                  label="Webhook-URL"
                  waarde={koppeling.webhookUrl}
                  zet={(v) => verstuur({ type: 'koppeling-bijwerken', koppeling: { ...koppeling, webhookUrl: v } })}
                  plaatshouder="https://hook.eu2.make.com/…"
                  type="url"
                />
              )}

              {(koppeling.type === 'meta' || koppeling.type === 'tiktok') && (
                <Tekst
                  label="Adres van je publicatieserver"
                  waarde={koppeling.apiBasis}
                  zet={(v) => verstuur({ type: 'koppeling-bijwerken', koppeling: { ...koppeling, apiBasis: v } })}
                  plaatshouder="https://api.jouwbedrijf.nl"
                  type="url"
                  hulp="Deze app stuurt de post naar jouw server; het toegangstoken blijft daar en komt nooit in de browser."
                />
              )}

              <Vinkje
                label="Koppeling gebruiken"
                aan={koppeling.actief}
                zet={(v) => verstuur({ type: 'koppeling-bijwerken', koppeling: { ...koppeling, actief: v } })}
              />

              <Veld label="Kanalen via deze koppeling">
                <div className="chips">
                  {koppeling.kanalen.map((k) => (
                    <span key={k} className="label">
                      {kanaalById(k).label}
                    </span>
                  ))}
                </div>
              </Veld>
            </Kaart>
          );
        })}
      </div>

      <Kaart titel="Publicatiewachtrij" hulp="Alles wat gepland staat. Publiceren gaat via de actieve koppeling.">
        {wachtrij.length === 0 ? (
          <Leeg tekst="Niets gepland. Vul de kalender bij Kalender." />
        ) : (
          <table className="lijst">
            <thead>
              <tr>
                <th>Wanneer</th>
                <th>Kanaal</th>
                <th>Campagne</th>
                <th>Route</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {wachtrij.map((post) => {
                const campagne = staat.campagnes.find((c) => c.id === post.campagneId);
                const koppeling = koppelingVoorKanaal(staat.koppelingen, post.kanaal);
                const caption =
                  campagne && ({ ...campagne.uitwerking, ...campagne.aangepast }.captions[post.kanaal] ?? '');
                return (
                  <tr key={post.id}>
                    <td className="mono">
                      {post.datum} {post.tijd}
                    </td>
                    <td>{kanaalById(post.kanaal).label}</td>
                    <td>{campagne?.naam ?? '—'}</td>
                    <td>{koppeling ? koppeling.naam : <span className="hulptekst">handmatig</span>}</td>
                    <td>
                      <div className="knoprij">
                        {caption && <KopieerKnop tekst={caption} label="Tekst" />}
                        <button
                          type="button"
                          className="knop klein"
                          disabled={bezig === post.id}
                          onClick={() => void publiceer(post)}
                        >
                          {bezig === post.id ? 'Bezig…' : 'Publiceren'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h3>Logboek</h3>
            {log.map((r, i) => (
              <div key={i} className={`melding ${r.gelukt ? '' : 'blokkerend'}`}>
                <strong>{r.tijd}</strong>
                {r.tekst}
              </div>
            ))}
          </div>
        )}
      </Kaart>

      <Kaart titel="Back-up en delen" hulp="Alles staat op dit apparaat. Maak dus regelmatig een back-up.">
        <div className="knoprij">
          <button type="button" className="knop" onClick={backup}>
            ⤓ Back-up downloaden (JSON)
          </button>
          <label className="knop" style={{ cursor: 'pointer' }}>
            ⤒ Back-up terugzetten
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                herstel(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className="knop" onClick={zelfstandigeKopie}>
            ⤓ Zelfstandige kopie (HTML)
          </button>
        </div>
        <p className="hulptekst">
          De zelfstandige kopie is één HTML-bestand met de complete app én je gegevens erin. Handig om op een tweede
          laptop te zetten of naar een collega te sturen — het werkt zonder installatie en zonder internet.
        </p>
      </Kaart>
    </div>
  );
}
