# In jouw buurt: postcode filter (concept V0.1)

Prototype voor de "Zelf Zorgen, Samen Doen" campagne: bewoners van een stad
of dorp vullen hun postcode in en zien waar zij in de buurt kunnen
bijdragen aan initiatieven voor ouderen (gezelschap, spelletjes,
koffie-inloop, bingo), bijvoorbeeld als vrijwilliger of maatje. Zonder
postcode worden alle initiatieven getoond, en met de type-filter kun je
verder inperken naar wat bij je past.

> Dit is een functioneel concept/eerste versie, geen klantklare productie.
> Vormgeving en copy moeten nog langs de creatief eindverantwoordelijke en
> eindredactie voordat dit richting een klant gaat.

## Stack

- **React + TypeScript + Vite**, frontend
- **Supabase (Postgres)**, dataopslag van initiatieven, met een SQL-functie
  voor straal-zoekopdrachten (haversine, geen PostGIS-extensie nodig)
- **PDOK Locatieserver**, gratis, keyless geocoding van Nederlandse
  postcodes naar coördinaten
- **Claude (Anthropic API) met web search**, los scraperscript dat echte
  initiatieven opzoekt en in Supabase zet

## Hoe de zoekfilter werkt

- Geen postcode ingevuld → alle initiatieven uit Supabase worden getoond.
- Postcode ingevuld → wordt via PDOK omgezet naar coördinaten, waarna
  `nearby_initiatives(lat, lng, radius_km)` in Supabase alle initiatieven
  binnen de straal teruggeeft, dichtstbijzijnde eerst.
- Standaard straal is **5 km**, met een slider om te verruimen tot **20 km**.
  De slider vraagt live opnieuw op zonder de postcode opnieuw te geocoderen.
- Filter op type activiteit (gezelschap, spelletjes, koffie, bingo, anders)
  via de chips boven de resultaten. Meerdere types tegelijk aan te vinken,
  filtert client-side op de al opgehaalde resultaten.

## Setup

