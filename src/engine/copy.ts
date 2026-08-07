/**
 * De tekstmotor: van één idee naar een volledig uitgewerkte campagne.
 *
 * Het uitgangspunt is dat een post drie dingen moet doen — stoppen (hook),
 * overtuigen (koopreden + bewijs) en vragen (één heldere oproep). Elke hoek
 * heeft zijn eigen opbouw, en elk kanaal zijn eigen schrijfwijze.
 */

import type { AdVariant, Doel, Hoek, Idee, KanaalId, Merk, Uitwerking, VideoScene } from '../types';
import { KANALEN, kanaalById } from '../data/kanalen';
import { doelgroepById } from '../data/doelgroepen';
import { KOOPREDENEN, koopredenById, koopredenenVoorHoek } from '../data/koopredenen';
import { bouwHashtags } from '../data/hashtags';
import { SEIZOENSHAKEN } from '../data/pilaren';
import { bouwVariabelen, kies, kiesMeerdere, kortAf, maakRng, opschonen, titelCase, vul, type Variabelen } from './tekst';

/* ------------------------------------------------------------------ hooks */

const HOOKS: Record<Hoek, string[]> = {
  'voor-na': [
    'Zelfde huis. Andere uitstraling.',
    'Van gedateerd naar strak in één dag',
    'Dit was het. En dit is het nu.',
    'Kijk wat er gebeurt als de oude kozijnen eruit gaan',
    'Dezelfde gevel, nauwelijks te geloven',
    'Even geduld voor het tweede beeld',
  ],
  aanbod: [
    '{actie}',
    'Nu {actie} — en dan nog een reden om niet te wachten',
    'Dit is het moment om je kozijnen aan te pakken',
    'Gratis inmeten, vaste prijs, {garantie} jaar garantie',
    'Je weet binnen een week wat het kost',
  ],
  'probleem-oplossing': [
    'Tocht langs de ramen? Dat is niet normaal.',
    'Verwarming op 21 en toch koud bij het raam',
    'Beslagen ramen zijn geen weerprobleem',
    'Als je het thuis hoort als er een auto langsrijdt',
    'Je stookt nu deels voor de straat',
  ],
  bewijs: [
    'Weer een woning klaar in {plaats}',
    '{score} gemiddeld. Daar doen we het voor.',
    'Dit schreef een klant na de oplevering',
    'Zo ziet vakwerk er van dichtbij uit',
    'Al {jaren} jaar dezelfde afspraak: strak opgeleverd',
  ],
  educatie: [
    'HR++ of triple? Zo kies je het juiste glas',
    'Waar zit het prijsverschil tussen offertes eigenlijk in?',
    '3 vragen die je elke kozijnverkoper moet stellen',
    'Dit moet je weten vóórdat je kozijnen bestelt',
    'Waarom kunststof niet meer op kunststof lijkt',
  ],
  'achter-de-schermen': [
    'Half zeven. Bus in, koffie mee.',
    'Zo ziet een montagedag er echt uit',
    'Dit gebeurt er nadat jij ja hebt gezegd',
    'Onze monteurs aan het werk in {plaats}',
    'Het minst spannende deel van het werk, en het belangrijkste',
  ],
  urgentie: [
    'De planning loopt vol',
    'Nog even en de winter staat weer voor de deur',
    'Laatste weken van {actie}',
    'Wie nu inmeet, zit voor de winter warm',
  ],
  vergelijking: [
    'Kunststof of hout? Eerlijk antwoord.',
    'Dubbel glas versus HR++: het verschil in één beeld',
    'Goedkoopste offerte versus beste offerte',
    'Renovatie of compleet vervangen — wanneer wat?',
  ],
  seizoen: [
    'Het is weer die tijd van het jaar',
    'De eerste koude nacht en je voelt het meteen',
    'Zomer is het beste moment om dit te regelen',
    'Voor de winter geregeld, de rest van je leven profijt',
  ],
  'vraag-antwoord': [
    '"Hoelang duurt het eigenlijk?"',
    '"Moet ik dan de hele dag thuis zijn?"',
    '"Wat kost het bij een rijtjeshuis?"',
    '"Kan het ook in de winter?"',
    '"Blijft mijn huis wel bewoonbaar?"',
  ],
};

