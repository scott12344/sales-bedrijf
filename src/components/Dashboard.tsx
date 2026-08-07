import { useMemo } from 'react';
import { kanaalById } from '../data/kanalen';
import { PILAREN, pilaarById, SEIZOENSHAKEN } from '../data/pilaren';
import { IDEEENBANK } from '../data/ideeen';
import { balans } from '../engine/kalender';
import { useStore } from '../store/store';
import { Kaart, Leeg } from './ui';

const isoDatum = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Dashboard({
  naarStudio,
  naarKalender,
  naarMerk,
  openCampagne,
}: {
  naarStudio: () => void;
  naarKalender: () => void;
  naarMerk: () => void;
  openCampagne: (id: string) => void;
}) {
  const { staat } = useStore();
  const merk = staat.merk;
  const vandaag = new Date();

  const komende = useMemo(() => {
    const grens = new Date(vandaag);
    grens.setDate(grens.getDate() + 14);
    return staat.posts
      .filter((p) => p.datum >= isoDatum(vandaag) && p.datum <= isoDatum(grens) && p.status !== 'gepubliceerd')
      .sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
  }, [staat.posts]); // eslint-disable-line react-hooks/exhaustive-deps

  const achterstallig = staat.posts.filter((p) => p.datum < isoDatum(vandaag) && p.status === 'gepland');

  const verdeling = balans(komende);
  const totaal = Object.values(verdeling).reduce((a, b) => a + b, 0) || 1;

  const actieveActie = merk.acties.find((a) => a.actief);
  const maandHaak = SEIZOENSHAKEN[vandaag.getMonth() + 1];

  const stappen = [
    { klaar: merk.bedrijfsnaam !== 'Jouw Kozijnbedrijf' && !!merk.bedrijfsnaam, tekst: 'Bedrijfsnaam invullen' },
    { klaar: !!merk.telefoon || !!merk.website, tekst: 'Telefoonnummer of website invullen' },
    { klaar: merk.werkgebied.length > 0, tekst: 'Werkgebied invullen (plaatsnamen)' },
    { klaar: !!merk.logoMediaId, tekst: 'Logo toevoegen' },
    { klaar: !!merk.bewijs.reviewScore, tekst: 'Reviewscore invullen' },
    { klaar: staat.posts.length > 0, tekst: 'Kalender vullen' },
    { klaar: staat.koppelingen.some((k) => k.actief), tekst: 'Een koppeling instellen' },
  ];
  const gedaan = stappen.filter((s) => s.klaar).length;

  return (
    <div>
      <div className="raster raster-2">
        <Kaart
          titel={`Deze twee weken — ${komende.length} post${komende.length === 1 ? '' : 's'}`}
          hulp="Zo houd je de tijdlijn draaiend zonder er elke dag over na te denken."
          rechts={
            <div className="knoprij">
              <button type="button" className="knop" onClick={naarKalender}>
                Kalender
              </button>
              <button type="button" className="knop primair" onClick={naarStudio}>
                + Nieuw idee uitwerken
              </button>
            </div>
          }
        >
          {achterstallig.length > 0 && (
            <div className="banner">
              {achterstallig.length} post{achterstallig.length === 1 ? '' : 's'} staat nog open uit het verleden.
              Publiceer of verplaats {achterstallig.length === 1 ? 'hem' : 'ze'} — een gat in je ritme kost bereik.
            </div>
          )}

          {komende.length === 0 ? (
            <Leeg tekst="Nog niets gepland. Vul de kalender in één klik bij Kalender." />
          ) : (
            <table className="lijst">
              <thead>
                <tr>
                  <th>Wanneer</th>
                  <th>Kanaal</th>
                  <th>Onderwerp</th>
                  <th>Pilaar</th>
                </tr>
              </thead>
              <tbody>
                {komende.slice(0, 8).map((post) => {
                  const campagne = staat.campagnes.find((c) => c.id === post.campagneId);
                  return (
                    <tr
                      key={post.id}
                      onClick={() => openCampagne(post.campagneId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="mono">
                        {new Date(post.datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                        {post.tijd}
                      </td>
                      <td>{kanaalById(post.kanaal).label}</td>
                      <td>
                        <strong>{campagne?.naam ?? '—'}</strong>
                        {post.notitie && <div className="hulptekst">{post.notitie}</div>}
                      </td>
                      <td>
                        <span
                          className="label"
                          style={{ background: pilaarById(post.pilaar).kleurAccent, color: '#0b1220' }}
                        >
                          {pilaarById(post.pilaar).label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 14 }}>
            <div className="balk">
              {PILAREN.map((p) => (
                <span
                  key={p.id}
                  style={{ width: `${((verdeling[p.id] ?? 0) / totaal) * 100}%`, background: p.kleurAccent }}
                />
              ))}
            </div>
            <p className="hulptekst">
              Verhouding van wat er aankomt. Te veel aanbod en te weinig bewijs is de meest gemaakte fout — dan leert
              je publiek je posts te negeren.
            </p>
          </div>
        </Kaart>

        <div>
          <Kaart titel={`Aan de slag — ${gedaan}/${stappen.length}`} hulp="Hoe vollediger dit staat, hoe scherper de content wordt.">
            {stappen.map((s) => (
              <div key={s.tekst} style={{ display: 'flex', gap: 10, padding: '4px 0', alignItems: 'center' }}>
                <span style={{ color: s.klaar ? 'var(--goed)' : 'var(--tekst-uit)' }}>{s.klaar ? '✓' : '○'}</span>
                <span style={{ color: s.klaar ? 'var(--tekst-zacht)' : 'var(--tekst)' }}>{s.tekst}</span>
              </div>
            ))}
            <div className="knoprij" style={{ marginTop: 12 }}>
              <button type="button" className="knop" onClick={naarMerk}>
                Merkprofiel invullen
              </button>
            </div>
          </Kaart>

          <Kaart titel="Lopende actie">
            {actieveActie ? (
              <div>
                <h3 style={{ fontSize: 24 }}>{actieveActie.claim}</h3>
                <p className="hulptekst">{actieveActie.waarop}</p>
                {actieveActie.geldigTot && <p className="hulptekst">Loopt tot {actieveActie.geldigTot}</p>}
                {!actieveActie.referentieprijsGetoetst && /%/.test(actieveActie.claim) && (
                  <div className="melding blokkerend">
                    <strong>Referentieprijs nog niet getoetst</strong>
                    Bij een kortingspercentage moet je uitgaan van de laagste prijs van de afgelopen 30 dagen. Leg dat
                    vast bij Merk voordat je hiermee adverteert.
                  </div>
                )}
              </div>
            ) : (
              <Leeg tekst="Geen actie actief. Zonder aanbod mist je content een reden om nú te reageren." />
            )}
          </Kaart>

          <Kaart titel={`Haak van deze maand — ${maandHaak.thema}`}>
            <p style={{ fontSize: 17, fontWeight: 600 }}>“{maandHaak.hook}”</p>
            <p className="hulptekst">
              Seizoensinvalshoek die nu het beste werkt. De kalender neemt dit automatisch mee.
            </p>
          </Kaart>
        </div>
      </div>

      <Kaart
        titel="Ideeën die je zo kunt gebruiken"
        hulp="Klik op een idee om het direct uit te werken in de studio."
        rechts={<span className="telling">{IDEEENBANK.length} in de bank</span>}
      >
        <div className="raster raster-3">
          {IDEEENBANK.filter((i) => i.maanden.length === 0 || i.maanden.includes(vandaag.getMonth() + 1))
            .slice(0, 9)
            .map((idee) => (
              <div key={idee.id} className="kaart" style={{ background: 'var(--achter-2)' }}>
                <span
                  className="label"
                  style={{ background: pilaarById(idee.pilaar).kleurAccent, color: '#0b1220' }}
                >
                  {pilaarById(idee.pilaar).label}
                </span>
                <h3 style={{ margin: '8px 0 4px', fontSize: 15 }}>
                  {idee.titel.replace('{plaats}', merk.werkgebied[0] ?? 'de regio')}
                </h3>
                <p className="hulptekst">{idee.beeld}</p>
              </div>
            ))}
        </div>
      </Kaart>

      {staat.campagnes.length > 0 && (
        <Kaart titel="Recente campagnes">
          <table className="lijst">
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Invalshoek</th>
                <th>Kanalen</th>
                <th>Gewijzigd</th>
              </tr>
            </thead>
            <tbody>
              {staat.campagnes.slice(0, 10).map((c) => (
                <tr key={c.id} onClick={() => openCampagne(c.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{c.naam}</strong>
                  </td>
                  <td>{c.idee.hoek}</td>
                  <td className="hulptekst">{c.idee.kanalen.map((k) => kanaalById(k).label).join(', ')}</td>
                  <td className="hulptekst">{new Date(c.gewijzigd).toLocaleDateString('nl-NL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
    </div>
  );
}