1. **Supabase-project aanmaken** op [supabase.com](https://supabase.com)
   (gratis tier is voldoende voor dit prototype).
2. Draai de migratie in de Supabase SQL-editor (of via de Supabase CLI):
   - `supabase/migrations/0001_init.sql`, tabel `initiatives` + de
     `nearby_initiatives`-functie.
   - Optioneel voor een snelle demo zonder scraper te draaien:
     `supabase/seed/seed_demo.sql` (vijf fictieve voorbeeldinitiatieven rond
     Enschede, vervang door echte data voor een klantpresentatie).
3. Kopieer `.env.example` naar `.env` en vul in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, uit je Supabase-project
     (Settings → API).
   - `SUPABASE_SERVICE_ROLE_KEY`, alleen nodig voor het scraperscript,
     **nooit** in de frontend gebruiken.
   - `ANTHROPIC_API_KEY`, alleen nodig voor het scraperscript.
4. Draai de app, kies één van de twee:

   **Optie A, met Docker (aanbevolen als je niets op je laptop wil installeren):**
   ```bash
   docker compose up --build
   ```
   Open daarna [http://localhost:5173](http://localhost:5173). Stoppen met
   `Ctrl+C`, opruimen met `docker compose down`.

   **Optie B, direct met Node/npm op je systeem:**
   ```bash
   npm install
   npm run dev
   ```

## Initiatieven verzamelen (scraper)

`scripts/scrape-initiatives.mjs` gebruikt de Claude API met de web search
tool om per opgegeven plaats te zoeken naar initiatieven waar bewoners zich
als vrijwilliger/maatje kunnen inzetten voor ouderen, en zet de resultaten
(na geocoding via PDOK) in de Supabase-tabel. Het draait bewust los van de
app, nooit vanuit de browser, omdat het de service-role key en een
Anthropic API-key gebruikt.

Standaard doorzoekt het script Twente, van de grotere steden tot kleinere
kernen (Enschede, Almelo, Hengelo, Oldenzaal, Rijssen, Wierden, Borne, Goor,
Haaksbergen, Ootmarsum, Denekamp, Tubbergen, Vriezenveen, Weerselo, Losser,
Delden). Geef eigen plaatsen mee als je een ander gebied wil:

Met Docker:
```bash
docker compose run --rm scraper "Amsterdam" "Utrecht"
# of zonder argumenten voor de standaardlijst (Twente)
docker compose run --rm scraper
```

Zonder Docker:
```bash
npm run scrape -- "Amsterdam" "Utrecht"
npm run scrape
```

**Backup en herstel:** vóór elke Supabase-upload schrijft het script de
gevonden (en gegeocodeerde) initiatieven altijd eerst naar een lokaal
JSON-bestand in `scripts/output/` (niet in git, staat in `.gitignore`).
Gaat de upload daarna om wat voor reden dan ook mis, dan ben je het
gevonden werk en de daaraan bestede AI-credits niet kwijt: upload dezelfde
data opnieuw zonder opnieuw te zoeken met:
```bash
node scripts/scrape-initiatives.mjs --from-backup scripts/output/<bestand>.json
```
Dit gebruikt alleen de Supabase-keys, geen Anthropic API-key nodig.
Uploaden gebeurt rij voor rij (niet als één batch), zodat één conflicterend
of foutief resultaat niet de rest blokkeert.

**Bronbetrouwbaarheid:** de AI slaat een initiatief alleen op als de bron
recent is (≤ 6 maanden) of van een herkenbare zorg-/welzijnsinstantie komt
(zorgorganisatie, gemeente, welzijnsstichting, ouderenbond,
vrijwilligerscentrale e.d.). Dit is een instructie in de system prompt
(`SYSTEM_PROMPT` in het script), geen apart databaseveld of UI-badge, dus
controleer bij twijfel altijd zelf de bron-URL in de kaart.

De AI verzint geen initiatieven: elk resultaat moet een bron-URL hebben. Dit
is een prototype-aanpak, controleer voor klantgebruik altijd de gevonden
data en de auteursrechten/licenties van eventueel overgenomen tekst of
beeld, en toets aan het huidige gebruiksvoorwaardenbeleid van de bronnen
voordat dit live gaat.

## Afbeeldingen bij de kaarten

`src/lib/categoryImages.ts` bevat per categorie een paar handmatig
gecureerde, thematisch passende Unsplash-foto's. De `url`-velden staan nu
bewust leeg: onze eigen fetch-tools worden door Unsplash's botbescherming
geblokkeerd, dus we konden de directe CDN-links niet vanuit deze omgeving
verifiëren. Zolang `url` leeg is, valt een kaart automatisch terug op de
emoji/kleurvlak-placeholder.

Zo vul je de echte foto's in (kost een paar minuten, jouw browser heeft
deze blokkade niet):
1. Open de `sourceUrl` van een foto uit `categoryImages.ts`.
2. Controleer de licentie op die pagina: moet **"Unsplash License"** zijn,
   niet het betaalde **"Unsplash+"** (Getty Images).
3. Rechtsklik op de foto → **"Afbeeldingsadres kopiëren"**.
4. Plak die link in het bijbehorende `url`-veld.

Voeg gerust extra foto's per categorie toe, `pickCategoryImage()` kiest
deterministisch (op basis van het initiatief-id) uit de hele pool, zodat
elk initiatief steeds dezelfde foto toont.

## Scripts

| Commando        | Werking                                      |
| ---------------- | --------------------------------------------- |
| `npm run dev`     | Start de ontwikkelserver                      |
| `npm run build`   | Typecheck + productiebuild                    |
| `npm run preview` | Preview van de productiebuild                 |
| `npm run scrape`  | Vult Supabase met initiatieven via Claude      |

## Volgende stappen

- Vervang de placeholder-copy in de zoekpaneel-tekst door eindredactie.
- Vul de echte Unsplash-links in `src/lib/categoryImages.ts` in (zie
  "Afbeeldingen bij de kaarten" hierboven).
- Overweeg een cron/Edge Function om het scraperscript periodiek te draaien
  in plaats van handmatig.
