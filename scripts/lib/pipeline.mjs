// Gedeelde scraper-pipeline: ontdekken (Haiku) -> onafhankelijk verifiëren
// (Sonnet) -> technische link-check -> categorie-controle -> geocoding ->
// upload. Wordt door beide entry-scripts gebruikt (scrape-initiatives.mjs,
// CLI met eigen ANTHROPIC_API_KEY, en run-with-agent.mjs, Agent-context met
// meegegeven client) zodat een aanscherping hier niet in één van de twee kan
// achterblijven.

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = join(LIB_DIR, '..', 'output');

// Twee afzonderlijke modellen, bewust: Haiku is goedkoop genoeg om breed en
// diep te zoeken, Sonnet is de kritische tweede lezer die dat werk zelf,
// onafhankelijk, controleert. Override per env var mogelijk voor test/debug.
export const DISCOVERY_MODEL = process.env.ANTHROPIC_DISCOVERY_MODEL || 'claude-haiku-4-5-20251001';
export const VERIFICATION_MODEL = process.env.ANTHROPIC_VERIFY_MODEL || 'claude-sonnet-5';

// Technische stopgrenzen tegen een eindeloze of onbetaalbaar dure tool-loop.
// Dit is GEEN inhoudelijke limiet op het aantal initiatieven per locatie
// (die is bewust geschrapt), alleen een veiligheidsnet tegen een model dat
// blijft doorzoeken/-praten zonder ooit te stoppen.
const DISCOVERY_MAX_ROUNDS = 25;
const VERIFY_MAX_ROUNDS = 4;

const SEARCH_RADIUS_HINT_KM = 15;
const LINK_CHECK_TIMEOUT_MS = 8000;

export const VALID_CATEGORIES = ['gezelschap', 'spelletjes', 'koffie', 'bingo', 'anders'];

const RECORD_TOOL = {
  name: 'record_initiative',
  description:
    'Slaat één gevonden, echt bestaand ouderenzorg-initiatief op. Roep dit precies ' +
    'één keer aan per uniek initiatief dat je met web search hebt gevonden en kunt ' +
    'onderbouwen met een bron-URL. Verzin nooit initiatieven of gegevens.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Naam van het initiatief of de activiteit.' },
      description: {
        type: 'string',
        description: 'Korte, feitelijke beschrijving (max 2 zinnen) in het Nederlands.',
      },
      category: {
        type: 'string',
        enum: VALID_CATEGORIES,
        description:
          'gezelschap = huisbezoek/maatje, spelletjes = spelletjesmiddag, koffie = ' +
          'koffie-uurtje/inloop, bingo = bingoavond/-middag, anders = iets anders passend.',
      },
      address: { type: 'string', description: 'Straat + huisnummer, indien bekend.' },
      postcode: { type: 'string', description: 'Nederlandse postcode, bijv. 7631AA, indien bekend.' },
      city: { type: 'string', description: 'Plaatsnaam.' },
      source_url: {
        type: 'string',
        description: 'De URL waar dit initiatief daadwerkelijk vermeld staat.',
      },
    },
    required: ['name', 'description', 'category', 'city', 'source_url'],
  },
};

const DISCOVERY_SYSTEM_PROMPT = `Je bent een zorgvuldige onderzoeksassistent voor de Nederlandse zorgsector.

Doelgroep: bewoners van een stad of dorp die willen BIJDRAGEN aan het bestrijden
van eenzaamheid bij ouderen, bijvoorbeeld als vrijwilliger, maatje of incidentele
helper. Zoek daarom niet alleen naar activiteiten die al draaien, maar specifiek
naar initiatieven waar nieuwe vrijwilligers, maatjes of helpers welkom zijn of
gezocht worden: gezelschap/maatjesprojecten, spelletjesmiddagen, koffie-inloop,
bingoavonden en vergelijkbare sociale activiteiten voor senioren.

Wees zo volledig mogelijk. Er is GEEN maximumaantal: roep record_initiative aan
voor elk uniek initiatief dat je vindt en dat aan de bronregels voldoet, ook als
dat er voor een gebied tien, twintig of meer zijn. Doorzoek dus ook aanverwante
paden (verschillende organisaties, wijkgerichte varianten, kernen rond de
hoofdplaats) in plaats van te stoppen na de eerste paar treffers.

Bronregels (belangrijk, ter controle van actualiteit en betrouwbaarheid):
- Gebruik een bron alleen als deze aan minstens één van deze twee eisen voldoet:
  1) De bron (pagina, artikel, agenda-item) is van de afgelopen 6 maanden, OF
  2) De bron komt van een herkenbare zorg- of welzijnsinstantie (bijv. een
     zorgorganisatie, gemeente, welzijnsstichting, ouderenbond, vrijwilligers-
     centrale, kerkelijke of maatschappelijke organisatie met ouderenzorgtaak).
- Voldoet een bron aan geen van beide, sla dat initiatief dan niet op, ook niet
  als het er inhoudelijk passend uitziet.
- Twijfel je over de actualiteit of legitimiteit van een bron, sla het initiatief
  dan niet op.

Overige regels:
- Gebruik uitsluitend informatie die je met web search hebt gevonden. Verzin nooit
  initiatieven, adressen of details.
- Roep de tool "record_initiative" precies één keer aan per uniek, gevonden initiatief.
- Sla alleen initiatieven op waar je een bron-URL van hebt die aan de bronregels voldoet.
- Elk initiatief dat je opslaat wordt hierna nog apart, onafhankelijk geverifieerd,
  dus wees zelf al kritisch: gok niet en vul geen adresdetails aan die de bron niet
  noemt.
- Antwoord verder niet in lopende tekst; gebruik alleen de tool.`;

