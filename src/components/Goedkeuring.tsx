import { useMemo, useState } from 'react';
import type { Post } from '../types';
import { kanaalById } from '../data/kanalen';
import { pilaarById } from '../data/pilaren';
import { controleerUitwerking } from '../engine/controle';
import { useStore } from '../store/store';
import { Preview } from './Preview';
import { Kaart, KopieerKnop, Leeg } from './ui';

/**
 * Goedkeuringsscherm: alles wat de autopiloot of een aanlevering heeft
 * klaargezet, met het beeld en de tekst erbij. Jij bepaalt wat live mag.
 */
export function Goedkeuring({ openCampagne }: { openCampagne: (id: string) => void }) {
  const { staat, verstuur } = useStore();
  const [alleen, setAlleen] = useState<'concept' | 'goedgekeurd' | 'alles'>('concept');

  const posts = useMemo(() => {
    const gefilterd = staat.posts.filter((p) => {
      if (alleen === 'alles') return p.status !== 'gepubliceerd';
      return p.status === alleen;
    });
    return gefilterd.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
  }, [staat.posts, alleen]);

  /* Eén campagne kan op meerdere kanalen staan; die tonen we als één kaart met
     alle kanalen erbij, anders keur je hetzelfde beeld vier keer goed. */
  const gegroepeerd = useMemo(() => {
    const kaart = new Map<string, Post[]>();
    for (const post of posts) {
      const sleutel = `${post.campagneId}|${post.datum}`;
      kaart.set(sleutel, [...(kaart.get(sleutel) ?? []), post]);
    }
    return [...kaart.values()];
  }, [posts]);

  const zetStatus = (groep: Post[], status: Post['status']) => {
    for (const post of groep) verstuur({ type: 'post-bijwerken', post: { ...post, status } });
  };

  const keurAllesGoed = () => {
    for (const post of posts) {
      if (post.status === 'concept' || post.status === 'gepland') {
        verstuur({ type: 'post-bijwerken', post: { ...post, status: 'goedgekeurd' } });
      }
    }
  };

  const teGaan = staat.posts.filter((p) => p.status === 'concept').length;

  return (
    <div>
      <Kaart
        titel={`Ter goedkeuring — ${teGaan}`}
        hulp="Loop hier doorheen, pas aan wat je anders wilt en keur de rest goed. Alleen goedgekeurde posts gaan naar de publicatiewachtrij."
        rechts={
          <div className="knoprij">
            <div className="chips">
              {(['concept', 'goedgekeurd', 'alles'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  aria-pressed={alleen === s}
                  onClick={() => setAlleen(s)}
                >
                  {s === 'concept' ? 'Ter goedkeuring' : s === 'goedgekeurd' ? 'Goedgekeurd' : 'Alles'}
                </button>
              ))}
            </div>
            <button type="button" className="knop primair" onClick={keurAllesGoed} disabled={!posts.length}>
              ✓ Keur alles goed
            </button>
          </div>
        }
      >
        {gegroepeerd.length === 0 && (
          <Leeg tekst="Niets te beoordelen. Zet de autopiloot aan of laat een pakket inlezen bij Aanleveren." />
        )}
      </Kaart>

      {gegroepeerd.map((groep) => {
        const post = groep[0];
        const campagne = staat.campagnes.find((c) => c.id === post.campagneId);
        if (!campagne) return null;
        const uitwerking = { ...campagne.uitwerking, ...campagne.aangepast };
        const meldingen = controleerUitwerking(uitwerking, staat.merk, campagne.idee.kanalen).filter(
          (m) => m.ernst === 'blokkerend',
        );

        return (
          <Kaart
            key={`${post.campagneId}-${post.datum}`}
            titel={campagne.naam}
            hulp={`${new Date(post.datum).toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })} om ${post.tijd} · ${groep.map((p) => kanaalById(p.kanaal).label).join(', ')}`}
            rechts={
              <div className="knoprij">
                <span
                  className="label"
                  style={{ background: pilaarById(post.pilaar).kleurAccent, color: '#0b1220' }}
                >
                  {pilaarById(post.pilaar).label}
                </span>
                <button type="button" className="knop klein" onClick={() => openCampagne(post.campagneId)}>
                  Aanpassen
                </button>
                {post.status !== 'goedgekeurd' ? (
                  <button type="button" className="knop klein primair" onClick={() => zetStatus(groep, 'goedgekeurd')}>
                    ✓ Goedkeuren
                  </button>
                ) : (
                  <button type="button" className="knop klein" onClick={() => zetStatus(groep, 'concept')}>
                    Terug naar concept
                  </button>
                )}
                <button
                  type="button"
                  className="knop klein stil"
                  onClick={() => verstuur({ type: 'campagne-verwijderen', id: campagne.id })}
                  title="Campagne en posts verwijderen"
                >
                  ✕
                </button>
              </div>
            }
          >
            {meldingen.length > 0 && (
              <div className="banner">
                {meldingen[0].onderwerp}: {meldingen[0].tekst}
              </div>
            )}

            <div className="raster raster-2">
              <div style={{ maxWidth: 300 }}>
                <Preview
                  sjabloonId={campagne.idee.sjabloonId}
                  kanaal={post.kanaal}
                  merk={staat.merk}
                  inhoud={{
                    badge: uitwerking.badge,
                    kop: uitwerking.kop,
                    subkop: uitwerking.subkop,
                    bullets: uitwerking.bullets,
                    cta: uitwerking.cta,
                    ctaSub: uitwerking.ctaSub,
                  }}
                  beeldId={campagne.idee.mediaId}
                  naam={campagne.naam}
                  compact
                />
                {!campagne.idee.mediaId && (
                  <p className="hulptekst">
                    Nog geen foto gekoppeld. {post.notitie ? `Te maken: ${post.notitie}` : ''}
                  </p>
                )}
              </div>

              <div>
                <div className="kaart-kop">
                  <h3>{kanaalById(post.kanaal).label}</h3>
                  <KopieerKnop tekst={uitwerking.captions[post.kanaal] ?? ''} />
                </div>
                <div className="tekstblok">{uitwerking.captions[post.kanaal] ?? ''}</div>
              </div>
            </div>
          </Kaart>
        );
      })}
    </div>
  );
}
