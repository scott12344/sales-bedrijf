import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Studio } from './components/Studio';
import { Kalender } from './components/Kalender';
import { MerkScherm } from './components/Merk';
import { MediaScherm } from './components/Media';
import { KoppelingenScherm } from './components/Koppelingen';
import { useStore } from './store/store';
import { Tabbladen } from './components/ui';

type Scherm = 'vandaag' | 'studio' | 'kalender' | 'beeld' | 'merk' | 'koppelingen';

export default function App() {
  const { staat, geladen, opslagfout } = useStore();
  const [scherm, setScherm] = useState<Scherm>('vandaag');
  const [campagneId, setCampagneId] = useState<string | undefined>();

  const openCampagne = (id: string) => {
    setCampagneId(id);
    setScherm('studio');
  };

  const nieuweCampagne = () => {
    setCampagneId(undefined);
    setScherm('studio');
  };

  if (!geladen) {
    return (
      <div className="app">
        <div className="inhoud">
          <p className="leeg">Bezig met laden…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="kop">
        <div className="merknaam">
          <span className="stip" />
          {staat.merk.bedrijfsnaam || 'Marketing Studio'}
        </div>
        <Tabbladen
          actief={scherm}
          zet={(s) => {
            if (s === 'studio' && scherm !== 'studio') setCampagneId(campagneId);
            setScherm(s);
          }}
          tabs={[
            { id: 'vandaag', label: 'Vandaag' },
            { id: 'studio', label: 'Studio' },
            { id: 'kalender', label: 'Kalender' },
            { id: 'beeld', label: 'Beeldbank' },
            { id: 'merk', label: 'Merk & aanbod' },
            { id: 'koppelingen', label: 'Koppelingen' },
          ]}
        />
        <div style={{ marginLeft: 'auto' }} className="knoprij">
          <button type="button" className="knop primair" onClick={nieuweCampagne}>
            + Nieuw idee
          </button>
        </div>
      </header>

      <main className="inhoud">
        {opslagfout && <div className="banner">{opslagfout}</div>}

        {scherm === 'vandaag' && (
          <Dashboard
            naarStudio={nieuweCampagne}
            naarKalender={() => setScherm('kalender')}
            naarMerk={() => setScherm('merk')}
            openCampagne={openCampagne}
          />
        )}
        {scherm === 'studio' && <Studio bewerkId={campagneId} />}
        {scherm === 'kalender' && <Kalender openCampagne={openCampagne} />}
        {scherm === 'beeld' && <MediaScherm />}
        {scherm === 'merk' && <MerkScherm />}
        {scherm === 'koppelingen' && <KoppelingenScherm />}
      </main>
    </div>
  );
}
