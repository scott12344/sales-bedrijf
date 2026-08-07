import { useEffect, useMemo, useState } from 'react';
import type { Campagne, Doel, Hoek, ID, Idee, KanaalId, Post, Uitwerking } from '../types';
import { KANALEN, kanaalById } from '../data/kanalen';
import { DOELGROEPEN } from '../data/doelgroepen';
import { HOEKEN, pilaarVoorHoek } from '../data/pilaren';
import { SJABLONEN, sjabloonById, type Inhoud } from '../render/sjablonen';
import { werkIdeeUit } from '../engine/copy';
import { controleerActie, controleerUitwerking } from '../engine/controle';
import { useStore } from '../store/store';
import { nieuwId } from '../store/media';
import { Preview, rendersVoorKanalen } from './Preview';
import { BeeldKiezer } from './BeeldKiezer';
import { ChipKeuze, Kaart, Keuze, KopieerKnop, Meerregelig, Meldingen, Tabbladen, Tekst, Veld } from './ui';
import { blobNaarBytes, downloadBlob, maakZip, tekstNaarBytes, veiligeNaam } from '../export/bestanden';

const DOELEN: { waarde: Doel; label: string }[] = [
  { waarde: 'offerteaanvraag', label: 'Offerteaanvraag' },
  { waarde: 'bellen', label: 'Telefoontjes' },
  { waarde: 'whatsapp', label: 'WhatsApp-berichten' },
  { waarde: 'bereik', label: 'Bereik' },
  { waarde: 'volgers', label: 'Volgers' },
  { waarde: 'vertrouwen', label: 'Vertrouwen opbouwen' },
];

function leegIdee(kanalen: KanaalId[]): Idee {
  return {
    tekst: '',
    doel: 'offerteaanvraag',
    hoek: 'voor-na',
    doelgroepId: 'gezin-jaren-70',
    actieId: '',
    kanalen: kanalen.length ? kanalen : ['instagram-feed', 'facebook-feed'],
    sjabloonId: 'voor-na-split',
    context: '',
  };
}

/** Samenvoegen van de gegenereerde tekst met wat de gebruiker zelf heeft aangepast. */
function samengevoegd(uitwerking: Uitwerking, aangepast: Partial<Uitwerking>): Uitwerking {
  return { ...uitwerking, ...aangepast };
}

