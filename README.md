# In jouw buurt — postcode filter (concept V0.1)

Prototype voor de "Zelf Zorgen, Samen Doen" campagne: bezoekers vullen hun
postcode in en zien welke ouderenzorg-initiatieven (gezelschap, spelletjes,
koffie-inloop, bingo) bij hen in de buurt te vinden zijn. Zonder postcode
worden alle initiatieven getoond.

> Dit is een functioneel concept/eerste versie, geen klantklare productie.
> Vormgeving en copy moeten nog langs de creatief eindverantwoordelijke en
> eindredactie voordat dit richting een klant gaat.

## Stack

- **React + TypeScript + Vite** — frontend
- **Supabase (Postgres)** — dataopslag van initiatieven, met een SQL-functie
  voor straal-zoekopdrachten (haversine, geen PostGIS-extensie nodig)
- **PDOK Locatieserver** — gratis, keyless geocoding van Nederlandse
  postcodes naar coördinaten
- **Claude (Anthropic API) met web search** — los scraperscript dat echte
  initiatieven opzoekt en in Supabase zet

## Hoe de zoekfilter werkt

- Geen postcode ingevuld → alle initiatieven uit Supabase worden getoond.
- Postcode ingevuld → wordt via PDOK omgezet naar coördinaten, waarna
  `nearby_initiatives(lat, lng, radius_km)` in Supabase alle initiatieven
  binnen de straal teruggeeft, dichtstbijzijnde eerst.
- Standaard straal is **5 km**, met een slider om te verruimen tot **20 km**.
  De slider vraagt live opnieuw op zonder de postcode opnieuw te geocoderen.

## Setup

1. **Supabase-project aanmaken** op [supabase.com](https://supabase.com)
   (gratis tier is voldoende voor dit prototype).
2. Draai de migratie in de Supabase SQL-editor (of via de Supabase CLI):
   - `supabase/migrations/0001_init.sql` — tabel `initiatives` + de
     `nearby_initiatives`-functie.
   - Optioneel voor een snelle demo zonder scraper te draaien:
     `supabase/seed/seed_demo.sql` (vijf fictieve voorbeeldinitiatieven rond
     Enschede — vervang door echte data voor een klantpresentatie).
3. Kopieer `.env.example` naar `.env` en vul in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — uit je Supabase-project
     (Settings → API).
   - `SUPABASE_SERVICE_ROLE_KEY` — alleen nodig voor het scraperscript,
     **nooit** in de frontend gebruiken.
   - `ANTHROPIC_API_KEY` — alleen nodig voor het scraperscript.
4. Installeer dependencies en start de dev-server:
   ```bash
   npm install
   npm run dev
   ```

## Initiatieven verzamelen (scraper)

`scripts/scrape-initiatives.mjs` gebruikt de Claude API met de web search
tool om per opgegeven plaats te zoeken naar echte, bestaande
oudereninitiatieven, en zet de resultaten (na geocoding via PDOK) in de
Supabase-tabel. Het draait bewust los van de app — nooit vanuit de browser,
omdat het de service-role key en een Anthropic API-key gebruikt.

```bash
npm run scrape -- "Ootmarsum" "Enschede" "Almelo"
# of zonder argumenten voor de standaardlijst (Twente-regio)
npm run scrape
```

De AI verzint geen initiatieven: elk resultaat moet een bron-URL hebben. Dit
is een prototype-aanpak — controleer voor klantgebruik altijd de gevonden
data en de auteursrechten/licenties van eventueel overgenomen tekst of
beeld, en toets aan het huidige gebruiksvoorwaardenbeleid van de bronnen
voordat dit live gaat.

## Scripts

| Commando        | Werking                                      |
| ---------------- | --------------------------------------------- |
| `npm run dev`     | Start de ontwikkelserver                      |
| `npm run build`   | Typecheck + productiebuild                    |
| `npm run preview` | Preview van de productiebuild                 |
| `npm run scrape`  | Vult Supabase met initiatieven via Claude      |

## Volgende stappen

- Vervang de placeholder-copy in de zoekpaneel-tekst door eindredactie.
- Vervang de emoji/kleurvlak-placeholders in de kaarten door echte
  fotografie (let op gebruiksrechten).
- Overweeg een cron/Edge Function om het scraperscript periodiek te draaien
  in plaats van handmatig.