const VERIFY_TOOL = {
  name: 'submit_verdict',
  description: 'Geef het eindoordeel over of dit initiatief legitiem, actueel en correct toegeschreven is.',
  input_schema: {
    type: 'object',
    properties: {
      verdict: {
        type: 'string',
        enum: ['CONFIRMED', 'REJECTED'],
        description: 'CONFIRMED alleen als je zelf, onafhankelijk, bevestiging vond op alle controlepunten.',
      },
      reason: {
        type: 'string',
        description: 'Korte, concrete onderbouwing (1-2 zinnen): wat heb je gecontroleerd en gevonden?',
      },
    },
    required: ['verdict', 'reason'],
  },
};

const VERIFY_SYSTEM_PROMPT = `Je bent een kritische, onafhankelijke controleur voor een database met
ouderenzorg-initiatieven. Een ANDER onderzoeksproces heeft het initiatief hieronder al eerder
gevonden en aangeleverd. Vertrouw dat werk niet zomaar: ga zelf, met een eigen web search,
na of het klopt, los van wat er al beweerd wordt.

Controleer specifiek, en gebruik web search om dit daadwerkelijk te checken:
1. Bestaat de genoemde organisatie of het initiatief echt? (Niet alleen "klinkt plausibel".)
2. Is de opgegeven bron-URL een pagina VAN diezelfde organisatie of over datzelfde initiatief
   (past het domein en de inhoud bij de naam), en geen losse, niet te herleiden, of duidelijk
   niet-gerelateerde website?
3. Is het initiatief daadwerkelijk actief in de opgegeven plaats/gemeente, niet ergens anders
   in Nederland?
4. Klopt de beschrijving met wat de bron werkelijk zegt, zonder overdrijving of verzinsel?

Bij twijfel op ook maar ÉÉN van deze vier punten: verdict REJECTED, met een korte reden.
Alleen als je zelf via search bevestiging vindt op alle vier: verdict CONFIRMED.
Antwoord uitsluitend via de tool "submit_verdict".`;

/** Eén generieke tool-loop, gebruikt voor zowel het ontdekken (record_initiative)
 * als het verifiëren (submit_verdict). web_search is een server-side tool: de
 * API voert die zelf uit en levert het resultaat in dezelfde response terug,
 * dus alleen voor onze eigen tools moeten we tool_result-blokken teruggeven. */
async function runToolLoop({ client, model, system, tools, toolName, userContent, maxRounds, stopAfterFirstMatch = false }) {
  const messages = [{ role: 'user', content: userContent }];
  const matches = [];

  for (let round = 0; round < maxRounds; round += 1) {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      tools,
      messages,
    });

    const matchingCalls = response.content.filter(
      (block) => block.type === 'tool_use' && block.name === toolName
    );
    matches.push(...matchingCalls.map((call) => call.input));

    if (stopAfterFirstMatch && matchingCalls.length > 0) break;

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') break;

    const allToolUses = response.content.filter((block) => block.type === 'tool_use');
    if (allToolUses.length === 0) break;

    messages.push({
      role: 'user',
      content: allToolUses.map((call) => ({
        type: 'tool_result',
        tool_use_id: call.id,
        content: 'Ontvangen.',
      })),
    });
  }

  return matches;
}

