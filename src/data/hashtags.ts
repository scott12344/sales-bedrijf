/**
 * Hashtagsets. De strategie: enkele grote bereikwoorden, een kern van
 * vaktermen, en lokale tags. Die laatste leveren in deze branche de meeste
 * échte aanvragen op — je wilt geen bereik in Groningen als je in Brabant werkt.
 */

export const HASHTAG_KERN = [
  'kozijnen',
  'kunststofkozijnen',
  'kozijnenvervangen',
  'nieuwekozijnen',
  'raamrenovatie',
  'schuifpui',
  'voordeur',
  'verduurzamen',
  'woningverbetering',
  'isolatie',
];

export const HASHTAG_PER_HOEK: Record<string, string[]> = {
  'voor-na': ['voorenna', 'transformatie', 'metamorfose', 'renovatie', 'verbouwing'],
  aanbod: ['actie', 'aanbieding', 'korting', 'offerte', 'gratisinmeten'],
  'probleem-oplossing': ['tocht', 'energierekening', 'condens', 'geluidsisolatie', 'stookkosten'],
  bewijs: ['tevredenklant', 'vakmanschap', 'kwaliteit', 'review', 'aanbevolen'],
  educatie: ['bouwtips', 'wistjedat', 'uitleg', 'hrglas', 'tripleglas', 'energielabel'],
  'achter-de-schermen': ['achterdeschermen', 'aanhetwerk', 'bouwlife', 'vakmensen', 'team'],
  urgentie: ['laatstekans', 'opisop', 'planning', 'nogenkeleplekken'],
  vergelijking: ['vergelijken', 'kunststofofhout', 'welkglas', 'keuzehulp'],
  seizoen: ['winterklaar', 'voorjaar', 'najaar', 'energiebesparen'],
  'vraag-antwoord': ['veelgesteldevragen', 'vraagenantwoord', 'adviesnodig'],
};

export const HASHTAG_BEREIK = ['woonideeen', 'interieurinspiratie', 'huisvandaag', 'wonen', 'thuis', 'klusinspiratie'];

/**
 * Bouwt een hashtagset op maat: lokale tags eerst (hoogste kans op een aanvraag),
 * dan vakspecifiek, dan enkele bereikwoorden.
 */
export function bouwHashtags(opts: {
  hoek: string;
  werkgebied: string[];
  bedrijfsnaam: string;
  aantal: number;
}): string[] {
  const schoon = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const lokaal = opts.werkgebied
    .slice(0, 4)
    .flatMap((plaats) => [schoon(plaats), `kozijnen${schoon(plaats)}`])
    .filter(Boolean);

  const merk = schoon(opts.bedrijfsnaam);
  const hoek = HASHTAG_PER_HOEK[opts.hoek] ?? [];

  const alles = [...lokaal, ...HASHTAG_KERN.slice(0, 5), ...hoek, ...HASHTAG_BEREIK, merk].filter(Boolean);

  const uniek: string[] = [];
  for (const tag of alles) {
    if (!uniek.includes(tag)) uniek.push(tag);
    if (uniek.length >= opts.aantal) break;
  }
  return uniek.map((t) => `#${t}`);
}