export function Studio({ bewerkId, naKlaar }: { bewerkId?: ID; naKlaar?: () => void }) {
  const { staat, verstuur } = useStore();
  const merk = staat.merk;

  const bestaande = bewerkId ? staat.campagnes.find((c) => c.id === bewerkId) : undefined;

  const [idee, setIdee] = useState<Idee>(() => bestaande?.idee ?? leegIdee(staat.instellingen.actieveKanalen));
  const [seed, setSeed] = useState<number>(() => bestaande?.seed ?? Math.floor(Math.random() * 1e9));
  const [aangepast, setAangepast] = useState<Partial<Uitwerking>>(() => bestaande?.aangepast ?? {});
  const [tab, setTab] = useState<'teksten' | 'advertenties' | 'video' | 'offline' | 'controle'>('teksten');
  const [plandatum, setPlandatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [plantijd, setPlantijd] = useState('12:00');
  const [gemeld, setGemeld] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!bestaande) return;
    setIdee(bestaande.idee);
    setSeed(bestaande.seed);
    setAangepast(bestaande.aangepast);
  }, [bewerkId]); // eslint-disable-line react-hooks/exhaustive-deps

  const basis = useMemo(() => werkIdeeUit(idee, merk, seed), [idee, merk, seed]);
  const uitwerking = useMemo(() => samengevoegd(basis, aangepast), [basis, aangepast]);

  const inhoud: Inhoud = {
    badge: uitwerking.badge,
    kop: uitwerking.kop,
    subkop: uitwerking.subkop,
    bullets: uitwerking.bullets,
    cta: uitwerking.cta,
    ctaSub: uitwerking.ctaSub,
  };

  const actie = merk.acties.find((a) => a.id === idee.actieId) ?? null;
  const meldingen = [
    ...controleerActie(actie),
    ...controleerUitwerking(uitwerking, merk, idee.kanalen),
  ];
  const blokkerend = meldingen.filter((m) => m.ernst === 'blokkerend').length;

  const wijzig = <K extends keyof Uitwerking>(sleutel: K, waarde: Uitwerking[K]) =>
    setAangepast((a) => ({ ...a, [sleutel]: waarde }));

  const bewaar = (): Campagne => {
    const naam = idee.tekst.trim() || uitwerking.kop || 'Naamloze campagne';
    if (bestaande) {
      const bijgewerkt: Campagne = {
        ...bestaande,
        naam,
        idee,
        uitwerking: basis,
        aangepast,
        seed,
        gewijzigd: Date.now(),
      };
      verstuur({ type: 'campagne-bijwerken', campagne: bijgewerkt });
      return bijgewerkt;
    }
    const campagne: Campagne = {
      id: nieuwId('c'),
      naam,
      idee,
      uitwerking: basis,
      aangepast,
      aangemaakt: Date.now(),
      gewijzigd: Date.now(),
      seed,
    };
    verstuur({ type: 'campagne-toevoegen', campagne });
    return campagne;
  };

  const bewaarEnMeld = () => {
    bewaar();
    setGemeld('Campagne bewaard.');
    naKlaar?.();
  };

  const planIn = () => {
    const campagne = bewaar();
    const posts: Post[] = idee.kanalen.map((kanaal) => ({
      id: nieuwId('p'),
      campagneId: campagne.id,
      kanaal,
      datum: plandatum,
      tijd: plantijd,
      status: 'gepland',
      pilaar: pilaarVoorHoek(idee.hoek).id,
      notitie: '',
    }));
    verstuur({ type: 'posts-toevoegen', posts });
    setGemeld(`${posts.length} post(s) ingepland op ${plandatum} om ${plantijd}.`);
  };

  const downloadPakket = async () => {
    setBezig(true);
    try {
      const naam = veiligeNaam(idee.tekst || uitwerking.kop || 'campagne');
      const renders = await rendersVoorKanalen(
        idee.kanalen,
        {
          sjabloonId: idee.sjabloonId,
          merk,
          inhoud,
          beeldVoorId: idee.mediaVoorId,
          beeldNaId: idee.mediaNaId,
        },
        merk.logoMediaId,
      );

      const bestanden = await Promise.all(
        renders.map(async (r) => ({
          naam: `beeld/${naam}-${r.kanaal}.png`,
          data: await blobNaarBytes(r.blob),
        })),
      );

      const teksten = idee.kanalen
        .map((k) => `=== ${kanaalById(k).label} ===\n\n${uitwerking.captions[k] ?? ''}\n`)
        .join('\n\n');

      const advertenties = uitwerking.advarianten
        .map(
          (a, i) =>
            `--- Variant ${i + 1} (${a.koopreden}) ---\nDoelgroep: ${a.doelgroep}\nKop: ${a.kop}\nTekst: ${a.tekst}\nBeschrijving: ${a.beschrijving}\nKnop: ${a.cta}\n`,
        )
        .join('\n');

      const video = [
        `Hook: ${uitwerking.video.hook}`,
        `Lengte: ${uitwerking.video.lengte} seconden`,
        `Muziek: ${uitwerking.video.muziek}`,
        '',
        ...uitwerking.video.scenes.map(
          (s) =>
            `${s.van}-${s.tot}s\n  Beeld: ${s.beeld}\n  Tekst op beeld: ${s.tekstOpBeeld}\n  Voice-over: ${s.voiceover}\n`,
        ),
      ].join('\n');

      const offline = [
        `FLYER KOP: ${uitwerking.offline.flyerKop}`,
        `FLYER TEKST:\n${uitwerking.offline.flyerTekst}`,
        '',
        `BOUWBORD: ${uitwerking.offline.bordTekst}`,
        '',
        `E-MAIL ONDERWERP: ${uitwerking.offline.emailOnderwerp}`,
        `E-MAIL:\n${uitwerking.offline.emailTekst}`,
        '',
        `WHATSAPP:\n${uitwerking.offline.whatsapp}`,
      ].join('\n');

      downloadBlob(
        maakZip([
          ...bestanden,
          { naam: 'teksten/captions.txt', data: tekstNaarBytes(teksten) },
          { naam: 'teksten/hashtags.txt', data: tekstNaarBytes(uitwerking.hashtags.join(' ')) },
          { naam: 'teksten/advertenties.txt', data: tekstNaarBytes(advertenties) },
          { naam: 'teksten/video-script.txt', data: tekstNaarBytes(video) },
          { naam: 'teksten/offline.txt', data: tekstNaarBytes(offline) },
        ]),
        `${naam}.zip`,
      );
      setGemeld('Pakket gedownload.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="studio">
      {/* ------------------------------------------------------- linkerkolom */}
      <div>
        <Kaart titel="Jouw idee" hulp="Eén zin is genoeg. De rest wordt automatisch uitgewerkt.">
          <Meerregelig
            label="Wat wil je posten?"
            waarde={idee.tekst}
            zet={(v) => setIdee({ ...idee, tekst: v })}
            plaatshouder="Bijvoorbeeld: vóór en ná van de woning aan de Dorpsstraat"
            regels={3}
          />

          <Veld label="Invalshoek">
            <ChipKeuze
              opties={HOEKEN.map((h) => ({ waarde: h.id, label: h.label }))}
              gekozen={[idee.hoek]}
              zet={(v) => {
                const hoek = (v[0] ?? 'voor-na') as Hoek;
                const passend = SJABLONEN.find((s) => s.hoeken.includes(hoek));
                setIdee({ ...idee, hoek, sjabloonId: passend?.id ?? idee.sjabloonId });
              }}
            />
            <p className="hulptekst">{HOEKEN.find((h) => h.id === idee.hoek)?.uitleg}</p>
          </Veld>

          <Keuze
            label="Wat moet deze post opleveren?"
            waarde={idee.doel}
            zet={(v) => setIdee({ ...idee, doel: v })}
            opties={DOELEN}
          />

          <Keuze
            label="Doelgroep"
            waarde={idee.doelgroepId}
            zet={(v) => setIdee({ ...idee, doelgroepId: v })}
            opties={DOELGROEPEN.map((d) => ({ waarde: d.id, label: d.label }))}
            hulp={DOELGROEPEN.find((d) => d.id === idee.doelgroepId)?.omschrijving}
          />

          <Keuze
            label="Actie meenemen"
            waarde={idee.actieId}
            zet={(v) => setIdee({ ...idee, actieId: v })}
            opties={[
              { waarde: '', label: 'Geen actie' },
              ...merk.acties.map((a) => ({
                waarde: a.id,
                label: `${a.claim}${a.actief ? '' : ' (staat uit)'}`,
              })),
            ]}
            hulp={
              idee.actieId && !merk.acties.find((a) => a.id === idee.actieId)?.actief
                ? 'Deze actie staat uit. Zet hem aan bij Merk om hem in de content te gebruiken.'
                : undefined
            }
          />
        </Kaart>

        <Kaart titel="Beeld">
          <BeeldKiezer
            label="Foto vóór"
            soort="voor"
            gekozen={idee.mediaVoorId}
            zet={(id) => setIdee((v) => ({ ...v, mediaVoorId: id }))}
          />
          <BeeldKiezer
            label="Foto ná (of hoofdbeeld)"
            soort="na"
            gekozen={idee.mediaNaId}
            zet={(id) => setIdee((v) => ({ ...v, mediaNaId: id }))}
          />
        </Kaart>

        <Kaart titel="Vormgeving">
          <Keuze
            label="Sjabloon"
            waarde={idee.sjabloonId}
            zet={(v) => setIdee({ ...idee, sjabloonId: v })}
            opties={SJABLONEN.map((s) => ({ waarde: s.id, label: s.label }))}
            hulp={sjabloonById(idee.sjabloonId).omschrijving}
          />

          <Veld label="Kanalen">
            <ChipKeuze
              meervoud
              opties={KANALEN.map((k) => ({ waarde: k.id, label: k.label }))}
              gekozen={idee.kanalen}
              zet={(v) => setIdee({ ...idee, kanalen: v.length ? v : ['instagram-feed'] })}
            />
          </Veld>

          <div className="knoprij">
            <button type="button" className="knop" onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>
              ↻ Andere uitwerking
            </button>
            {Object.keys(aangepast).length > 0 && (
              <button type="button" className="knop stil" onClick={() => setAangepast({})}>
                Eigen aanpassingen wissen
              </button>
            )}
          </div>
        </Kaart>

        <Kaart titel="Tekst op het beeld" hulp="Pas aan wat je wilt; de rest blijft automatisch.">
          <Tekst label="Label / actie" waarde={inhoud.badge} zet={(v) => wijzig('badge', v)} />
          <Tekst label="Kop" waarde={inhoud.kop} zet={(v) => wijzig('kop', v)} />
          <Tekst label="Subkop" waarde={inhoud.subkop} zet={(v) => wijzig('subkop', v)} />
          <Meerregelig
            label="Punten (één per regel)"
            waarde={inhoud.bullets.join('\n')}
            zet={(v) => wijzig('bullets', v.split('\n').filter((r) => r.trim()))}
            regels={4}
          />
          <Tekst label="Knoptekst" waarde={inhoud.cta} zet={(v) => wijzig('cta', v)} />
        </Kaart>
      </div>

      {/* ------------------------------------------------------ rechterkolom */}
      <div>
        <Kaart
          titel="Zo komt het eruit te zien"
          hulp="Precies de maten die de kanalen vragen — wat je hier ziet, is wat je downloadt."
          rechts={
            <div className="knoprij">
              <button type="button" className="knop" onClick={() => void downloadPakket()} disabled={bezig}>
                {bezig ? 'Bezig…' : '⤓ Download alles (zip)'}
              </button>
              <button type="button" className="knop primair" onClick={bewaarEnMeld}>
                Bewaren
              </button>
            </div>
          }
        >
          {blokkerend > 0 && (
            <div className="banner">
              Er {blokkerend === 1 ? 'staat 1 punt' : `staan ${blokkerend} punten`} open die je écht moet oplossen
              voordat dit online gaat. Kijk bij het tabblad <strong>Controle</strong>.
            </div>
          )}
          {gemeld && <div className="melding">{gemeld}</div>}

          <div className="previews">
            {idee.kanalen.map((k) => (
              <Preview
                key={k}
                sjabloonId={idee.sjabloonId}
                kanaal={k}
                merk={merk}
                inhoud={inhoud}
                beeldVoorId={idee.mediaVoorId}
                beeldNaId={idee.mediaNaId}
                naam={idee.tekst || uitwerking.kop}
              />
            ))}
          </div>
        </Kaart>

        <Kaart
          titel="Inplannen"
          hulp="Zet deze post in de kalender zodat je ritme blijft lopen."
          rechts={
            <div className="knoprij">
              <input type="date" value={plandatum} onChange={(e) => setPlandatum(e.target.value)} />
              <input type="time" value={plantijd} onChange={(e) => setPlantijd(e.target.value)} />
              <button type="button" className="knop primair" onClick={planIn}>
                Inplannen
              </button>
            </div>
          }
        >
          <p className="hulptekst">
            Beste tijden voor de gekozen kanalen:{' '}
            {idee.kanalen
              .map((k) => `${kanaalById(k).label} ${kanaalById(k).tijden.join('/')}`)
              .join(' · ')}
          </p>
        </Kaart>

        <Kaart titel="Teksten en varianten">
          <Tabbladen
            actief={tab}
            zet={setTab}
            tabs={[
              { id: 'teksten', label: 'Captions' },
              { id: 'advertenties', label: `Advertenties (${uitwerking.advarianten.length})` },
              { id: 'video', label: 'Video / Reel' },
              { id: 'offline', label: 'Flyer, mail & WhatsApp' },
              { id: 'controle', label: `Controle${meldingen.length ? ` (${meldingen.length})` : ''}` },
            ]}
          />

          <div style={{ marginTop: 14 }}>
            {tab === 'teksten' && (
              <div className="raster raster-2">
                {idee.kanalen.map((k) => {
                  const kanaal = kanaalById(k);
                  const caption = uitwerking.captions[k] ?? '';
                  return (
                    <div key={k}>
                      <div className="kaart-kop">
                        <div>
                          <h3>{kanaal.label}</h3>
                          <p className="telling">
                            {caption.length}/{kanaal.maxTekens} tekens
                          </p>
                        </div>
                        <KopieerKnop tekst={caption} />
                      </div>
                      <div className="tekstblok">{caption}</div>
                      <p className="hulptekst">{kanaal.stijl}</p>
                    </div>
                  );
                })}
                <div>
                  <div className="kaart-kop">
                    <h3>Hashtags</h3>
                    <KopieerKnop tekst={uitwerking.hashtags.join(' ')} />
                  </div>
                  <div className="tekstblok">{uitwerking.hashtags.join(' ')}</div>
                  <p className="hulptekst">
                    Lokale tags staan vooraan: die leveren in deze branche de meeste echte aanvragen op.
                  </p>
                </div>
              </div>
            )}

            {tab === 'advertenties' && (
              <table className="lijst">
                <thead>
                  <tr>
                    <th>Kop</th>
                    <th>Primaire tekst</th>
                    <th>Knop</th>
                    <th>Koopreden</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {uitwerking.advarianten.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{a.kop}</strong>
                        <div className="telling">{a.kop.length}/40</div>
                      </td>
                      <td>
                        {a.tekst}
                        <div className="hulptekst">{a.beschrijving}</div>
                      </td>
                      <td>{a.cta}</td>
                      <td>
                        <span className="label">{a.koopreden}</span>
                        <div className="hulptekst">{a.doelgroep}</div>
                      </td>
                      <td>
                        <KopieerKnop tekst={`${a.kop}\n\n${a.tekst}\n\n${a.beschrijving}\n${a.cta}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'video' && (
              <div>
                <p>
                  <strong>Hook (eerste 2 seconden):</strong> {uitwerking.video.hook}
                </p>
                <p className="hulptekst">
                  Totale lengte ± {uitwerking.video.lengte} seconden. {uitwerking.video.muziek}
                </p>
                <table className="lijst">
                  <thead>
                    <tr>
                      <th>Tijd</th>
                      <th>Wat film je</th>
                      <th>Tekst op beeld</th>
                      <th>Wat zeg je</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uitwerking.video.scenes.map((s, i) => (
                      <tr key={i}>
                        <td className="mono">
                          {s.van}–{s.tot}s
                        </td>
                        <td>{s.beeld}</td>
                        <td>
                          <strong>{s.tekstOpBeeld}</strong>
                        </td>
                        <td>{s.voiceover}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'offline' && (
              <div className="raster raster-2">
                <div>
                  <div className="kaart-kop">
                    <h3>Flyer</h3>
                    <KopieerKnop tekst={`${uitwerking.offline.flyerKop}\n\n${uitwerking.offline.flyerTekst}`} />
                  </div>
                  <div className="tekstblok">
                    {uitwerking.offline.flyerKop}
                    {'\n\n'}
                    {uitwerking.offline.flyerTekst}
                  </div>
                  <p className="hulptekst">
                    Kies bij Kanalen "Flyer A5" om hem drukklaar op 300 dpi te downloaden.
                  </p>
                </div>
                <div>
                  <div className="kaart-kop">
                    <h3>Bouwbord</h3>
                    <KopieerKnop tekst={uitwerking.offline.bordTekst} />
                  </div>
                  <div className="tekstblok">{uitwerking.offline.bordTekst}</div>
                </div>
                <div>
                  <div className="kaart-kop">
                    <h3>E-mail</h3>
                    <KopieerKnop
                      tekst={`Onderwerp: ${uitwerking.offline.emailOnderwerp}\n\n${uitwerking.offline.emailTekst}`}
                    />
                  </div>
                  <div className="tekstblok">
                    Onderwerp: {uitwerking.offline.emailOnderwerp}
                    {'\n\n'}
                    {uitwerking.offline.emailTekst}
                  </div>
                </div>
                <div>
                  <div className="kaart-kop">
                    <h3>WhatsApp</h3>
                    <KopieerKnop tekst={uitwerking.offline.whatsapp} />
                  </div>
                  <div className="tekstblok">{uitwerking.offline.whatsapp}</div>
                </div>
              </div>
            )}

            {tab === 'controle' && (
              <div>
                <Meldingen meldingen={meldingen} />
                <p className="hulptekst">
                  Deze controle kijkt naar claims, kanaallimieten en de opbouw van je post. Het is geen juridisch
                  advies — bij twijfel over een kortingsclaim leg je de onderbouwing vast bij de actie.
                </p>
              </div>
            )}
          </div>
        </Kaart>

        <Kaart titel="Waarom deze content werkt" hulp="Zodat je in een verkoopgesprek weet wat je zegt.">
          <div className="chips">
            {uitwerking.koopredenen.map((k) => (
              <span key={k} className="label">
                {k}
              </span>
            ))}
          </div>
          <p className="hulptekst" style={{ marginTop: 10 }}>
            Pilaar: <strong>{pilaarVoorHoek(idee.hoek).label}</strong> — {pilaarVoorHoek(idee.hoek).doel}
          </p>
        </Kaart>
      </div>
    </div>
  );
}