export async function discoverForLocation(client, location) {
  const userContent =
    `Zoek zo volledig mogelijk naar echte, bestaande initiatieven waar bewoners van ` +
    `${location} (Nederland) en omgeving (binnen ongeveer ${SEARCH_RADIUS_HINT_KM} km) ` +
    `zich als vrijwilliger, maatje of helper kunnen inzetten voor ouderen ` +
    `(gezelschap, spelletjesmiddag, koffie-inloop, bingo, of vergelijkbaar). ` +
    `Er is geen maximumaantal, breng dit gebied zo compleet mogelijk in kaart. ` +
    `Houd je aan de bronregels uit de systeeminstructie. ` +
    `Sla elk gevonden initiatief op met de record_initiative tool.`;

  return runToolLoop({
    client,
    model: DISCOVERY_MODEL,
    system: DISCOVERY_SYSTEM_PROMPT,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }, RECORD_TOOL],
    toolName: 'record_initiative',
    userContent,
    maxRounds: DISCOVERY_MAX_ROUNDS,
  });
}

/** Onafhankelijke verificatie: een verse, eigen tool-loop zonder de
 * conversatie/context van de ontdekkingsstap, met een apart (sterker) model.
 * Faalt de API-aanroep zelf (netwerk, rate limit, etc.), dan is het oordeel
 * REJECTED: bij twijfel of een controlefout hoort een initiatief niet in de
 * database, niet als "voordeel van de twijfel". */
export async function verifyCandidate(client, candidate) {
  const userContent =
    `Controleer dit initiatief onafhankelijk:\n\n` +
    `Naam: ${candidate.name}\n` +
    `Beschrijving: ${candidate.description}\n` +
    `Categorie: ${candidate.category}\n` +
    `Adres: ${candidate.address ?? '(onbekend)'}\n` +
    `Postcode: ${candidate.postcode ?? '(onbekend)'}\n` +
    `Plaats: ${candidate.city}\n` +
    `Bron-URL: ${candidate.source_url}\n\n` +
    `Geef je oordeel via de tool "submit_verdict".`;

  try {
    const [verdict] = await runToolLoop({
      client,
      model: VERIFICATION_MODEL,
      system: VERIFY_SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }, VERIFY_TOOL],
      toolName: 'submit_verdict',
      userContent,
      maxRounds: VERIFY_MAX_ROUNDS,
      stopAfterFirstMatch: true,
    });

    if (!verdict) {
      return { verdict: 'REJECTED', reason: 'Verificatiemodel gaf geen oordeel binnen de ronde-limiet.' };
    }
    return verdict;
  } catch (err) {
    return { verdict: 'REJECTED', reason: `Verificatie mislukt door een fout: ${err.message}` };
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Technische, deterministische controle los van de AI: bevestigt dat de
 * bron-URL daadwerkelijk bereikbaar is. Vangt dode links en verhuisde
 * pagina's af, ook als de AI-verificatie daar overheen keek. */
export async function checkLinkReachable(url) {
  if (!url) return { ok: false, reason: 'geen source_url' };

  let response;
  try {
    response = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow' }, LINK_CHECK_TIMEOUT_MS);
    if (response.status === 405 || response.status === 501) {
      response = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' }, LINK_CHECK_TIMEOUT_MS);
    }
  } catch (err) {
    return { ok: false, reason: `netwerkfout: ${err.message}` };
  }

  if (!response.ok) {
    return { ok: false, reason: `HTTP ${response.status}` };
  }
  return { ok: true, reason: `HTTP ${response.status}` };
}

export async function geocode(entry) {
  const query = entry.postcode ? entry.postcode.replace(/\s+/g, '') : `${entry.city}`;
  const url = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/free');
  url.searchParams.set('q', query);
  if (entry.postcode) url.searchParams.set('fq', 'type:postcode');
  url.searchParams.set('rows', '1');
  url.searchParams.set('fl', 'weergavenaam,centroide_ll');

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data?.response?.docs?.[0];
  if (!doc) return null;
  const match = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(doc.centroide_ll);
  if (!match) return null;
  const [, lon, lat] = match;
  return { latitude: Number(lat), longitude: Number(lon) };
}

/** Laatste rij per (name, city) wint. Voorkomt de Postgres-fout "ON CONFLICT
 * DO UPDATE command cannot affect row a second time", die optreedt als een
 * enkele upsert-aanroep dezelfde conflict-key twee keer in dezelfde batch
 * bevat. */
function dedupeByNameAndCity(rows) {
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(`${row.name}|${row.city ?? ''}`, row);
  }
  return [...byKey.values()];
}

