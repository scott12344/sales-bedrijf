# Kozijn Marketing Studio

Marketingplatform voor een kozijnenverkoopbedrijf. Je geeft één idee in en het
systeem werkt het uit tot post-klare content: in de juiste maten per kanaal, in
je eigen huisstijl, met de koopredenen die in deze branche werken — plus een
contentkalender die ervoor zorgt dat er continu iets draait.

De hele app draait in de browser. Er is geen server nodig en er gaat geen enkel
gegeven naar buiten: campagnes en foto's staan in de opslag van je eigen
apparaat (IndexedDB).

## Snel starten

```bash
npm install
npm run dev      # ontwikkelen, op http://localhost:5173
npm run build    # bouwt dist/index.html — één bestand met de complete app
```

Na `npm run build` staat er in `dist/` precies één bestand: `index.html`. Dat
mag je op een USB-stick zetten, mailen of dubbelklikken. Het werkt zonder
internet en zonder installatie.

## Wat het systeem doet

**Studio** — Typ je idee ("vóór en ná van de woning aan de Dorpsstraat"), kies
invalshoek, doel en doelgroep. Je krijgt terug:

- Beeld in alle gekozen formaten: feed 1:1 en 4:5, story/reel 9:16, TikTok,
  Meta-advertentie, A5-flyer op 300 dpi en een bouwbord. Elk formaat houdt
  rekening met de veilige marges van dat kanaal, zodat er niets wegvalt achter
  de knoppen van het platform.
- Captions per kanaal, elk in de schrijfstijl die daar werkt, met een
  tekenteller tegen de praktische limiet.
- Hashtags met de plaatsnamen uit je werkgebied vooraan — die leveren in deze
  branche de meeste echte aanvragen op.
- 4 advertentievarianten met verschillende koopredenen, klaar voor Meta Ads.
- Een video-/reelscript met storyboard per seconde en de hook in de eerste twee
  seconden.
- Offline teksten: flyer, bouwbord, e-mail en WhatsApp.
- Eén knop die alles als ZIP downloadt.

**Kalender** — Genereert in één klik een planning van 2 tot 12 weken. De verdeling
over de contentpilaren (bewijs, aanbod, uitleg, mensen) is instelbaar en wordt
automatisch bewaakt: een tijdlijn die alleen uit aanbiedingen bestaat brandt op.
Ideeën komen uit een ideeënbank met seizoensgebonden invalshoeken.

**Merk & aanbod** — Kleurenpalet, lettertypen, logo, werkgebied, bewijscijfers en
je lopende acties. Alles wat je hier invult komt automatisch in elke post terecht.

**Beeldbank** — Foto's vóór/ná, sfeer, team en reviews. Ze worden bij het
toevoegen verkleind naar maximaal 2000 pixels.

**Koppelingen** — Publicatieroutes naar Instagram, Facebook en TikTok, plus
back-up en een zelfstandige kopie van de app inclusief je gegevens.

## Over publiceren naar Instagram, Facebook en TikTok

Deze platforms staan **niet** toe dat een webpagina rechtstreeks namens jou post.
Publiceren vereist altijd een server met een toegangstoken, en een app die door
Meta respectievelijk TikTok is goedgekeurd. Daarom zijn er drie routes:

1. **Webhook** — werkt meteen. Vul de URL in van Make, Zapier, n8n of je eigen
   server; die ontvangt beeld en tekst en plaatst de post. Geen app-review nodig.
2. **Eigen publicatieserver** — je draait zelf een server die met de Meta Graph
   API (`instagram_content_publish`, `pages_manage_posts`) en de TikTok Content
   Posting API (`video.publish`) praat. De app stuurt de post naar jouw server;
   het token blijft daar en komt nooit in de browser. Vereist bedrijfsaccounts en
   een goedgekeurde app — reken op dagen tot weken doorlooptijd.
3. **Handmatig** — download het beeld, kopieer de tekst, plaats hem zelf. Werkt
   altijd.

De adapters staan in `src/publish/adapters.ts`; het contract dat jouw server moet
implementeren is `POST /publiceer/meta` en `POST /publiceer/tiktok` met
`{ kanaal, caption, beeld, gepland }`.

## Kortingsclaims

Bij claims als "50% korting" geldt in Nederland dat de doorgestreepte prijs de
laagste prijs van de afgelopen 30 dagen moet zijn (Prijzenbesluit / Omnibus,
gehandhaafd door de ACM). Het systeem controleert daarom automatisch op:

- kortingspercentages waarvan de referentieprijs niet is getoetst;
- percentages zonder vermelding waarop ze slaan;
- acties zonder of met een verlopen einddatum;
- "gratis" zonder voorwaarden en schaarsteclaims zonder onderbouwing;
- superlatieven ("goedkoopste", "nummer 1") die je moet kunnen bewijzen.

Dat is geen juridisch advies, maar het vangt de fouten af die in deze branche
het vaakst tot klachten leiden. Leg je onderbouwing vast bij de actie zelf.

## Opbouw van de code

```
src/
  data/        catalogus: kanalen en formaten, koopredenen, doelgroepen,
               contentpilaren, ideeënbank, hashtags, paletten
  engine/      tekstmotor (idee → campagne), advertenties, video, kalender,
               en de controle op claims en kanaallimieten
  render/      tekengereedschap en de elf beeldsjablonen (canvas 2D)
  components/  schermen: dashboard, studio, kalender, beeldbank, merk,
               koppelingen
  store/       opslag in IndexedDB en de toestand van de app
  publish/     publicatie-adapters
  export/      PNG, ZIP (zonder externe bibliotheek) en zelfstandige HTML-kopie
```

De sjablonen bouwen hun opmaak van onder naar boven op: eerst wordt gemeten
hoeveel ruimte de merkbalk, de knop en de kop nodig hebben, en wat overblijft is
voor het beeld. Daardoor kan tekst nooit over de knop of de contactgegevens
vallen, hoe lang de ingevoerde tekst ook is.

## Visuele controle

`shot.mjs` doorloopt de gebouwde app met Playwright, vult een voorbeeldprofiel,
maakt testfoto's aan en legt elk sjabloon in elk formaat vast. Handig na een
wijziging aan de sjablonen:

```bash
npm run build
SHOT_DIR=/tmp/shots node shot.mjs
```
