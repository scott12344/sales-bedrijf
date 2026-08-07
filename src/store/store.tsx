import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, Campagne, Koppeling, Merk, Post } from '../types';
import { standaardMerk } from '../data/merk';
import { PILAREN } from '../data/pilaren';
import { bewaarStaat, laadStaat } from './db';
import { nieuwId } from './media';

const STAAT_VERSIE = 1;

export function leegStaat(): AppState {
  return {
    merk: standaardMerk(),
    campagnes: [],
    posts: [],
    koppelingen: [
      {
        id: nieuwId('k'),
        type: 'meta',
        naam: 'Instagram & Facebook (Meta)',
        actief: false,
        kanalen: ['instagram-feed', 'instagram-story', 'instagram-reel', 'facebook-feed', 'facebook-story'],
        webhookUrl: '',
        apiBasis: '',
        status: 'Nog niet gekoppeld',
      },
      {
        id: nieuwId('k'),
        type: 'tiktok',
        naam: 'TikTok',
        actief: false,
        kanalen: ['tiktok'],
        webhookUrl: '',
        apiBasis: '',
        status: 'Nog niet gekoppeld',
      },
      {
        id: nieuwId('k'),
        type: 'webhook',
        naam: 'Webhook (Make / Zapier / eigen server)',
        actief: false,
        kanalen: ['instagram-feed', 'facebook-feed', 'tiktok', 'email', 'whatsapp'],
        webhookUrl: '',
        apiBasis: '',
        status: 'Werkt direct zodra je een URL invult',
      },
    ],
    instellingen: {
      postsPerWeek: 4,
      actieveKanalen: ['instagram-feed', 'facebook-feed', 'instagram-story', 'tiktok'],
      mix: Object.fromEntries(PILAREN.map((p) => [p.id, p.aandeel])),
      startDag: 1,
    },
    versie: STAAT_VERSIE,
  };
}

type Actie =
  | { type: 'staat-geladen'; staat: AppState }
  | { type: 'merk'; merk: Merk }
  | { type: 'campagne-toevoegen'; campagne: Campagne }
  | { type: 'campagne-bijwerken'; campagne: Campagne }
  | { type: 'campagne-verwijderen'; id: string }
  | { type: 'posts-toevoegen'; posts: Post[] }
  | { type: 'post-bijwerken'; post: Post }
  | { type: 'post-verwijderen'; id: string }
  | { type: 'posts-vervangen'; posts: Post[] }
  | { type: 'koppeling-bijwerken'; koppeling: Koppeling }
  | { type: 'instellingen'; instellingen: AppState['instellingen'] }
  | { type: 'alles-vervangen'; staat: AppState };

function reducer(staat: AppState, actie: Actie): AppState {
  switch (actie.type) {
    case 'staat-geladen':
    case 'alles-vervangen':
      return actie.staat;
    case 'merk':
      return { ...staat, merk: actie.merk };
    case 'campagne-toevoegen':
      return { ...staat, campagnes: [actie.campagne, ...staat.campagnes] };
    case 'campagne-bijwerken':
      return {
        ...staat,
        campagnes: staat.campagnes.map((c) =>
          c.id === actie.campagne.id ? { ...actie.campagne, gewijzigd: Date.now() } : c,
        ),
      };
    case 'campagne-verwijderen':
      return {
        ...staat,
        campagnes: staat.campagnes.filter((c) => c.id !== actie.id),
        posts: staat.posts.filter((p) => p.campagneId !== actie.id),
      };
    case 'posts-toevoegen':
      return { ...staat, posts: [...staat.posts, ...actie.posts] };
    case 'post-bijwerken':
      return { ...staat, posts: staat.posts.map((p) => (p.id === actie.post.id ? actie.post : p)) };
    case 'post-verwijderen':
      return { ...staat, posts: staat.posts.filter((p) => p.id !== actie.id) };
    case 'posts-vervangen':
      return { ...staat, posts: actie.posts };
    case 'koppeling-bijwerken':
      return {
        ...staat,
        koppelingen: staat.koppelingen.map((k) => (k.id === actie.koppeling.id ? actie.koppeling : k)),
      };
    case 'instellingen':
      return { ...staat, instellingen: actie.instellingen };
    default:
      return staat;
  }
}

interface StoreWaarde {
  staat: AppState;
  verstuur: React.Dispatch<Actie>;
  geladen: boolean;
  opslagfout: string | null;
}

const StoreContext = createContext<StoreWaarde | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [staat, verstuur] = useReducer(reducer, undefined, leegStaat);
  const [geladen, setGeladen] = useState(false);
  const [opslagfout, setOpslagfout] = useState<string | null>(null);
  const eersteRender = useRef(true);

  useEffect(() => {
    let afgebroken = false;
    laadStaat()
      .then((opgeslagen) => {
        if (afgebroken) return;
        // Een meegeleverde klantpresentatie zet zijn eigen gegevens klaar.
        const ingebed = document.getElementById('ingebedde-gegevens');
        if (ingebed?.textContent) {
          try {
            verstuur({ type: 'staat-geladen', staat: JSON.parse(ingebed.textContent) as AppState });
            setGeladen(true);
            return;
          } catch {
            /* val terug op de opgeslagen staat */
          }
        }
        if (opgeslagen) verstuur({ type: 'staat-geladen', staat: { ...leegStaat(), ...opgeslagen } });
        setGeladen(true);
      })
      .catch(() => {
        if (afgebroken) return;
        setOpslagfout(
          'De browser staat geen lokale opslag toe (bijvoorbeeld in privémodus). Je kunt wel werken, maar niets wordt bewaard — maak dus een back-up via Instellingen.',
        );
        setGeladen(true);
      });
    return () => {
      afgebroken = true;
    };
  }, []);

  // Opslaan met een korte vertraging, zodat typen niet elke toetsaanslag wegschrijft.
  useEffect(() => {
    if (!geladen) return;
    if (eersteRender.current) {
      eersteRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      bewaarStaat(staat).catch(() => setOpslagfout('Opslaan is mislukt. Maak een back-up voor de zekerheid.'));
    }, 400);
    return () => clearTimeout(timer);
  }, [staat, geladen]);

  const waarde = useMemo(() => ({ staat, verstuur, geladen, opslagfout }), [staat, geladen, opslagfout]);
  return <StoreContext.Provider value={waarde}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreWaarde {
  const waarde = useContext(StoreContext);
  if (!waarde) throw new Error('useStore moet binnen een StoreProvider gebruikt worden.');
  return waarde;
}

export const useMerk = (): Merk => useStore().staat.merk;
