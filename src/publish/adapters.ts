/**
 * Publicatielaag.
 *
 * Belangrijk om te weten voordat je hier iets van verwacht: Instagram, Facebook
 * en TikTok laten niet toe dat een webpagina rechtstreeks namens jou post. Dat
 * moet altijd via een server, met een toegangstoken dat nooit in de browser mag
 * staan, en met een app die door Meta respectievelijk TikTok is goedgekeurd.
 *
 * Daarom zijn er drie routes:
 *  1. Webhook  — werkt vandaag. Je stuurt de post naar Make, Zapier, n8n of je
 *                eigen server, en die doet de publicatie.
 *  2. Eigen server — je draait de meegeleverde serverroutes zelf; deze app
 *                praat dan met jouw eindpunt, niet met Meta of TikTok direct.
 *  3. Handmatig — de app zet beeld en tekst klaar; jij plakt het in de app.
 *                Altijd beschikbaar, ook zonder enige koppeling.
 */

import type { Campagne, KanaalId, Koppeling, Post } from '../types';

export interface PublicatieTaak {
  post: Post;
  campagne: Campagne;
  kanaal: KanaalId;
  caption: string;
  /** Beeld als data-URL, zodat het door elke ontvanger te verwerken is. */
  beeld: string | null;
  gepland: string;
}

export interface PublicatieResultaat {
  gelukt: boolean;
  melding: string;
  /** Identificatie bij de ontvangende partij, als die er is. */
  referentie?: string;
}

export interface Adapter {
  type: Koppeling['type'];
  /** Kan er nu daadwerkelijk gepubliceerd worden? */
  klaar: (k: Koppeling) => boolean;
  /** Wat de gebruiker moet doen als het nog niet klaar is. */
  uitleg: (k: Koppeling) => string;
  publiceer: (k: Koppeling, taak: PublicatieTaak) => Promise<PublicatieResultaat>;
}

/* --------------------------------------------------------------- webhook */

const webhook: Adapter = {
  type: 'webhook',
  klaar: (k) => /^https?:\/\//.test(k.webhookUrl.trim()),
  uitleg: () =>
    'Vul de webhook-URL in van Make, Zapier, n8n of je eigen server. Die ontvangt de post met beeld en tekst en plaatst hem. Dit is de snelste route: je hebt er geen app-review voor nodig.',
  publiceer: async (k, taak) => {
    try {
      const antwoord = await fetch(k.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanaal: taak.kanaal,
          gepland: taak.gepland,
          caption: taak.caption,
          beeld: taak.beeld,
          campagne: taak.campagne.naam,
          bron: 'kozijn-marketing-studio',
        }),
      });
      if (!antwoord.ok) {
        return { gelukt: false, melding: `De webhook antwoordde met status ${antwoord.status}.` };
      }
      return { gelukt: true, melding: 'Naar de webhook verstuurd.' };
    } catch (fout) {
      return {
        gelukt: false,
        melding: `Versturen mislukt: ${(fout as Error).message}. Controleer de URL en of de ontvanger CORS toestaat.`,
      };
    }
  },
};

/* ------------------------------------------------------------------ meta */

const meta: Adapter = {
  type: 'meta',
  klaar: (k) => /^https?:\/\//.test(k.apiBasis.trim()),
  uitleg: () =>
    'Publiceren naar Instagram en Facebook loopt via de Graph API. Dat vereist een Meta-bedrijfsaccount, een gekoppelde Facebook-pagina met een Instagram-bedrijfsprofiel, en een goedgekeurde app met de rechten instagram_content_publish en pages_manage_posts. Het token hoort op een server te staan, niet in deze browser. Vul hier het adres van je eigen publicatieserver in.',
  publiceer: async (k, taak) => {
    try {
      const antwoord = await fetch(`${k.apiBasis.replace(/\/$/, '')}/publiceer/meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanaal: taak.kanaal,
          caption: taak.caption,
          beeld: taak.beeld,
          gepland: taak.gepland,
        }),
      });
      const data = (await antwoord.json().catch(() => ({}))) as { id?: string; fout?: string };
      if (!antwoord.ok) {
        return { gelukt: false, melding: data.fout ?? `Server antwoordde met status ${antwoord.status}.` };
      }
      return { gelukt: true, melding: 'Aangeboden aan Meta.', referentie: data.id };
    } catch (fout) {
      return { gelukt: false, melding: `Geen verbinding met je publicatieserver: ${(fout as Error).message}` };
    }
  },
};

/* ---------------------------------------------------------------- tiktok */

const tiktok: Adapter = {
  type: 'tiktok',
  klaar: (k) => /^https?:\/\//.test(k.apiBasis.trim()),
  uitleg: () =>
    'TikTok publiceert via de Content Posting API. Je hebt een TikTok for Developers-account nodig, een app met de scope video.publish, en een doorlopen audit. Zonder die audit kun je alleen naar je eigen testaccount posten. Ook hier hoort het token op je eigen server te staan.',
  publiceer: async (k, taak) => {
    try {
      const antwoord = await fetch(`${k.apiBasis.replace(/\/$/, '')}/publiceer/tiktok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: taak.caption, beeld: taak.beeld, gepland: taak.gepland }),
      });
      const data = (await antwoord.json().catch(() => ({}))) as { id?: string; fout?: string };
      if (!antwoord.ok) {
        return { gelukt: false, melding: data.fout ?? `Server antwoordde met status ${antwoord.status}.` };
      }
      return { gelukt: true, melding: 'Aangeboden aan TikTok.', referentie: data.id };
    } catch (fout) {
      return { gelukt: false, melding: `Geen verbinding met je publicatieserver: ${(fout as Error).message}` };
    }
  },
};

/* ------------------------------------------------------------- handmatig */

const handmatig: Adapter = {
  type: 'handmatig',
  klaar: () => true,
  uitleg: () => 'Beeld en tekst worden klaargezet om te downloaden en zelf te plaatsen. Werkt altijd.',
  publiceer: async () => ({
    gelukt: true,
    melding: 'Klaargezet om zelf te plaatsen. Download het beeld en kopieer de tekst.',
  }),
};

export const ADAPTERS: Record<Koppeling['type'], Adapter> = { webhook, meta, tiktok, handmatig };

export const adapterVoor = (koppeling: Koppeling): Adapter => ADAPTERS[koppeling.type] ?? handmatig;

/** De koppeling die dit kanaal kan publiceren, als die er is. */
export function koppelingVoorKanaal(koppelingen: Koppeling[], kanaal: KanaalId): Koppeling | null {
  const kandidaten = koppelingen.filter((k) => k.actief && k.kanalen.includes(kanaal));
  // Een eigen server of Meta-koppeling gaat vóór op een generieke webhook.
  return (
    kandidaten.find((k) => k.type === 'meta' || k.type === 'tiktok') ??
    kandidaten.find((k) => k.type === 'webhook') ??
    null
  );
}
