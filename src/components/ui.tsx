import { useEffect, useState, type ReactNode } from 'react';
import type { Melding } from '../engine/controle';
import { ernstLabel } from '../engine/controle';

export function Kaart({
  titel,
  hulp,
  rechts,
  children,
}: {
  titel?: string;
  hulp?: string;
  rechts?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="kaart">
      {(titel || rechts) && (
        <div className="kaart-kop">
          <div>
            {titel && <h2>{titel}</h2>}
            {hulp && <p className="hulptekst">{hulp}</p>}
          </div>
          {rechts}
        </div>
      )}
      {children}
    </section>
  );
}

export function Veld({
  label,
  hulp,
  children,
}: {
  label: string;
  hulp?: string;
  children: ReactNode;
}) {
  return (
    <label className="veld">
      <span>{label}</span>
      {children}
      {hulp && <p className="hulptekst">{hulp}</p>}
    </label>
  );
}

export function Tekst({
  label,
  waarde,
  zet,
  hulp,
  plaatshouder,
  type = 'text',
}: {
  label: string;
  waarde: string;
  zet: (v: string) => void;
  hulp?: string;
  plaatshouder?: string;
  type?: string;
}) {
  return (
    <Veld label={label} hulp={hulp}>
      <input type={type} value={waarde} placeholder={plaatshouder} onChange={(e) => zet(e.target.value)} />
    </Veld>
  );
}

export function Meerregelig({
  label,
  waarde,
  zet,
  hulp,
  plaatshouder,
  regels = 4,
}: {
  label: string;
  waarde: string;
  zet: (v: string) => void;
  hulp?: string;
  plaatshouder?: string;
  regels?: number;
}) {
  return (
    <Veld label={label} hulp={hulp}>
      <textarea rows={regels} value={waarde} placeholder={plaatshouder} onChange={(e) => zet(e.target.value)} />
    </Veld>
  );
}

export function Keuze<T extends string>({
  label,
  waarde,
  zet,
  opties,
  hulp,
}: {
  label: string;
  waarde: T;
  zet: (v: T) => void;
  opties: { waarde: T; label: string }[];
  hulp?: string;
}) {
  return (
    <Veld label={label} hulp={hulp}>
      <select value={waarde} onChange={(e) => zet(e.target.value as T)}>
        {opties.map((o) => (
          <option key={o.waarde} value={o.waarde}>
            {o.label}
          </option>
        ))}
      </select>
    </Veld>
  );
}

export function Vinkje({
  label,
  aan,
  zet,
  hulp,
}: {
  label: string;
  aan: boolean;
  zet: (v: boolean) => void;
  hulp?: string;
}) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={aan} onChange={(e) => zet(e.target.checked)} />
      <span>
        {label}
        {hulp && <p className="hulptekst">{hulp}</p>}
      </span>
    </label>
  );
}

export function ChipKeuze<T extends string>({
  opties,
  gekozen,
  zet,
  meervoud = false,
}: {
  opties: { waarde: T; label: string }[];
  gekozen: T[];
  zet: (v: T[]) => void;
  meervoud?: boolean;
}) {
  return (
    <div className="chips">
      {opties.map((o) => {
        const aan = gekozen.includes(o.waarde);
        return (
          <button
            key={o.waarde}
            type="button"
            className="chip"
            aria-pressed={aan}
            onClick={() => {
              if (!meervoud) return zet([o.waarde]);
              zet(aan ? gekozen.filter((g) => g !== o.waarde) : [...gekozen, o.waarde]);
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Meldingen({ meldingen }: { meldingen: Melding[] }) {
  if (!meldingen.length) {
    return (
      <div className="melding" style={{ borderColor: 'var(--goed)', background: 'rgba(46,163,107,0.12)' }}>
        <strong>Alles in orde</strong>
        Geen bezwaren gevonden op deze content.
      </div>
    );
  }
  return (
    <div>
      {meldingen.map((m, i) => (
        <div key={i} className={`melding ${m.ernst}`}>
          <strong>
            {ernstLabel[m.ernst]} · {m.onderwerp}
          </strong>
          {m.tekst}
          <span className="oplossing">→ {m.oplossing}</span>
        </div>
      ))}
    </div>
  );
}

export function KopieerKnop({ tekst, label = 'Kopieer' }: { tekst: string; label?: string }) {
  const [gekopieerd, setGekopieerd] = useState(false);

  useEffect(() => {
    if (!gekopieerd) return;
    const t = setTimeout(() => setGekopieerd(false), 1800);
    return () => clearTimeout(t);
  }, [gekopieerd]);

  const kopieer = async () => {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(true);
    } catch {
      // Zonder clipboard-rechten (of op http) valt de browser terug op selecteren.
      const veld = document.createElement('textarea');
      veld.value = tekst;
      veld.style.position = 'fixed';
      veld.style.opacity = '0';
      document.body.appendChild(veld);
      veld.select();
      document.execCommand('copy');
      veld.remove();
      setGekopieerd(true);
    }
  };

  return (
    <button type="button" className="knop klein" onClick={kopieer}>
      {gekopieerd ? '✓ Gekopieerd' : label}
    </button>
  );
}

export function Tabbladen<T extends string>({
  tabs,
  actief,
  zet,
}: {
  tabs: { id: T; label: string }[];
  actief: T;
  zet: (v: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          className="tab"
          aria-selected={actief === t.id}
          onClick={() => zet(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Leeg({ tekst }: { tekst: string }) {
  return <p className="leeg">{tekst}</p>;
}
