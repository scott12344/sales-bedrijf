import { useState } from 'react';
import type { Actie, Merk as MerkType } from '../types';
import { LETTERTYPEN, PALETTEN } from '../data/merk';
import { useStore } from '../store/store';
import { nieuwId } from '../store/media';
import { BeeldKiezer } from './BeeldKiezer';
import { Kaart, Keuze, Meerregelig, Tekst, Veld, Vinkje } from './ui';
import { controleerActie } from '../engine/controle';
import { Meldingen } from './ui';

export function MerkScherm() {
  const { staat, verstuur } = useStore();
  const merk = staat.merk;
  const [nieuwePlaats, setNieuwePlaats] = useState('');

  const zet = (wijziging: Partial<MerkType>) => verstuur({ type: 'merk', merk: { ...merk, ...wijziging } });

  const zetActie = (id: string, wijziging: Partial<Actie>) =>
    zet({ acties: merk.acties.map((a) => (a.id === id ? { ...a, ...wijziging } : a)) });

  const voegActieToe = () =>
    zet({
      acties: [
        ...merk.acties,
        {
          id: nieuwId('a'),
          naam: 'Nieuwe actie',
          type: 'korting',
          claim: '',
          waarop: '',
          voorwaarden: '',
          geldigVan: '',
          geldigTot: '',
          referentieprijsGetoetst: false,
          onderbouwing: '',
          actief: false,
        },
      ],
    });

  return (
    <div className="raster raster-2">
      <div>
        <Kaart titel="Bedrijfsgegevens" hulp="Deze gegevens komen automatisch in elke post, flyer en advertentie.">
          <Tekst label="Bedrijfsnaam" waarde={merk.bedrijfsnaam} zet={(v) => zet({ bedrijfsnaam: v })} />
          <Tekst label="Slogan" waarde={merk.slogan} zet={(v) => zet({ slogan: v })} />
          <div className="raster raster-2">
            <Tekst label="Telefoon" waarde={merk.telefoon} zet={(v) => zet({ telefoon: v })} type="tel" />
            <Tekst label="WhatsApp" waarde={merk.whatsapp} zet={(v) => zet({ whatsapp: v })} type="tel" />
            <Tekst label="Website" waarde={merk.website} zet={(v) => zet({ website: v })} />
            <Tekst label="E-mail" waarde={merk.email} zet={(v) => zet({ email: v })} type="email" />
          </div>

          <BeeldKiezer
            label="Logo (bij voorkeur PNG met transparante achtergrond)"
            soort="logo"
            gekozen={merk.logoMediaId}
            zet={(id) => zet({ logoMediaId: id })}
          />

          <Veld label="Werkgebied" hulp="Plaatsnamen komen in teksten én hashtags. Dit levert de meeste aanvragen op.">
            <div className="chips" style={{ marginBottom: 8 }}>
              {merk.werkgebied.map((plaats) => (
                <button
                  key={plaats}
                  type="button"
                  className="chip"
                  aria-pressed
                  onClick={() => zet({ werkgebied: merk.werkgebied.filter((p) => p !== plaats) })}
                  title="Klik om te verwijderen"
                >
                  {plaats} ✕
                </button>
              ))}
              {merk.werkgebied.length === 0 && <span className="hulptekst">Nog geen plaatsen toegevoegd.</span>}
            </div>
            <div className="knoprij">
              <input
                type="text"
                value={nieuwePlaats}
                placeholder="Plaatsnaam"
                onChange={(e) => setNieuwePlaats(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !nieuwePlaats.trim()) return;
                  e.preventDefault();
                  zet({ werkgebied: [...merk.werkgebied, nieuwePlaats.trim()] });
                  setNieuwePlaats('');
                }}
              />
              <button
                type="button"
                className="knop"
                onClick={() => {
                  if (!nieuwePlaats.trim()) return;
                  zet({ werkgebied: [...merk.werkgebied, nieuwePlaats.trim()] });
                  setNieuwePlaats('');
                }}
              >
                Toevoegen
              </button>
            </div>
          </Veld>
        </Kaart>

        <Kaart titel="Bewijs" hulp="Cijfers die je kunt waarmaken. Ze verschijnen in bewijs-posts en advertenties.">
          <div className="raster raster-2">
            <Tekst label="Opgericht in" waarde={merk.bewijs.jaarOpgericht} zet={(v) => zet({ bewijs: { ...merk.bewijs, jaarOpgericht: v } })} />
            <Tekst label="Woningen per jaar" waarde={merk.bewijs.projectenPerJaar} zet={(v) => zet({ bewijs: { ...merk.bewijs, projectenPerJaar: v } })} />
            <Tekst label="Gemiddelde score" waarde={merk.bewijs.reviewScore} zet={(v) => zet({ bewijs: { ...merk.bewijs, reviewScore: v } })} />
            <Tekst label="Aantal beoordelingen" waarde={merk.bewijs.reviewAantal} zet={(v) => zet({ bewijs: { ...merk.bewijs, reviewAantal: v } })} />
            <Tekst label="Garantie (jaren)" waarde={merk.bewijs.garantieJaren} zet={(v) => zet({ bewijs: { ...merk.bewijs, garantieJaren: v } })} />
          </div>
          <Meerregelig
            label="Jouw sterkste punten (één per regel)"
            waarde={merk.bewijs.usps.join('\n')}
            zet={(v) => zet({ bewijs: { ...merk.bewijs, usps: v.split('\n').filter((r) => r.trim()) } })}
            regels={5}
          />
          <Meerregelig
            label="Woorden die je nooit wilt gebruiken (één per regel)"
            waarde={merk.verbodenWoorden.join('\n')}
            zet={(v) => zet({ verbodenWoorden: v.split('\n').filter((r) => r.trim()) })}
            regels={3}
            hulp="De controle waarschuwt zodra een van deze woorden in je content opduikt."
          />
        </Kaart>
      </div>

      <div>
        <Kaart titel="Huisstijl" hulp="Kies een palet of stel je eigen kleuren in. Alles past zich direct aan.">
          <Veld label="Kleurenpalet">
            <div className="raster raster-3">
              {PALETTEN.map((p) => {
                const gekozen = p.kleuren.primair === merk.kleuren.primair && p.kleuren.accent === merk.kleuren.accent;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="knop"
                    style={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 8,
                      padding: 10,
                      borderColor: gekozen ? 'var(--accent)' : undefined,
                    }}
                    onClick={() => zet({ kleuren: { ...p.kleuren } })}
                  >
                    <span style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden' }}>
                      <span style={{ flex: 2, background: p.kleuren.primair }} />
                      <span style={{ flex: 1, background: p.kleuren.accent }} />
                      <span style={{ flex: 1, background: p.kleuren.vlak }} />
                    </span>
                    <span style={{ fontSize: 13 }}>{p.naam}</span>
                    <span className="hulptekst" style={{ margin: 0, textAlign: 'left', whiteSpace: 'normal' }}>
                      {p.omschrijving}
                    </span>
                  </button>
                );
              })}
            </div>
          </Veld>

          <div className="raster raster-3">
            {(
              [
                ['primair', 'Primair'],
                ['primairDonker', 'Primair donker'],
                ['accent', 'Accent'],
                ['vlak', 'Vlak'],
                ['tekst', 'Tekst'],
                ['tekstZacht', 'Tekst zacht'],
              ] as const
            ).map(([sleutel, label]) => (
              <Veld key={sleutel} label={label}>
                <input
                  type="color"
                  value={merk.kleuren[sleutel]}
                  onChange={(e) => zet({ kleuren: { ...merk.kleuren, [sleutel]: e.target.value } })}
                />
              </Veld>
            ))}
          </div>

          <Keuze
            label="Lettertype koppen"
            waarde={merk.typografie.kopFont}
            zet={(v) => zet({ typografie: { ...merk.typografie, kopFont: v } })}
            opties={LETTERTYPEN.map((l) => ({ waarde: l.id, label: l.label }))}
            hulp={LETTERTYPEN.find((l) => l.id === merk.typografie.kopFont)?.omschrijving}
          />
          <Keuze
            label="Lettertype teksten"
            waarde={merk.typografie.tekstFont}
            zet={(v) => zet({ typografie: { ...merk.typografie, tekstFont: v } })}
            opties={LETTERTYPEN.map((l) => ({ waarde: l.id, label: l.label }))}
          />
          <Vinkje
            label="Koppen in hoofdletters"
            aan={merk.typografie.kopHoofdletters}
            zet={(v) => zet({ typografie: { ...merk.typografie, kopHoofdletters: v } })}
          />
          <Keuze
            label="Toon"
            waarde={merk.toon}
            zet={(v) => zet({ toon: v })}
            opties={[
              { waarde: 'direct', label: 'Direct en no-nonsense' },
              { waarde: 'vertrouwd', label: 'Vertrouwd en persoonlijk' },
              { waarde: 'premium', label: 'Premium en verzorgd' },
              { waarde: 'nuchter', label: 'Nuchter en zakelijk' },
            ]}
          />
        </Kaart>

        <Kaart
          titel="Acties en aanbiedingen"
          hulp="Zet hier je lopende aanbod. De contentmotor gebruikt de actieve actie automatisch."
          rechts={
            <button type="button" className="knop" onClick={voegActieToe}>
              + Actie
            </button>
          }
        >
          {merk.acties.map((actie) => {
            const meldingen = controleerActie(actie);
            return (
              <div key={actie.id} className="kaart" style={{ background: 'var(--achter-2)', marginBottom: 12 }}>
                <div className="kaart-kop">
                  <h3>{actie.claim || actie.naam || 'Naamloze actie'}</h3>
                  <div className="knoprij">
                    <Vinkje label="Actief" aan={actie.actief} zet={(v) => zetActie(actie.id, { actief: v })} />
                    <button
                      type="button"
                      className="knop klein stil"
                      onClick={() => zet({ acties: merk.acties.filter((a) => a.id !== actie.id) })}
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>

                <div className="raster raster-2">
                  <Tekst
                    label="Claim op het beeld"
                    waarde={actie.claim}
                    zet={(v) => zetActie(actie.id, { claim: v })}
                    plaatshouder="50% KORTING"
                  />
                  <Tekst
                    label="Waarop geldt het?"
                    waarde={actie.waarop}
                    zet={(v) => zetActie(actie.id, { waarop: v })}
                    plaatshouder="op de montage bij een complete woning"
                  />
                  <Tekst label="Geldig van" waarde={actie.geldigVan} zet={(v) => zetActie(actie.id, { geldigVan: v })} type="date" />
                  <Tekst label="Geldig tot" waarde={actie.geldigTot} zet={(v) => zetActie(actie.id, { geldigTot: v })} type="date" />
                </div>
                <Meerregelig
                  label="Voorwaarden"
                  waarde={actie.voorwaarden}
                  zet={(v) => zetActie(actie.id, { voorwaarden: v })}
                  regels={2}
                />
                <Vinkje
                  label="Referentieprijs getoetst"
                  aan={actie.referentieprijsGetoetst}
                  zet={(v) => zetActie(actie.id, { referentieprijsGetoetst: v })}
                  hulp="Een kortingspercentage moet je rekenen vanaf de laagste prijs die je de 30 dagen ervóór hanteerde."
                />
                <Meerregelig
                  label="Onderbouwing"
                  waarde={actie.onderbouwing}
                  zet={(v) => zetActie(actie.id, { onderbouwing: v })}
                  regels={2}
                  hulp="Leg hier vast welke prijs je hanteerde en wanneer je dat controleerde. Dat is je bewijs als iemand ernaar vraagt."
                />
                {meldingen.length > 0 && <Meldingen meldingen={meldingen} />}
              </div>
            );
          })}
        </Kaart>
      </div>
    </div>
  );
}
