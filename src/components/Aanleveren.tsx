import { useState } from 'react';
import { leesPakket, maakBriefing, maakPakket, verwerkPakket } from '../engine/aanlevering';
import { useStore } from '../store/store';
import { downloadBlob, veiligeNaam } from '../export/bestanden';
import { Kaart, KopieerKnop, Meerregelig, Vinkje } from './ui';

/**
 * Aanleveren: content die buiten de app is geschreven hier naar binnen halen.
 *
 * De werkwijze is bewust simpel gehouden omdat er geen server tussen zit: je
 * kopieert een briefing naar degene die schrijft, en plakt het pakket dat je
 * terugkrijgt in het vak hieronder.
 */
export function Aanleveren({ naarGoedkeuring }: { naarGoedkeuring: () => void }) {
  const { staat, verstuur } = useStore();
  const [invoer, setInvoer] = useState('');
  const [direct, setDirect] = useState(false);
  const [uitslag, setUitslag] = useState<{ gelukt: boolean; tekst: string; details: string[] } | null>(null);

  const briefing = maakBriefing(staat.merk, staat.posts);

  const lees = () => {
    try {
      const pakket = leesPakket(invoer);
      const { campagnes, posts, meldingen } = verwerkPakket(pakket, staat.merk, staat.posts, {
        status: direct ? 'goedgekeurd' : 'concept',
      });

      if (!campagnes.length) {
        setUitslag({ gelukt: false, tekst: 'Er zat geen bruikbare post in dit pakket.', details: meldingen });
        return;
      }

      for (const campagne of campagnes) verstuur({ type: 'campagne-toevoegen', campagne });
      verstuur({ type: 'posts-toevoegen', posts });

      setUitslag({
        gelukt: true,
        tekst: `${campagnes.length} campagne(s) ingelezen en ${posts.length} post(s) ingepland${
          direct ? ' en goedgekeurd' : ' — klaar om goed te keuren'
        }.`,
        details: meldingen,
      });
      setInvoer('');
    } catch (fout) {
      setUitslag({ gelukt: false, tekst: (fout as Error).message, details: [] });
    }
  };

  const exporteer = () => {
    const pakket = maakPakket(staat.campagnes, staat.posts);
    downloadBlob(
      new Blob([JSON.stringify(pakket, null, 2)], { type: 'application/json' }),
      `${veiligeNaam(staat.merk.bedrijfsnaam)}-campagnes.json`,
    );
  };

  return (
    <div>
      <Kaart
        titel="Zo laat je content voor je maken"
        hulp="Twee stappen. Je hebt er geen account of koppeling voor nodig."
      >
        <ol>
          <li>
            Kopieer de briefing hieronder en stuur hem naar wie de content schrijft — een tekstschrijver, een
            bureau of een AI-assistent. Daar staat je merk, je aanbod en het gevraagde formaat in.
          </li>
          <li>
            Plak het pakket dat je terugkrijgt in het invoervak en klik op inlezen. De posts komen in de planning
            te staan, klaar om goed te keuren.
          </li>
        </ol>
        <p className="hulptekst">
          Wat er in het pakket staat wint; alles wat ontbreekt vult het systeem zelf aan. Je kunt dus ook een
          pakket met alleen koppen inlezen en toch complete posts met captions terugkrijgen.
        </p>
      </Kaart>

      <div className="raster raster-2">
        <Kaart
          titel="1. Briefing versturen"
          rechts={<KopieerKnop tekst={briefing} label="Kopieer briefing" />}
          hulp="Bevat je merkgegevens, je lopende actie en precies het formaat dat het systeem terugleest."
        >
          <div className="tekstblok mono">{briefing}</div>
        </Kaart>

        <Kaart titel="2. Pakket inlezen" hulp="Plak hier de JSON die je terugkrijgt. Een ```json-blok eromheen mag ook.">
          <Meerregelig
            label="Pakket"
            waarde={invoer}
            zet={setInvoer}
            plaatshouder='{ "campagnes": [ { "kop": "Weer een woning klaar in {plaats}" } ] }'
            regels={10}
          />
          <Vinkje
            label="Meteen goedkeuren"
            aan={direct}
            zet={setDirect}
            hulp="Uit: de posts komen eerst ter goedkeuring te staan. Aan: ze staan meteen klaar om te publiceren."
          />
          <div className="knoprij">
            <button type="button" className="knop primair" onClick={lees} disabled={!invoer.trim()}>
              Inlezen
            </button>
            {uitslag?.gelukt && (
              <button type="button" className="knop" onClick={naarGoedkeuring}>
                Naar goedkeuring →
              </button>
            )}
          </div>

          {uitslag && (
            <div className={`melding ${uitslag.gelukt ? '' : 'blokkerend'}`} style={{ marginTop: 12 }}>
              <strong>{uitslag.gelukt ? 'Gelukt' : 'Niet gelukt'}</strong>
              {uitslag.tekst}
              {uitslag.details.map((d, i) => (
                <span key={i} className="oplossing">
                  {d}
                </span>
              ))}
            </div>
          )}
        </Kaart>
      </div>

      <Kaart
        titel="Je huidige campagnes exporteren"
        hulp="Handig als je iemand je bestaande content wilt laten herschrijven: exporteer, laat aanpassen, lees weer in."
        rechts={
          <button type="button" className="knop" onClick={exporteer} disabled={!staat.campagnes.length}>
            ⤓ Exporteer als pakket
          </button>
        }
      >
        <p className="hulptekst">
          {staat.campagnes.length
            ? `${staat.campagnes.length} campagne(s) worden geëxporteerd in hetzelfde formaat als hierboven.`
            : 'Nog geen campagnes om te exporteren.'}
        </p>
      </Kaart>
    </div>
  );
}
