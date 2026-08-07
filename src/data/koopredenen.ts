/**
 * Bibliotheek met koopredenen: de argumenten die een huiseigenaar over de streep
 * trekken. Elke reden heeft een psychologisch principe, een moment waarop hij
 * werkt, en kant-en-klare formuleringen die de tekstmotor invult.
 *
 * {plaats}, {bedrijf}, {actie}, {garantie} en {jaren} worden vervangen door
 * gegevens uit het merkprofiel.
 */

export type Principe =
  | 'urgentie'
  | 'schaarste'
  | 'sociale-bewijskracht'
  | 'autoriteit'
  | 'risico-weg'
  | 'besparing'
  | 'gemak'
  | 'status'
  | 'verlies-vermijden'
  | 'wederkerigheid';

export interface Koopreden {
  id: string;
  principe: Principe;
  label: string;
  /** Korte variant voor op het beeld. */
  kort: string[];
  /** Langere variant voor de caption of advertentietekst. */
  lang: string[];
  /** Bij welke campagnehoeken deze reden past. */
  hoeken: string[];
  /** Hoe zwaar deze reden weegt bij het kiezen; hoger = vaker gekozen. */
  gewicht: number;
}

export const KOOPREDENEN: Koopreden[] = [
  {
    id: 'actie-korting',
    principe: 'urgentie',
    label: 'Lopende actie / korting',
    kort: ['{actie}', 'Nu {actie}', '{actie} — alleen deze maand'],
    lang: [
      'Zolang de actie loopt profiteer je van {actie}. Vraag vrijblijvend een prijs op en je weet binnen een week waar je aan toe bent.',
      'Deze maand geldt {actie}. Dat scheelt bij een gemiddelde woning al snel een paar duizend euro.',
    ],
    hoeken: ['aanbod', 'urgentie', 'seizoen'],
    gewicht: 10,
  },
  {
    id: 'energie-besparing',
    principe: 'besparing',
    label: 'Lagere energierekening',
    kort: ['Tot 30% minder stookkosten', 'Verdient zichzelf terug', 'Nooit meer stoken voor de straat'],
    lang: [
      'Oude kozijnen met enkel of verouderd dubbel glas laten je warmte zo naar buiten lopen. Met isolerend glas en goed afgedichte kozijnen zie je dat direct terug op je energierekening.',
      'Je stookt nu deels voor de buitenlucht. Nieuwe kozijnen houden die warmte binnen — elke winter opnieuw.',
    ],
    hoeken: ['educatie', 'probleem-oplossing', 'vergelijking', 'seizoen'],
    gewicht: 9,
  },
  {
    id: 'comfort-tocht',
    principe: 'verlies-vermijden',
    label: 'Einde aan tocht en kou',
    kort: ['Geen tocht meer', 'Warme woonkamer, ook in januari', 'Geen koude voeten bij het raam'],
    lang: [
      'Die koude luchtstroom langs de bank verdwijnt. Nieuwe kozijnen sluiten rondom af, waardoor je de hele kamer kunt gebruiken in plaats van alleen de warme hoek.',
      'Tocht is niet iets waar je aan went — het is iets wat je oplost. Eén dag werk en je zit er de rest van de winter warm bij.',
    ],
    hoeken: ['probleem-oplossing', 'seizoen', 'educatie'],
    gewicht: 8,
  },
  {
    id: 'geluid',
    principe: 'verlies-vermijden',
    label: 'Geluidsoverlast weg',
    kort: ['Stil in huis', 'Verkeerslawaai eruit', 'Rust, ook aan een drukke weg'],
    lang: [
      'Woon je aan een doorgaande weg of onder een aanvliegroute? Met geluidswerend glas wordt het merkbaar stiller. Klanten noemen dat vaak als grootste verrassing.',
    ],
    hoeken: ['probleem-oplossing', 'educatie', 'vergelijking'],
    gewicht: 6,
  },
  {
    id: 'woningwaarde',
    principe: 'status',
    label: 'Meer waard en beter energielabel',
    kort: ['Beter energielabel', 'Je huis wordt meer waard', 'Verkoopklaar'],
    lang: [
      'Nieuwe kozijnen tellen mee in je energielabel en dat zie je terug bij taxatie en verkoop. Je investeert in je huis, je gooit het niet weg aan stookkosten.',
    ],
    hoeken: ['educatie', 'aanbod', 'vergelijking'],
    gewicht: 7,
  },
  {
    id: 'onderhoud',
    principe: 'gemak',
    label: 'Nooit meer schilderen',
    kort: ['Nooit meer schilderen', 'Alleen nog schoonmaken', 'Onderhoudsvrij'],
    lang: [
      'Geen schilder meer om de vijf jaar, geen houtrot, geen schuurwerk. Een sopje en je kozijnen zien er weer uit als nieuw.',
      'Reken eens uit wat je de afgelopen twintig jaar aan schilderwerk kwijt was. Dat stopt hiermee.',
    ],
    hoeken: ['educatie', 'vergelijking', 'probleem-oplossing'],
    gewicht: 8,
  },
  {
    id: 'inbraak',
    principe: 'risico-weg',
    label: 'Veiligheid en inbraakwering',
    kort: ['Inbraakwerend beslag', 'Veilig thuis', 'SKG-goedgekeurd hang- en sluitwerk'],
    lang: [
      'Standaard voorzien van inbraakwerend hang- en sluitwerk. Bij veel verzekeraars levert dat ook nog korting op je premie op.',
    ],
    hoeken: ['educatie', 'bewijs', 'probleem-oplossing'],
    gewicht: 6,
  },
  {
    id: 'garantie',
    principe: 'risico-weg',
    label: 'Garantie',
    kort: ['{garantie} jaar garantie', 'Schriftelijke garantie', 'Garantie op product én montage'],
    lang: [
      'Je krijgt {garantie} jaar garantie, op het product én op de montage. Eén partij verantwoordelijk, geen doorverwijzen.',
    ],
    hoeken: ['bewijs', 'aanbod', 'vraag-antwoord'],
    gewicht: 8,
  },
  {
    id: 'eigen-monteurs',
    principe: 'autoriteit',
    label: 'Eigen vaste monteurs',
    kort: ['Eigen monteurs', 'Geen onderaannemers', 'Vast team'],
    lang: [
      'Wij werken met eigen, vaste monteurs. Je weet wie er komt, ze weten wat ze doen en ze ruimen op als ze klaar zijn.',
    ],
    hoeken: ['achter-de-schermen', 'bewijs', 'bewijs'],
    gewicht: 7,
  },
  {
    id: 'reviews',
    principe: 'sociale-bewijskracht',
    label: 'Beoordelingen van klanten',
    kort: ['{score} van klanten', '{aantal}+ beoordelingen', 'Aanbevolen door buurtgenoten'],
    lang: [
      'Gemiddeld een {score} uit {aantal} beoordelingen. Niet omdat we het zeggen, maar omdat klanten het opschrijven.',
    ],
    hoeken: ['bewijs', 'voor-na', 'aanbod'],
    gewicht: 9,
  },
  {
    id: 'lokaal',
    principe: 'sociale-bewijskracht',
    label: 'Lokaal en dichtbij',
    kort: ['Uit {plaats}', 'Deze week in {plaats}', 'Je buurtgenoten gingen je voor'],
    lang: [
      'We zijn deze week in {plaats} aan het werk. Wil je zien wat er bij jou mogelijk is? Dan komen we gewoon even langs.',
      'Lokaal bedrijf, korte lijnen. Geen callcenter maar iemand die weet waar je straat ligt.',
    ],
    hoeken: ['voor-na', 'achter-de-schermen', 'aanbod', 'urgentie'],
    gewicht: 8,
  },
  {
    id: 'gratis-advies',
    principe: 'wederkerigheid',
    label: 'Gratis inmeten en advies',
    kort: ['Gratis inmeten', 'Vrijblijvend advies aan huis', 'Geen voorrijkosten'],
    lang: [
      'We komen vrijblijvend langs, meten alles precies in en je krijgt een vaste prijs. Geen voorrijkosten, geen verplichtingen.',
    ],
    hoeken: ['aanbod', 'probleem-oplossing', 'vraag-antwoord'],
    gewicht: 9,
  },
  {
    id: 'vaste-prijs',
    principe: 'risico-weg',
    label: 'Vaste prijs, geen verrassingen',
    kort: ['Vaste prijs', 'Alles inclusief', 'Geen nacalculatie'],
    lang: [
      'Eén prijs, alles inbegrepen: kozijnen, glas, montage, afwerking en het afvoeren van je oude kozijnen. Wat we afspreken staat vast.',
    ],
    hoeken: ['aanbod', 'vergelijking', 'vraag-antwoord'],
    gewicht: 8,
  },
  {
    id: 'snel-geplaatst',
    principe: 'gemak',
    label: 'Snel geplaatst, weinig overlast',
    kort: ['In één dag geplaatst', 'Klaar voor het weekend', "'s Avonds weer dicht"],
    lang: [
      'Bij de meeste woningen staat alles binnen één dag. We beschermen je vloeren, ruimen op en je slaapt gewoon in je eigen huis.',
    ],
    hoeken: ['achter-de-schermen', 'vraag-antwoord', 'probleem-oplossing'],
    gewicht: 7,
  },
  {
    id: 'wachtlijst',
    principe: 'schaarste',
    label: 'Beperkte plekken in de planning',
    kort: ['Nog {aantal} plekken deze maand', 'Planning loopt vol', 'Laatste plekken voor de winter'],
    lang: [
      'Onze planning voor de komende weken loopt vol. Wil je het nog voor de winter geregeld hebben, meld je dan nu aan voor een inmeetafspraak.',
    ],
    hoeken: ['urgentie', 'seizoen', 'aanbod'],
    gewicht: 7,
  },
  {
    id: 'financiering',
    principe: 'gemak',
    label: 'Gespreid betalen',
    kort: ['Gespreid betalen mogelijk', 'Vanaf een vast bedrag per maand'],
    lang: [
      'Je hoeft het niet in één keer te betalen. Gespreid betalen kan, waarbij je maandlast vaak lager uitvalt dan wat je nu extra kwijt bent aan stoken.',
    ],
    hoeken: ['aanbod', 'vraag-antwoord'],
    gewicht: 5,
  },
  {
    id: 'subsidie',
    principe: 'besparing',
    label: 'Subsidiemogelijkheden',
    kort: ['Subsidie mogelijk', 'Check je subsidie'],
    lang: [
      'Voor isolerende maatregelen bestaan landelijke en gemeentelijke regelingen. Wij zoeken samen met je uit wat er in jouw situatie mogelijk is — voorwaarden en bedragen veranderen regelmatig, dus we kijken naar de actuele stand.',
    ],
    hoeken: ['educatie', 'aanbod', 'vraag-antwoord'],
    gewicht: 6,
  },
  {
    id: 'op-maat',
    principe: 'status',
    label: 'Op maat, in elke kleur',
    kort: ['In elke kleur leverbaar', 'Op maat gemaakt', 'Past bij jouw woning'],
    lang: [
      'Alles wordt op maat gemaakt, in de kleur die bij je woning past — van klassiek wit tot antracietgrijs of houtlook. Je ziet vooraf hoe het eruit komt te zien.',
    ],
    hoeken: ['voor-na', 'educatie', 'aanbod'],
    gewicht: 7,
  },
  {
    id: 'condens',
    principe: 'verlies-vermijden',
    label: 'Geen condens en schimmel meer',
    kort: ['Geen condens meer', 'Droge ramen, gezonde lucht'],
    lang: [
      'Beslagen ramen en zwarte randen langs het kozijn zijn een teken dat je glas en afdichting het niet meer redden. Met nieuwe kozijnen en goede ventilatie is dat verleden tijd.',
    ],
    hoeken: ['probleem-oplossing', 'educatie', 'seizoen'],
    gewicht: 6,
  },
  {
    id: 'ervaring',
    principe: 'autoriteit',
    label: 'Jarenlange ervaring',
    kort: ['Al {jaren} jaar', '{jaren} jaar ervaring', 'Sinds {jaarOpgericht}'],
    lang: [
      'We doen dit al {jaren} jaar. Dat betekent dat we elke rare aansluiting, elke scheve muur en elk oud stelkozijn al eens zijn tegengekomen.',
    ],
    hoeken: ['bewijs', 'achter-de-schermen', 'bewijs'],
    gewicht: 7,
  },
];

export const koopredenById = (id: string) => KOOPREDENEN.find((k) => k.id === id);

/** Koopredenen die passen bij een campagnehoek, gesorteerd op gewicht. */
export function koopredenenVoorHoek(hoek: string): Koopreden[] {
  const passend = KOOPREDENEN.filter((k) => k.hoeken.includes(hoek));
  const rest = KOOPREDENEN.filter((k) => !k.hoeken.includes(hoek));
  return [...passend.sort((a, b) => b.gewicht - a.gewicht), ...rest.sort((a, b) => b.gewicht - a.gewicht)];
}
