import type { Doel, Hoek } from '../types';

/**
 * Ideeënbank: concrete posts die je zonder nadenken kunt inplannen. Hiermee
 * kan het systeem zelfstandig een kalender vullen die het hele jaar door
 * gevarieerd blijft — je hoeft alleen nog beeld aan te leveren.
 */

export interface IdeeSjabloon {
  id: string;
  pilaar: string;
  hoek: Hoek;
  titel: string;
  /** Wat je moet filmen of fotograferen. */
  beeld: string;
  doel: Doel;
  sjabloonId: string;
  doelgroepId: string;
  /** Maanden waarin dit idee extra goed werkt (leeg = het hele jaar). */
  maanden: number[];
}

export const IDEEENBANK: IdeeSjabloon[] = [
  /* ---------------------------------------------------------- bewijs */
  {
    id: 'voorna-gevel',
    pilaar: 'bewijs',
    hoek: 'voor-na',
    titel: 'Vóór en ná van de complete voorgevel',
    beeld: 'Twee foto\'s vanaf exact hetzelfde standpunt: één vóór de montage, één erna.',
    doel: 'offerteaanvraag',
    sjabloonId: 'voor-na-split',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'voorna-detail',
    pilaar: 'bewijs',
    hoek: 'voor-na',
    titel: 'Detail: verrot houten kozijn versus strak nieuw kozijn',
    beeld: 'Close-up van houtrot of loszittende kit, en dezelfde hoek na de montage.',
    doel: 'offerteaanvraag',
    sjabloonId: 'voor-na-schuif',
    doelgroepId: 'gezin-jaren-70',
    maanden: [],
  },
  {
    id: 'review-citaat',
    pilaar: 'bewijs',
    hoek: 'bewijs',
    titel: 'Letterlijk citaat uit een klantbeoordeling',
    beeld: 'Foto van de opgeleverde woning, tekst eroverheen.',
    doel: 'vertrouwen',
    sjabloonId: 'review',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'project-plaats',
    pilaar: 'bewijs',
    hoek: 'bewijs',
    titel: 'Weer een woning klaar in {plaats}',
    beeld: 'Eindresultaat in het mooiste licht, liefst tegen het eind van de middag.',
    doel: 'bereik',
    sjabloonId: 'statement',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'schuifpui-oplevering',
    pilaar: 'bewijs',
    hoek: 'voor-na',
    titel: 'Kleine achterdeur werd een schuifpui',
    beeld: 'Binnenkant vóór en ná — het lichtverschil is het verhaal.',
    doel: 'offerteaanvraag',
    sjabloonId: 'voor-na-split',
    doelgroepId: 'verduurzamers',
    maanden: [3, 4, 5, 6],
  },
  {
    id: 'cijfers-jaar',
    pilaar: 'bewijs',
    hoek: 'bewijs',
    titel: 'Onze cijfers van dit jaar',
    beeld: 'Sterke sfeerfoto van het team of een opgeleverd project.',
    doel: 'vertrouwen',
    sjabloonId: 'cijfers',
    doelgroepId: 'breed',
    maanden: [1, 12],
  },

  /* ---------------------------------------------------------- aanbod */
  {
    id: 'actie-hoofdpost',
    pilaar: 'aanbod',
    hoek: 'aanbod',
    titel: 'De lopende actie groot in beeld',
    beeld: 'Mooiste project als achtergrond, actie eroverheen.',
    doel: 'offerteaanvraag',
    sjabloonId: 'aanbod',
    doelgroepId: 'gezin-jaren-70',
    maanden: [],
  },
  {
    id: 'gratis-inmeetweek',
    pilaar: 'aanbod',
    hoek: 'urgentie',
    titel: 'Gratis inmeetweek in één specifieke plaats',
    beeld: 'Bus of monteur in de straat, herkenbaar lokaal beeld.',
    doel: 'bellen',
    sjabloonId: 'aanbod',
    doelgroepId: 'senioren',
    maanden: [],
  },
  {
    id: 'planning-vol',
    pilaar: 'aanbod',
    hoek: 'urgentie',
    titel: 'Nog enkele plekken in de planning',
    beeld: 'Agenda, planbord of de bus met materiaal.',
    doel: 'whatsapp',
    sjabloonId: 'statement',
    doelgroepId: 'gezin-jaren-70',
    maanden: [8, 9, 10, 11],
  },
  {
    id: 'prijsvoorbeeld',
    pilaar: 'aanbod',
    hoek: 'aanbod',
    titel: 'Wat kost het bij een doorsnee rijtjeshuis?',
    beeld: 'Foto van een rijtjeswoning die je hebt gedaan.',
    doel: 'offerteaanvraag',
    sjabloonId: 'usp-lijst',
    doelgroepId: 'starters',
    maanden: [],
  },

  /* ----------------------------------------------------------- uitleg */
  {
    id: 'hr-of-triple',
    pilaar: 'uitleg',
    hoek: 'vergelijking',
    titel: 'HR++ of triple glas: wanneer is welk zinvol?',
    beeld: 'Doorsnede van een glaspakket of een raam met de hand ertegen.',
    doel: 'vertrouwen',
    sjabloonId: 'vergelijking',
    doelgroepId: 'verduurzamers',
    maanden: [],
  },
  {
    id: 'kunststof-of-hout',
    pilaar: 'uitleg',
    hoek: 'vergelijking',
    titel: 'Kunststof of hout — eerlijk antwoord',
    beeld: 'Twee kozijnen naast elkaar, of het oude houten kozijn in de container.',
    doel: 'vertrouwen',
    sjabloonId: 'vergelijking',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'drie-vragen',
    pilaar: 'uitleg',
    hoek: 'educatie',
    titel: '3 vragen die je elke kozijnverkoper moet stellen',
    beeld: 'Jij aan het woord bij een kozijn, of tekst op een rustige achtergrond.',
    doel: 'volgers',
    sjabloonId: 'lijst-tips',
    doelgroepId: 'gezin-jaren-70',
    maanden: [],
  },
  {
    id: 'offerte-verschil',
    pilaar: 'uitleg',
    hoek: 'educatie',
    titel: 'Waarom de ene offerte duizenden euro\'s scheelt met de andere',
    beeld: 'Twee papieren offertes naast elkaar, of tekst op beeld.',
    doel: 'vertrouwen',
    sjabloonId: 'lijst-tips',
    doelgroepId: 'gezin-jaren-70',
    maanden: [],
  },
  {
    id: 'condens-uitleg',
    pilaar: 'uitleg',
    hoek: 'probleem-oplossing',
    titel: 'Beslagen ramen: wat het betekent en wat je eraan doet',
    beeld: 'Close-up van condens tussen het glas.',
    doel: 'offerteaanvraag',
    sjabloonId: 'probleem',
    doelgroepId: 'gezin-jaren-70',
    maanden: [10, 11, 12, 1, 2],
  },
  {
    id: 'tocht-test',
    pilaar: 'uitleg',
    hoek: 'probleem-oplossing',
    titel: 'De kaarsjestest: zo weet je of je kozijnen lekken',
    beeld: 'Vlammetje of stukje papier bij de kier van een oud raam.',
    doel: 'whatsapp',
    sjabloonId: 'probleem',
    doelgroepId: 'breed',
    maanden: [10, 11, 12, 1, 2, 3],
  },
  {
    id: 'kleuren-uitleg',
    pilaar: 'uitleg',
    hoek: 'educatie',
    titel: 'Welke kozijnkleur past bij welke gevel?',
    beeld: 'Meerdere opgeleverde woningen in verschillende kleuren.',
    doel: 'volgers',
    sjabloonId: 'lijst-tips',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'winter-mogelijk',
    pilaar: 'uitleg',
    hoek: 'vraag-antwoord',
    titel: '"Kan het ook in de winter?"',
    beeld: 'Montagebeelden op een koude dag, adem zichtbaar.',
    doel: 'offerteaanvraag',
    sjabloonId: 'vraag',
    doelgroepId: 'senioren',
    maanden: [11, 12, 1, 2],
  },
  {
    id: 'hoelang-duurt',
    pilaar: 'uitleg',
    hoek: 'vraag-antwoord',
    titel: '"Hoelang loopt er iemand door mijn huis?"',
    beeld: 'Tijdlijn van een montagedag, van 7 uur tot 16 uur.',
    doel: 'vertrouwen',
    sjabloonId: 'vraag',
    doelgroepId: 'senioren',
    maanden: [],
  },
  {
    id: 'geluid-uitleg',
    pilaar: 'uitleg',
    hoek: 'probleem-oplossing',
    titel: 'Wonen aan een drukke weg? Dit scheelt echt',
    beeld: 'Beeld van de weg vanaf het raam, daarna binnen met het raam dicht.',
    doel: 'offerteaanvraag',
    sjabloonId: 'probleem',
    doelgroepId: 'drukke-weg',
    maanden: [],
  },

  /* ----------------------------------------------------------- mensen */
  {
    id: 'ochtend-bus',
    pilaar: 'mensen',
    hoek: 'achter-de-schermen',
    titel: 'Half zeven: bus inladen',
    beeld: 'Ruw telefoonbeeld, geen regie. Juist dat werkt.',
    doel: 'volgers',
    sjabloonId: 'statement',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'monteur-voorstellen',
    pilaar: 'mensen',
    hoek: 'achter-de-schermen',
    titel: 'Stel een monteur voor',
    beeld: 'Portret op locatie, met naam en hoelang hij of zij er werkt.',
    doel: 'vertrouwen',
    sjabloonId: 'review',
    doelgroepId: 'breed',
    maanden: [],
  },
  {
    id: 'inmeetafspraak',
    pilaar: 'mensen',
    hoek: 'achter-de-schermen',
    titel: 'Zo gaat een inmeetafspraak er echt aan toe',
    beeld: 'Aan de keukentafel, meetlint, laptop. Geen verkooppraat.',
    doel: 'offerteaanvraag',
    sjabloonId: 'lijst-tips',
    doelgroepId: 'senioren',
    maanden: [],
  },
  {
    id: 'opruimen',
    pilaar: 'mensen',
    hoek: 'achter-de-schermen',
    titel: 'Het laatste half uur: opruimen en stofzuigen',
    beeld: 'Monteur die de vloer schoonmaakt en het oude materiaal afvoert.',
    doel: 'vertrouwen',
    sjabloonId: 'statement',
    doelgroepId: 'senioren',
    maanden: [],
  },
  {
    id: 'seizoen-haak',
    pilaar: 'aanbod',
    hoek: 'seizoen',
    titel: 'Seizoenspost die aanhaakt op de maand',
    beeld: 'Beeld dat het seizoen laat zien: regen op het raam, zon door de pui.',
    doel: 'offerteaanvraag',
    sjabloonId: 'aanbod',
    doelgroepId: 'breed',
    maanden: [],
  },
];

/** Ideeën die in een bepaalde maand extra goed werken, plus de tijdloze. */
export function ideeenVoorMaand(maand: number, pilaar?: string): IdeeSjabloon[] {
  return IDEEENBANK.filter(
    (i) => (!pilaar || i.pilaar === pilaar) && (i.maanden.length === 0 || i.maanden.includes(maand)),
  );
}