/* ------------------------------------------------------------------- CTAs */

const CTAS: Record<Doel, { knop: string; regel: string[] }> = {
  offerteaanvraag: {
    knop: 'Vraag je prijs op',
    regel: [
      'Vraag vrijblijvend je prijs op via {website}',
      'Plan een gratis inmeetafspraak — je zit nergens aan vast',
      'Stuur een bericht en je hebt binnen een week een vaste prijs',
    ],
  },
  bellen: {
    knop: 'Bel {telefoon}',
    regel: [
      'Bel {telefoon} en we plannen meteen een moment in',
      'Even overleggen? Bel {telefoon}, je krijgt gewoon iemand aan de lijn',
    ],
  },
  whatsapp: {
    knop: 'App ons',
    regel: [
      'Stuur een foto van je kozijnen naar {whatsapp} en je hoort wat er mogelijk is',
      'Even appen is genoeg: {whatsapp}',
    ],
  },
  bereik: {
    knop: 'Bewaar dit',
    regel: ['Sla dit op voor als je eraan toe bent', 'Deel dit met wie hier al jaren over twijfelt'],
  },
  volgers: {
    knop: 'Volg ons',
    regel: ['Volg ons voor meer vóór/ná uit de regio', 'Volgen? Elke week een nieuw project'],
  },
  vertrouwen: {
    knop: 'Bekijk ons werk',
    regel: ['Meer projecten zien? Kijk op {website}', 'Benieuwd wat we voor buurtgenoten deden? Kijk even mee'],
  },
};

/* ------------------------------------------------------------------ body */

const OPENERS: Record<string, string[]> = {
  probleem: [
    'Je kent het wel: {pijn}.',
    'Negen van de tien keer begint het hiermee — {pijn}.',
    'Herkenbaar? {pijn}.',
  ],
  bewijs: [
    'Deze week opgeleverd in {plaats}.',
    'Weer een woning die er voor de komende twintig jaar tegen kan.',
    'Klaar. En de klant zag het verschil meteen.',
  ],
  aanbod: [
    'Loop je al langer met dit plan rond? Dit is het moment.',
    'Even concreet:',
  ],
};

/* --------------------------------------------------------------- captions */

interface Bouwstenen {
  hook: string;
  kop: string;
  subkop: string;
  badge: string;
  bullets: string[];
  ctaRegel: string;
  ctaKnop: string;
  redenLang: string;
  pijn: string;
  bezwaarAntwoord: string;
  v: Variabelen;
}

function captionInstagramFeed(b: Bouwstenen, tags: string[]): string {
  return opschonen(
    [
      b.hook,
      '',
      b.redenLang,
      '',
      b.bullets.map((x) => `✓ ${x}`).join('\n'),
      '',
      b.ctaRegel,
      '',
      tags.join(' '),
    ].join('\n'),
  );
}

function captionFacebook(b: Bouwstenen, tags: string[]): string {
  return opschonen(
    [
      b.hook,
      '',
      b.redenLang,
      '',
      b.bezwaarAntwoord,
      '',
      b.bullets.map((x) => `• ${x}`).join('\n'),
      '',
      b.ctaRegel,
      b.v.telefoon ? `📞 ${b.v.telefoon}` : '',
      b.v.website ? `🌐 ${b.v.website}` : '',
      '',
      tags.slice(0, 3).join(' '),
    ].join('\n'),
  );
}

function captionKort(b: Bouwstenen, tags: string[], max: number): string {
  return kortAf(opschonen([b.hook, b.ctaRegel, tags.join(' ')].join('\n')), max);
}

function captionReel(b: Bouwstenen, tags: string[]): string {
  return opschonen([b.hook, '', b.ctaRegel, '', tags.join(' ')].join('\n'));
}

