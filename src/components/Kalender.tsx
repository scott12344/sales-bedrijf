import { useMemo, useState } from 'react';
import type { Post, PostStatus } from '../types';
import { PILAREN, pilaarById } from '../data/pilaren';
import { kanaalById } from '../data/kanalen';
import { balans, genereerPlan, planRegelNaarCampagne } from '../engine/kalender';
import { useStore } from '../store/store';
import { Kaart, Keuze, Leeg } from './ui';

const DAGNAMEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

const STATUSLABEL: Record<PostStatus, string> = {
  concept: 'Concept',
  gepland: 'Gepland',
  goedgekeurd: 'Goedgekeurd',
  gepubliceerd: 'Gepubliceerd',
  mislukt: 'Mislukt',
};

const isoDatum = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Kalender({ openCampagne }: { openCampagne: (id: string) => void }) {
  const { staat, verstuur } = useStore();
  const [maandOffset, setMaandOffset] = useState(0);
  const [weken, setWeken] = useState('4');
  const [gekozenDag, setGekozenDag] = useState<string | null>(null);

  const vandaag = new Date();
  const zicht = new Date(vandaag.getFullYear(), vandaag.getMonth() + maandOffset, 1);

  const dagen = useMemo(() => {
    const eerste = new Date(zicht);
    const start = new Date(eerste);
    start.setDate(1 - ((eerste.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [zicht.getFullYear(), zicht.getMonth()]); // eslint-disable-line react-hooks/exhaustive-deps

  const postsPerDag = useMemo(() => {
    const kaart: Record<string, Post[]> = {};
    for (const post of staat.posts) (kaart[post.datum] ??= []).push(post);
    for (const lijst of Object.values(kaart)) lijst.sort((a, b) => a.tijd.localeCompare(b.tijd));
    return kaart;
  }, [staat.posts]);

  const genereer = () => {
    const plan = genereerPlan(staat.instellingen, Number(weken) || 4, new Date());
    for (const regel of plan) {
      const { campagne, posts } = planRegelNaarCampagne(regel, staat.merk);
      verstuur({ type: 'campagne-toevoegen', campagne });
      verstuur({ type: 'posts-toevoegen', posts });
    }
  };

  const maandPosts = staat.posts.filter((p) => {
    const d = new Date(p.datum);
    return d.getFullYear() === zicht.getFullYear() && d.getMonth() === zicht.getMonth();
  });
  const verdeling = balans(maandPosts);
  const totaal = Object.values(verdeling).reduce((a, b) => a + b, 0) || 1;

  const dagPosts = gekozenDag ? (postsPerDag[gekozenDag] ?? []) : [];

  return (
    <div>
      <Kaart
        titel="Contentkalender"
        hulp="Genereer een planning en de juiste verhouding tussen bewijs, aanbod, uitleg en mensen komt er vanzelf in."
        rechts={
          <div className="knoprij">
            <select value={weken} onChange={(e) => setWeken(e.target.value)} style={{ width: 'auto' }}>
              <option value="2">2 weken</option>
              <option value="4">4 weken</option>
              <option value="8">8 weken</option>
              <option value="12">12 weken</option>
            </select>
            <button type="button" className="knop primair" onClick={genereer}>
              ✨ Vul de planning
            </button>
          </div>
        }
      >
        <div className="knoprij" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="knoprij">
            <button type="button" className="knop klein" onClick={() => setMaandOffset((m) => m - 1)}>
              ←
            </button>
            <strong style={{ alignSelf: 'center' }}>
              {zicht.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </strong>
            <button type="button" className="knop klein" onClick={() => setMaandOffset((m) => m + 1)}>
              →
            </button>
            {maandOffset !== 0 && (
              <button type="button" className="knop klein stil" onClick={() => setMaandOffset(0)}>
                Vandaag
              </button>
            )}
          </div>
          <div className="chips">
            {PILAREN.map((p) => (
              <span key={p.id} className="label" style={{ background: p.kleurAccent, color: '#0b1220' }}>
                {p.label} {verdeling[p.id] ?? 0}
              </span>
            ))}
          </div>
        </div>

        <div className="balk" style={{ marginBottom: 14 }}>
          {PILAREN.map((p) => (
            <span
              key={p.id}
              style={{ width: `${((verdeling[p.id] ?? 0) / totaal) * 100}%`, background: p.kleurAccent }}
            />
          ))}
        </div>

        <div className="kalender">
          {DAGNAMEN.map((d) => (
            <div key={d} className="dagnaam">
              {d}
            </div>
          ))}
          {dagen.map((dag) => {
            const sleutel = isoDatum(dag);
            const posts = postsPerDag[sleutel] ?? [];
            const buiten = dag.getMonth() !== zicht.getMonth();
            return (
              <div
                key={sleutel}
                className={`dag${buiten ? ' buiten' : ''}${sleutel === isoDatum(vandaag) ? ' vandaag' : ''}`}
                onClick={() => setGekozenDag(sleutel)}
              >
                <span className="nummer">{dag.getDate()}</span>
                {posts.slice(0, 3).map((post) => {
                  const campagne = staat.campagnes.find((c) => c.id === post.campagneId);
                  return (
                    <button
                      key={post.id}
                      type="button"
                      className="dagpost"
                      style={{ background: pilaarById(post.pilaar).kleurAccent }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openCampagne(post.campagneId);
                      }}
                      title={campagne?.naam}
                    >
                      {post.tijd} {kanaalById(post.kanaal).label}
                    </button>
                  );
                })}
                {posts.length > 3 && <span className="telling">+{posts.length - 3} meer</span>}
              </div>
            );
          })}
        </div>
      </Kaart>

      {gekozenDag && (
        <Kaart
          titel={new Date(gekozenDag).toLocaleDateString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          rechts={
            <button type="button" className="knop klein stil" onClick={() => setGekozenDag(null)}>
              Sluiten
            </button>
          }
        >
          {dagPosts.length === 0 ? (
            <Leeg tekst="Geen posts op deze dag." />
          ) : (
            <table className="lijst">
              <thead>
                <tr>
                  <th>Tijd</th>
                  <th>Kanaal</th>
                  <th>Campagne</th>
                  <th>Wat film/fotografeer je</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dagPosts.map((post) => {
                  const campagne = staat.campagnes.find((c) => c.id === post.campagneId);
                  return (
                    <tr key={post.id}>
                      <td className="mono">{post.tijd}</td>
                      <td>{kanaalById(post.kanaal).label}</td>
                      <td>
                        <strong>{campagne?.naam ?? '—'}</strong>
                        <div className="hulptekst">{pilaarById(post.pilaar).label}</div>
                      </td>
                      <td className="hulptekst">{post.notitie}</td>
                      <td>
                        <select
                          value={post.status}
                          onChange={(e) =>
                            verstuur({ type: 'post-bijwerken', post: { ...post, status: e.target.value as PostStatus } })
                          }
                        >
                          {(Object.keys(STATUSLABEL) as PostStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUSLABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="knoprij">
                          <button type="button" className="knop klein" onClick={() => openCampagne(post.campagneId)}>
                            Openen
                          </button>
                          <button
                            type="button"
                            className="knop klein stil"
                            onClick={() => verstuur({ type: 'post-verwijderen', id: post.id })}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Kaart>
      )}

      <Kaart titel="Ritme" hulp="Hoe vaak je post en waarover. Dit stuurt de automatische planning aan.">
        <div className="raster raster-3">
          <Keuze
            label="Posts per week"
            waarde={String(staat.instellingen.postsPerWeek)}
            zet={(v) =>
              verstuur({
                type: 'instellingen',
                instellingen: { ...staat.instellingen, postsPerWeek: Number(v) },
              })
            }
            opties={['2', '3', '4', '5', '6', '7'].map((n) => ({ waarde: n, label: `${n} per week` }))}
          />
          {PILAREN.map((p) => (
            <label key={p.id} className="veld">
              <span>
                {p.label} — {staat.instellingen.mix[p.id] ?? p.aandeel}%
              </span>
              <input
                type="range"
                min={0}
                max={70}
                step={5}
                value={staat.instellingen.mix[p.id] ?? p.aandeel}
                onChange={(e) =>
                  verstuur({
                    type: 'instellingen',
                    instellingen: {
                      ...staat.instellingen,
                      mix: { ...staat.instellingen.mix, [p.id]: Number(e.target.value) },
                    },
                  })
                }
              />
              <p className="hulptekst">{p.doel}</p>
            </label>
          ))}
        </div>
      </Kaart>
    </div>
  );
}