export function writeBackup(payload) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `scrape-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

/** Upload rij voor rij (niet als één batch): zo blokkeert één conflicterende
 * of foutieve rij niet de rest. Strip eerst de audit-only velden
 * (_verification, _linkCheck): die bestaan niet als kolom in Supabase. */
export async function uploadRows(rows, supabase) {
  const dbRows = rows.map(({ _verification, _linkCheck, ...dbRow }) => dbRow);
  const deduped = dedupeByNameAndCity(dbRows);
  if (deduped.length !== dbRows.length) {
    console.log(`  ${dbRows.length - deduped.length} dubbele (naam + plaats) verwijderd vóór upload.`);
  }

  let saved = 0;
  let failed = 0;
  for (const row of deduped) {
    const { error } = await supabase.from('initiatives').upsert(row, { onConflict: 'name,city' });
    if (error) {
      failed += 1;
      console.error(`  Opslaan mislukt voor "${row.name}" (${row.city}): ${error.message}`);
    } else {
      saved += 1;
    }
  }
  return { saved, failed, total: deduped.length };
}

/** Volledige pipeline: ontdekken -> onafhankelijk verifiëren -> technische
 * link-check -> categorie-controle -> geocoding -> backup -> upload. */
export async function runPipeline(client, locations, supabase) {
  console.log(`Fase 1/3: ontdekken (model: ${DISCOVERY_MODEL}) in ${locations.join(', ')}`);

  const candidates = [];
  for (const location of locations) {
    console.log(`\n-> ${location}`);
    try {
      const found = await discoverForLocation(client, location);
      console.log(`   ${found.length} kandidaat/kandidaten gevonden.`);
      candidates.push(...found.map((c) => ({ ...c, _searchedLocation: location })));
    } catch (err) {
      console.error(`   Fout bij zoeken naar ${location}: ${err.message}`);
    }
  }

  if (candidates.length === 0) {
    console.log('\nGeen kandidaten gevonden, niets om te verifiëren.');
    return { saved: 0, failed: 0, excluded: 0, total: 0 };
  }

  console.log(
    `\nFase 2/3: onafhankelijk verifiëren van ${candidates.length} kandidaat/kandidaten ` +
      `(model: ${VERIFICATION_MODEL})...`
  );

  const verified = [];
  const excluded = [];
  for (const candidate of candidates) {
    const label = (candidate.name ?? '(naam ontbreekt)').slice(0, 60);
    process.stdout.write(`   -> ${label} `);
    const outcome = await verifyCandidate(client, candidate);
    if (outcome.verdict === 'CONFIRMED') {
      console.log('geverifieerd.');
      verified.push({ ...candidate, _verification: outcome });
    } else {
      console.log(`AFGEWEZEN: ${outcome.reason}`);
      excluded.push({ ...candidate, _verification: outcome, _excludedReason: `verificatie: ${outcome.reason}` });
    }
  }

  console.log(`\n${verified.length}/${candidates.length} kandidaten doorstonden de onafhankelijke verificatie.`);
  console.log(`\nFase 3/3: technische link-check, categorie-controle en geocoding...`);

  const rows = [];
  for (const entry of verified) {
    if (!VALID_CATEGORIES.includes(entry.category)) {
      console.warn(`   Ongeldige categorie "${entry.category}" voor "${entry.name}": NIET geüpload.`);
      excluded.push({ ...entry, _excludedReason: `ongeldige categorie: ${entry.category}` });
      continue;
    }

    const link = await checkLinkReachable(entry.source_url);
    if (!link.ok) {
      console.warn(`   Bron niet bereikbaar voor "${entry.name}" (${link.reason}): NIET geüpload.`);
      excluded.push({ ...entry, _excludedReason: `bron onbereikbaar: ${link.reason}` });
      continue;
    }

    const coords = await geocode(entry);
    if (!coords) {
      console.warn(`   Geen locatie gevonden voor "${entry.name}" (${entry.city}): NIET geüpload.`);
      excluded.push({ ...entry, _excludedReason: 'geocoding mislukt' });
      continue;
    }

    rows.push({
      name: entry.name,
      description: entry.description,
      category: entry.category,
      address: entry.address ?? null,
      postcode: entry.postcode ?? null,
      city: entry.city,
      source_url: entry.source_url ?? null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      _verification: entry._verification,
      _linkCheck: link,
    });
  }

  const backupPath = writeBackup({ uploaded: rows, excluded });
  console.log(`\nBackup weggeschreven naar ${backupPath} (inclusief afgewezen/uitgesloten kandidaten, ter controle).`);

  if (rows.length === 0) {
    console.log('Niets doorstond alle controles, niets om te uploaden.');
    return { saved: 0, failed: 0, excluded: excluded.length, total: 0 };
  }

  console.log(`\nUploaden naar Supabase...`);
  const { saved, failed, total } = await uploadRows(rows, supabase);
  console.log(
    `\nKlaar. ${saved}/${total} initiatieven opgeslagen/bijgewerkt. ` +
      `${excluded.length} kandidaten afgewezen/uitgesloten (zie backup voor redenen).`
  );
  if (failed > 0) {
    console.log(`${failed} rij(en) faalden bij upload, zie foutmeldingen. Herstel met --from-backup ${backupPath}`);
  }

  return { saved, failed, excluded: excluded.length, total };
}
