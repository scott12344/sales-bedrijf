/**
 * Doelgroepen voor kozijnverkoop. Per doelgroep leggen we vast wat hen raakt,
 * welke woorden ze zelf gebruiken en welk bezwaar je vóór moet zijn. De
 * tekstmotor en de advertentiegenerator putten hieruit.
 */

export interface Doelgroep {
  id: string;
  label: string;
  omschrijving: string;
  leeftijd: string;
  /** Waar deze groep 's avonds wakker van ligt. */
  pijn: string[];
  /** Wat ze willen bereiken. */
  verlangen: string[];
  /** Het bezwaar dat je moet wegnemen voordat ze bellen. */
  bezwaar: string[];
  /** Woorden die zij zelf gebruiken — daarmee schrijf je herkenbaar. */
  taal: string[];
  /** Koopredenen die bij deze groep het hardst aankomen. */
  redenen: string[];
  kanaalvoorkeur: string[];
}

export const DOELGROEPEN: Doelgroep[] = [
  {
    id: 'gezin-jaren-70',
    label: 'Gezin in een jaren 70/80-woning',
    omschrijving:
      'Tweeverdieners met kinderen in een rijtjeshuis dat aan een opknapbeurt toe is. Praktisch ingesteld, vergelijken offertes, beslissen samen.',
    leeftijd: '32-50',
    pijn: [
      'Het tocht langs de ramen en de verwarming staat hoog',
      'Energierekening blijft stijgen',
      'Kozijnen moeten weer geschilderd worden en dat kost elke keer geld',
      'Beslagen ramen en zwarte randen op het kozijn',
    ],
    verlangen: [
      'Een huis waar het overal behaaglijk is',
      'Klaar zijn met onderhoud voor de komende twintig jaar',
      'Waarde toevoegen aan het huis',
    ],
    bezwaar: [
      'Wat gaat dit kosten — en klopt die prijs straks nog?',
      'Hoeveel rommel en overlast geeft het?',
      'Is dit bedrijf betrouwbaar of ben ik straks alleen met een probleem?',
    ],
    taal: ['tocht', 'stookkosten', 'rijtjeshuis', 'in één keer goed', 'wat kost dat dan'],
    redenen: ['energie-besparing', 'comfort-tocht', 'vaste-prijs', 'onderhoud', 'garantie'],
    kanaalvoorkeur: ['facebook-feed', 'instagram-feed', 'meta-ads'],
  },
  {
    id: 'senioren',
    label: 'Senioren met een eigen woning',
    omschrijving:
      'Vaak hypotheekvrij, wonen er al lang, willen comfort en gemak. Hechten zeer aan betrouwbaarheid en aan een net achtergelaten huis.',
    leeftijd: '60-80',
    pijn: [
      'Ramen zijn zwaar te openen of klemmen',
      'Koud bij het raam zitten',
      'Opzien tegen groot onderhoud en tegen gedoe met aannemers',
    ],
    verlangen: [
      'Comfortabel oud worden in het eigen huis',
      'Geen onderhoud meer aan de buitenkant',
      'Rust en veiligheid',
    ],
    bezwaar: [
      'Word ik hier overvraagd of iets aangepraat?',
      'Hoeveel dagen loopt er iemand door mijn huis?',
      'Is dit nog wel de moeite op mijn leeftijd?',
    ],
    taal: ['netjes achterlaten', 'geen gedoe', 'vertrouwd', 'even langskomen', 'duidelijk uitleggen'],
    redenen: ['comfort-tocht', 'onderhoud', 'eigen-monteurs', 'garantie', 'snel-geplaatst', 'inbraak'],
    kanaalvoorkeur: ['facebook-feed', 'flyer-a5', 'meta-ads'],
  },
  {
    id: 'starters',
    label: 'Starters met een opknapper',
    omschrijving:
      'Net gekocht, budget beperkt, doen veel zelf maar niet de kozijnen. Zoeken online, vergelijken hard op prijs en willen gespreid kunnen betalen.',
    leeftijd: '25-38',
    pijn: [
      'Huis is koud en het geld is op na de aankoop',
      'Alles moet tegelijk gebeuren',
      'Geen idee wat een normale prijs is',
    ],
    verlangen: ['Snel een leefbaar huis', 'Grip op de kosten', 'Het meteen goed doen'],
    bezwaar: ['Kan ik dit nu al betalen?', 'Kan ik niet beter wachten?'],
    taal: ['net gekocht', 'opknapper', 'stap voor stap', 'wat kost het per maand'],
    redenen: ['financiering', 'actie-korting', 'energie-besparing', 'gratis-advies'],
    kanaalvoorkeur: ['instagram-reel', 'tiktok', 'instagram-feed'],
  },
  {
    id: 'verduurzamers',
    label: 'Bewuste verduurzamers',
    omschrijving:
      'Hebben al zonnepanelen of een warmtepomp en zien kozijnen als de volgende stap. Lezen zich in, vragen om waarden en onderbouwing.',
    leeftijd: '35-65',
    pijn: ['Warmtepomp draait te hard door slechte schil', 'Energielabel blijft steken'],
    verlangen: ['Zo laag mogelijk verbruik', 'Een woning die klaar is voor de toekomst'],
    bezwaar: ['Is dit de meest zinvolle investering nu?', 'Krijg ik hier harde cijfers bij?'],
    taal: ['isolatiewaarde', 'energielabel', 'triple glas', 'schil van de woning', 'terugverdientijd'],
    redenen: ['energie-besparing', 'woningwaarde', 'subsidie', 'geluid'],
    kanaalvoorkeur: ['facebook-feed', 'instagram-feed', 'email'],
  },
  {
    id: 'drukke-weg',
    label: 'Wonen aan een drukke weg',
    omschrijving:
      'Geluidsoverlast is hun hoofdreden, isolatie is meegenomen. Zeer gerichte doelgroep om lokaal op te adverteren.',
    leeftijd: '30-70',
    pijn: ['Verkeerslawaai in de woonkamer en slaapkamer', 'Ramen kunnen nooit open', 'Slecht slapen'],
    verlangen: ['Stilte in huis', 'Weer met het raam open kunnen slapen'],
    bezwaar: ['Helpt dit echt tegen geluid of is dat verkooppraat?'],
    taal: ['herrie', 'lawaai', 'niet te harden', 'nooit rust'],
    redenen: ['geluid', 'comfort-tocht', 'reviews'],
    kanaalvoorkeur: ['meta-ads', 'facebook-feed'],
  },
  {
    id: 'vve-verhuurder',
    label: 'VvE en particuliere verhuurders',
    omschrijving:
      'Beslissen zakelijk, meerdere woningen tegelijk. Willen planning, garantie en één aanspreekpunt. Langere doorlooptijd, grotere orders.',
    leeftijd: '35-70',
    pijn: ['Klachten van bewoners over tocht en onderhoud', 'Verplichting om te verduurzamen'],
    verlangen: ['Alles in één keer geregeld', 'Voorspelbare kosten en planning'],
    bezwaar: ['Kunnen jullie meerdere woningen aan?', 'Hoe gaat dat met bewoners in huis?'],
    taal: ['complex', 'meerjarenonderhoudsplan', 'bewoners', 'offertetraject'],
    redenen: ['eigen-monteurs', 'vaste-prijs', 'garantie', 'ervaring', 'snel-geplaatst'],
    kanaalvoorkeur: ['email', 'facebook-feed'],
  },
  {
    id: 'breed',
    label: 'Breed publiek in het werkgebied',
    omschrijving:
      'Iedereen met een koopwoning in de regio. Gebruik je voor merkbekendheid, vóór/ná-content en bewijs — niet voor scherpe aanbiedingen.',
    leeftijd: '28-75',
    pijn: ['Huis voelt gedateerd', 'Twijfel over welke partij te kiezen'],
    verlangen: ['Een huis om trots op te zijn', 'Een partij die het gewoon goed regelt'],
    bezwaar: ['Wie zijn jullie eigenlijk?'],
    taal: ['bij ons in de straat', 'mooi geworden', 'wie heeft dat gedaan'],
    redenen: ['lokaal', 'reviews', 'op-maat', 'ervaring'],
    kanaalvoorkeur: ['instagram-feed', 'facebook-feed', 'tiktok', 'instagram-reel'],
  },
];

export const doelgroepById = (id: string): Doelgroep =>
  DOELGROEPEN.find((d) => d.id === id) ?? DOELGROEPEN[DOELGROEPEN.length - 1];