function captionAdvertentie(b: Bouwstenen): string {
  return opschonen(
    [b.redenLang, '', b.bullets.map((x) => `✓ ${x}`).join('\n'), '', b.ctaRegel].join('\n'),
  );
}

/* ----------------------------------------------------------- hoofdfunctie */

export function werkIdeeUit(idee: Idee, merk: Merk, seed: number): Uitwerking {
  const rng = maakRng(seed);
  const actie = merk.acties.find((a) => a.id === idee.actieId && a.actief) ?? null;
  const v = bouwVariabelen(merk, actie?.claim ?? '', actie?.waarop ?? '');
  const doelgroep = doelgroepById(idee.doelgroepId);
  const maand = new Date().getMonth() + 1;

  /* Koopredenen kiezen: eerst wat bij de hoek past, dan wat bij de doelgroep
     past, en de actie krijgt voorrang zodra er een loopt. */
  const bijHoek = koopredenenVoorHoek(idee.hoek);
  const bijDoelgroep = doelgroep.redenen.map((id) => koopredenById(id)).filter(Boolean) as typeof KOOPREDENEN;
  const kandidaten = [...bijDoelgroep, ...bijHoek].filter(
    (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i,
  );
  const gekozen = actie
    ? [koopredenById('actie-korting')!, ...kandidaten.filter((r) => r.id !== 'actie-korting').slice(0, 4)]
    : kandidaten.filter((r) => r.id !== 'actie-korting').slice(0, 5);

  /* Kop op het beeld: kort, hard, maximaal een paar woorden. */
  const eigenIdee = idee.tekst.trim();
  const hookBasis = eigenIdee.length > 3 ? eigenIdee : kies(rng, HOOKS[idee.hoek]);
  const hook = vul(hookBasis, v);

  const kop = vul(
    idee.hoek === 'aanbod' && actie
      ? actie.claim
      : eigenIdee.length > 3 && eigenIdee.length <= 46
        ? eigenIdee
        : kies(rng, HOOKS[idee.hoek]),
    v,
  );

  const subkopOpties = [
    actie ? vul(actie.waarop, v) : '',
    doelgroep.verlangen[0] ?? '',
    vul(kies(rng, gekozen).kort[0] ?? '', v),
    merk.slogan,
  ].filter(Boolean);
  const subkop = kortAf(vul(kies(rng, subkopOpties), v), 90);

  const badge = actie
    ? vul(actie.claim, v)
    : idee.hoek === 'voor-na'
      ? 'VÓÓR / NÁ'
      : idee.hoek === 'bewijs' && merk.bewijs.reviewScore
        ? `★ ${merk.bewijs.reviewScore}`
        : idee.hoek === 'seizoen'
          ? SEIZOENSHAKEN[maand].thema.toUpperCase()
          : merk.werkgebied[0]
            ? merk.werkgebied[0].toUpperCase()
            : '';

  /* Opsommingen: eerst de eigen USP's, aangevuld met korte koopredenen. */
  const uspBullets = merk.bewijs.usps.filter(Boolean).slice(0, 2);
  const redenBullets = gekozen
    .filter((r) => r.id !== 'actie-korting')
    .slice(0, 4)
    .map((r) => vul(kies(rng, r.kort), v));

  /* Bij een vergelijking staan de eerste twee punten voor de huidige situatie
     en de laatste twee voor de nieuwe — het sjabloon splitst ze in die volgorde
     over de kolommen "Nu" en "Straks". */
  const bullets =
    idee.hoek === 'vergelijking'
      ? [
          ...doelgroep.pijn.slice(0, 2).map(titelCase),
          ...redenBullets.slice(0, 2),
        ]
      : [...uspBullets, ...redenBullets].filter(Boolean).slice(0, 4);

  const cta = CTAS[idee.doel];
  const ctaKnop = vul(cta.knop, v);
  const ctaRegel = vul(kies(rng, cta.regel), v);

  const redenLangBron = kies(rng, gekozen);
  const redenLang = vul(kies(rng, redenLangBron.lang), v);

  const pijn = kies(rng, doelgroep.pijn).toLowerCase();
  const bezwaar = kies(rng, doelgroep.bezwaar);
  const bezwaarAntwoord = beantwoordBezwaar(bezwaar, v);

  const opener = vul(
    kies(rng, OPENERS[idee.hoek === 'bewijs' || idee.hoek === 'voor-na' ? 'bewijs' : idee.hoek === 'aanbod' ? 'aanbod' : 'probleem']).replace(
      '{pijn}',
      pijn,
    ),
    v,
  );

  const b: Bouwstenen = {
    hook: idee.context.trim() ? `${hook}` : hook,
    kop,
    subkop,
    badge,
    bullets,
    ctaRegel,
    ctaKnop,
    redenLang: [opener, redenLang, idee.context.trim()].filter(Boolean).join(' '),
    pijn,
    bezwaarAntwoord,
    v,
  };

  /* Captions per gekozen kanaal. */
  const captions: Partial<Record<KanaalId, string>> = {};
  const kanalen = idee.kanalen.length ? idee.kanalen : (['instagram-feed'] as KanaalId[]);
  for (const kid of kanalen) {
    const kanaal = kanaalById(kid);
    const tags = bouwHashtags({
      hoek: idee.hoek,
      werkgebied: merk.werkgebied,
      bedrijfsnaam: merk.bedrijfsnaam,
      aantal: kanaal.hashtags,
    });
    switch (kid) {
      case 'instagram-feed':
        captions[kid] = captionInstagramFeed(b, tags);
        break;
      case 'facebook-feed':
        captions[kid] = captionFacebook(b, tags);
        break;
      case 'instagram-reel':
      case 'tiktok':
        captions[kid] = captionReel(b, tags);
        break;
      case 'instagram-story':
      case 'facebook-story':
        captions[kid] = captionKort(b, [], kanaal.maxTekens);
        break;
      case 'meta-ads':
        captions[kid] = captionAdvertentie(b);
        break;
      case 'whatsapp':
        captions[kid] = opschonen(
          `Hoi! ${b.redenLang}\n\n${b.ctaRegel}\n\n${v.bedrijf}${v.telefoon ? ` — ${v.telefoon}` : ''}`,
        );
        break;
      case 'email':
        captions[kid] = opschonen(
          [
            `Beste bewoner,`,
            '',
            b.redenLang,
            '',
            b.bullets.map((x) => `• ${x}`).join('\n'),
            '',
            b.bezwaarAntwoord,
            '',
            b.ctaRegel,
            '',
            `Met vriendelijke groet,`,
            v.bedrijf,
            v.telefoon,
          ].join('\n'),
        );
        break;
      default:
        captions[kid] = opschonen(`${b.hook}\n\n${b.ctaRegel}`);
    }
    captions[kid] = kortAf(captions[kid] ?? '', kanaal.maxTekens);
  }

  const hashtags = bouwHashtags({
    hoek: idee.hoek,
    werkgebied: merk.werkgebied,
    bedrijfsnaam: merk.bedrijfsnaam,
    aantal: 12,
  });

  return {
    badge,
    kop,
    subkop,
    bullets,
    cta: ctaKnop,
    ctaSub: v.telefoon || v.website || '',
    captions,
    hashtags,
    koopredenen: gekozen.map((r) => r.label),
    advarianten: bouwAdvarianten(idee, merk, v, rng),
    video: bouwVideo(idee, merk, v, b, rng),
    offline: {
      flyerKop: kop,
      flyerTekst: opschonen(`${b.redenLang}\n\n${b.bullets.map((x) => `• ${x}`).join('\n')}`),
      bordTekst: kortAf(kop, 34),
      emailOnderwerp: bouwOnderwerp(idee, v, rng),
      emailTekst: captions.email ?? opschonen(`${b.hook}\n\n${b.redenLang}\n\n${b.ctaRegel}`),
      whatsapp: captions.whatsapp ?? opschonen(`${b.hook}\n\n${b.ctaRegel}`),
    },
  };
}

/* --------------------------------------------------------------- bezwaren */

function beantwoordBezwaar(bezwaar: string, v: Variabelen): string {
  const b = bezwaar.toLowerCase();
  if (b.includes('kost') || b.includes('betalen') || b.includes('prijs')) {
    return 'Je krijgt vooraf een vaste prijs waarin alles zit — kozijnen, glas, montage, afwerking en het afvoeren van het oude. Geen nacalculatie achteraf.';
  }
  if (b.includes('overlast') || b.includes('rommel') || b.includes('dagen') || b.includes('bewoonbaar')) {
    return 'Bij de meeste woningen staat alles binnen één dag. We leggen je vloeren af, ruimen op en je slaapt gewoon in je eigen huis.';
  }
  if (b.includes('betrouw') || b.includes('aangepraat') || b.includes('overvraagd') || b.includes('wie zijn')) {
    return `We werken met eigen vaste monteurs en geven ${v.garantie} jaar garantie op product én montage. Eén partij aanspreekbaar, ook over vijf jaar nog.`;
  }
  if (b.includes('wachten') || b.includes('moeite') || b.includes('zinvol')) {
    return 'Elke winter dat je wacht, stook je door de ramen naar buiten. Dat geld komt nooit meer terug — de investering wel.';
  }
  if (b.includes('meerdere woningen') || b.includes('complex')) {
    return 'We doen regelmatig complete complexen: één planning, één aanspreekpunt en bewoners die weten waar ze aan toe zijn.';
  }
  return `Vrijblijvend inmeten, vaste prijs en ${v.garantie} jaar garantie. Je zit nergens aan vast tot je zelf ja zegt.`;
}

/* ---------------------------------------------------------- advertenties */

function bouwAdvarianten(idee: Idee, merk: Merk, v: Variabelen, rng: () => number): AdVariant[] {
  const doelgroep = doelgroepById(idee.doelgroepId);
  const redenen = kiesMeerdere(rng, koopredenenVoorHoek(idee.hoek).slice(0, 8), 4);
  const ctaKnop = CTAS[idee.doel].knop;

  const koppen = [
    (r: (typeof redenen)[number]) => vul(kies(rng, r.kort), v),
    () => vul(`${titelCase(doelgroep.pijn[0] ?? 'Tocht langs de ramen')}?`, v),
    () => vul(merk.acties.find((a) => a.actief) ? '{actie} op nieuwe kozijnen' : 'Nieuwe kozijnen in {plaats}', v),
    () => vul('Gratis inmeten, vaste prijs', v),
  ];

  return redenen.map((r, i) => ({
    kop: kortAf(koppen[i % koppen.length](r), 40),
    tekst: kortAf(
      vul(
        `${kies(rng, r.lang)} ${kies(rng, CTAS[idee.doel].regel)}`,
        v,
      ),
      280,
    ),
    beschrijving: kortAf(vul(kies(rng, [merk.slogan, 'Gratis inmeten · Vaste prijs · {garantie} jaar garantie']), v), 60),
    cta: vul(ctaKnop, v),
    koopreden: r.label,
    doelgroep: `${doelgroep.label} · ${doelgroep.leeftijd} jaar${merk.werkgebied.length ? ` · ${merk.werkgebied.slice(0, 3).join(', ')}` : ''}`,
  }));
}

function bouwOnderwerp(idee: Idee, v: Variabelen, rng: () => number): string {
  const opties = [
    'Even over je kozijnen',
    vul('{actie} — geldt nog tot het eind van de maand', v),
    vul('We werken deze week in {plaats}', v),
    'Wat nieuwe kozijnen bij jou zouden kosten',
    kies(rng, HOOKS[idee.hoek]),
  ];
  return kortAf(vul(kies(rng, opties), v), 60);
}

/* ---------------------------------------------------------------- video */

function bouwVideo(
  idee: Idee,
  merk: Merk,
  v: Variabelen,
  b: Bouwstenen,
  rng: () => number,
): Uitwerking['video'] {
  const hook = kortAf(b.kop, 42);

  const scenesVoorNa: VideoScene[] = [
    {
      van: 0,
      tot: 2,
      beeld: 'Statisch shot van de oude gevel, camera stil. Geen intro, meteen beeld.',
      tekstOpBeeld: hook,
      voiceover: `Dit is de voorkant van een woning in ${v.plaats}.`,
    },
    {
      van: 2,
      tot: 5,
      beeld: 'Inzoomen op het probleem: verweerd hout, kit die loslaat, condens tussen het glas.',
      tekstOpBeeld: titelCase(b.pijn),
      voiceover: 'De kozijnen waren op. Tocht, condens en elke vijf jaar de schilder.',
    },
    {
      van: 5,
      tot: 9,
      beeld: 'Snelle montagebeelden: oude kozijn eruit, nieuwe erin, stellen en afkitten.',
      tekstOpBeeld: 'In één dag geplaatst',
      voiceover: 'Eén dag werk. Vloeren afgedekt, alles opgeruimd.',
    },
    {
      van: 9,
      tot: 13,
      beeld: 'Exact hetzelfde camerastandpunt als scène 1 — dat maakt het verschil zichtbaar.',
      tekstOpBeeld: 'En nu.',
      voiceover: 'Zelfde huis, zelfde standpunt.',
    },
    {
      van: 13,
      tot: 17,
      beeld: 'Detailshots van de nieuwe kozijnen, hand die het raam moeiteloos opent.',
      tekstOpBeeld: b.bullets[0] ?? 'Nooit meer schilderen',
      voiceover: kies(rng, ['Warm, stil en onderhoudsvrij.', 'Klaar voor de komende twintig jaar.']),
    },
    {
      van: 17,
      tot: 20,
      beeld: 'Eindbeeld met logo en contactgegevens, groot in beeld.',
      tekstOpBeeld: b.ctaKnop,
      voiceover: `${merk.bedrijfsnaam}${v.telefoon ? `, bel ${v.telefoon}` : ''}.`,
    },
  ];

  const scenesUitleg: VideoScene[] = [
    {
      van: 0,
      tot: 2,
      beeld: 'Jij recht in de camera, buiten bij een woning. Direct beginnen met de vraag.',
      tekstOpBeeld: hook,
      voiceover: b.hook,
    },
    {
      van: 2,
      tot: 7,
      beeld: 'Wijs het aan op een echt kozijn. Laat zien waar je het over hebt.',
      tekstOpBeeld: b.bullets[0] ?? '',
      voiceover: b.redenLang,
    },
    {
      van: 7,
      tot: 12,
      beeld: 'Tegenvoorbeeld of vergelijking in beeld — twee situaties naast elkaar.',
      tekstOpBeeld: b.bullets[1] ?? '',
      voiceover: b.bezwaarAntwoord,
    },
    {
      van: 12,
      tot: 16,
      beeld: 'Terug naar de camera, rustig afsluiten met de oproep.',
      tekstOpBeeld: b.ctaKnop,
      voiceover: b.ctaRegel,
    },
  ];

  const scenes = idee.hoek === 'voor-na' || idee.hoek === 'bewijs' ? scenesVoorNa : scenesUitleg;

  return {
    hook,
    scenes,
    muziek:
      idee.hoek === 'voor-na'
        ? 'Rustige opbouw met een duidelijk omslagpunt op de onthulling (seconde 9).'
        : 'Neutrale achtergrondmuziek, laag in de mix — je stem moet leidend blijven.',
    lengte: scenes[scenes.length - 1].tot,
  };
}

/** Alle kanalen gegroepeerd, voor de keuzeschermen. */
export const KANAALGROEPEN = {
  online: KANALEN.filter((k) => k.groep === 'online'),
  advertentie: KANALEN.filter((k) => k.groep === 'advertentie'),
  offline: KANALEN.filter((k) => k.groep === 'offline'),
};
