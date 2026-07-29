#!/usr/bin/env node
// Vindt echte, bestaande ouderenzorg-initiatieven (gezelschap, spelletjes,
// koffie, bingo, etc.) rond opgegeven plaatsen via Claude's web search tool,
// geocodet ze via PDOK, en zet ze in de Supabase-tabel `initiatives`.
//
// Kan op twee manieren draaien:
// 1. Direct via CLI (vereist ANTHROPIC_API_KEY in .env):
//    node scripts/scrape-initiatives.mjs "Ootmarsum" "Enschede"
// 2. Via Agent (geen API-key nodig, Agent heeft eigen access):
//    import { scrapeInitiatives } from './scrape-initiatives.mjs'
//
// Voordat er iets naar Supabase gaat, wordt de verzamelde data altijd eerst
// lokaal opgeslagen in scripts/output/. Gaat de Supabase-upload om wat voor
// reden dan ook mis, dan zijn de resultaten niet weg: herstel met:
//   node scripts/scrape-initiatives.mjs --from-backup scripts/output/<bestand>.json

import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(SCRIPT_DIR, 'output');

// Twente, van grotere steden tot kleinere kernen, zodat ook plattelands-
// initiatieven meegenomen worden. Vul aan met eigen plaatsen via CLI-argumenten.
const DEFAULT_LOCATIONS = [
  'Enschede',
  'Almelo',
  'Hengelo',
  'Oldenzaal',
  'Rijssen',
  'Wierden',
  'Borne',
  'Goor',
  'Haaksbergen',
  'Ootmarsum',
  'Denekamp',
  'Tubbergen',
  'Vriezenveen',
  'Weerselo',
  'Losser',
  'Delden',
];
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOOL_ROUNDS = 6;
const SEARCH_RADIUS_HINT_KM = 15;

const VALID_CATEGORIES = ['gezelschap', 'spelletjes', 'koffie', 'bingo', 'anders'];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Ontbrekende environment variable: ${name}. Zie .env.example.`);
    process.exit(1);
  }
  return value;
}

const fromBackupIndex = process.argv.indexOf('--from-backup');
const fromBackupPath = fromBackupIndex !== -1 ? process.argv[fromBackupIndex + 1] : null;
if (fromBackupIndex !== -1 && !fromBackupPath) {
  console.error('Gebruik: node scripts/scrape-initiatives.mjs --from-backup <pad-naar-json>');
  process.exit(1);
}

const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Alleen nodig om nieuwe initiatieven te zoeken, niet om een backup opnieuw
// te uploaden. Probeer env var eerst, gebruik dan impliciete credentials.
const anthropic = fromBackupPath
  ? null
  : new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || undefined,
    });

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

const SYSTEM_PROMPT = `Je bent een zorgvuldige onderzoeksassistent voor de Nederlandse zorgsector.

Doelgroep: bewoners van een stad of dorp die willen BIJDRAGEN aan het bestrijden
van eenzaamheid bij ouderen, bijvoorbeeld als vrijwilliger, maatje of incidentele
helper. Zoek daarom niet alleen naar activiteiten die al draaien, maar specifiek
naar initiatieven waar nieuwe vrijwilligers, maatjes of helpers welkom zijn of
gezocht worden: gezelschap/maatjesprojecten, spelletjesmiddagen, koffie-inloop,
bingoavonden en vergelijkbare sociale activiteiten voor senioren.

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
- Als je geen (voldoende) initiatieven vindt, roep dan simpelweg minder tools aan,
  verzin er geen bij om aan een aantal te voldoen.
- Antwoord verder niet in lopende tekst; gebruik alleen de tool.`;

async function findInitiativesForLocation(location, client = anthropic) {
  const messages = [
    {
      role: 'user',
      content:
        `Zoek naar 3 tot 6 echte, bestaande initiatieven waar bewoners van ` +
        `${location} (Nederland) en omgeving (binnen ongeveer ${SEARCH_RADIUS_HINT_KM} km) ` +
        `zich als vrijwilliger, maatje of helper kunnen inzetten voor ouderen ` +
        `(gezelschap, spelletjesmiddag, koffie-inloop, bingo, of vergelijkbaar). ` +
        `Houd je aan de bronregels uit de systeeminstructie. ` +
        `Sla elk gevonden initiatief op met de record_initiative tool.`,
    },
  ];

  const found = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }, RECORD_TOOL],
      messages,
    });

    const recordCalls = response.content.filter(
      (block) => block.type === 'tool_use' && block.name === 'record_initiative'
    );

    for (const call of recordCalls) {
      found.push(call.input);
    }

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') {
      break;
    }

    if (recordCalls.length > 0) {
      messages.push({
        role: 'user',
        content: recordCalls.map((call) => ({
          type: 'tool_result',
          tool_use_id: call.id,
          content: 'Opgeslagen.',
        })),
      });
    } else {
      break;
    }
  }

  return found;
}

async function geocode(entry) {
  // Plain fetch against PDOK rather than importing src/lib/geocode.ts,
  // since this script runs as plain Node ESM without a TS loader.
  const query = entry.postcode
    ? entry.postcode.replace(/\s+/g, '')
    : `${entry.city}`;
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
 * bevat (bijv. omdat de AI hetzelfde initiatief via twee plaatsen vond). */
function dedupeByNameAndCity(rows) {
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(`${row.name}|${row.city ?? ''}`, row);
  }
  return [...byKey.values()];
}

function writeBackup(rows) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `scrape-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(rows, null, 2));
  return path;
}

/** Upload rij voor rij (niet als één batch): zo blokkeert één conflicterende
 * of foutieve rij niet de rest, en kan Postgres nooit "dezelfde rij twee keer
 * in één statement" tegenkomen. */
async function uploadRows(rows) {
  const deduped = dedupeByNameAndCity(rows);
  if (deduped.length !== rows.length) {
    console.log(`  ${rows.length - deduped.length} dubbele (naam + plaats) verwijderd vóór upload.`);
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

async function runFromBackup(path) {
  console.log(`Backup laden vanaf ${path}...`);
  const rows = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`${rows.length} initiatieven gevonden in backup, uploaden naar Supabase...`);
  const { saved, failed, total } = await uploadRows(rows);
  console.log(`\nKlaar. ${saved}/${total} initiatieven opgeslagen/bijgewerkt in Supabase.`);
  if (failed > 0) {
    console.log(`${failed} rij(en) faalden, zie foutmeldingen hierboven. De backup-file blijft staan.`);
  }
}

async function runScrape() {
  const locations = process.argv.slice(2).filter((arg) => arg !== '--from-backup');
  const targets = locations.length > 0 ? locations : DEFAULT_LOCATIONS;

  console.log(`Zoeken naar initiatieven in: ${targets.join(', ')}`);

  const allEntries = [];
  for (const location of targets) {
    console.log(`\n→ ${location}`);
    try {
      const entries = await findInitiativesForLocation(location);
      console.log(`  ${entries.length} initiatief(ven) gevonden.`);
      allEntries.push(...entries);
    } catch (err) {
      console.error(`  Fout bij zoeken naar ${location}:`, err.message);
    }
  }

  if (allEntries.length === 0) {
    console.log('\nGeen initiatieven gevonden, niets om op te slaan.');
    return;
  }

  console.log(`\nGeocoden van ${allEntries.length} initiatieven...`);
  const rows = [];
  for (const entry of allEntries) {
    if (!VALID_CATEGORIES.includes(entry.category)) {
      entry.category = 'anders';
    }
    const coords = await geocode(entry);
    if (!coords) {
      console.warn(`  Kon geen locatie vinden voor "${entry.name}" (${entry.city}), overgeslagen.`);
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
    });
  }

  if (rows.length === 0) {
    console.log('Niets kon gegeocodeerd worden, niets opgeslagen.');
    return;
  }

  // Altijd eerst lokaal bewaren: gaat de upload hierna mis, dan is het
  // gevonden werk (en de AI-credits die dat kostte) niet weg. Herstel met
  // --from-backup <pad>.
  const backupPath = writeBackup(rows);
  console.log(`Backup weggeschreven naar ${backupPath}.`);

  console.log(`Uploaden naar Supabase...`);
  const { saved, failed, total } = await uploadRows(rows);
  console.log(`\nKlaar. ${saved}/${total} initiatieven opgeslagen/bijgewerkt in Supabase.`);
  if (failed > 0) {
    console.log(
      `${failed} rij(en) faalden, zie foutmeldingen hierboven. Herstel zonder opnieuw te ` +
        `zoeken met: node scripts/scrape-initiatives.mjs --from-backup ${backupPath}`
    );
  }
}

export async function scrapeInitiatives(anthropicClient, locations = DEFAULT_LOCATIONS) {
  const allEntries = [];
  console.log(`Zoeken naar initiatieven in: ${locations.join(', ')}`);

  for (const location of locations) {
    console.log(`\n→ ${location}`);
    try {
      const entries = await findInitiativesForLocation(location, anthropicClient);
      console.log(`  ${entries.length} initiatief(ven) gevonden.`);
      allEntries.push(...entries);
    } catch (err) {
      console.error(`  Fout bij zoeken naar ${location}:`, err.message);
    }
  }

  if (allEntries.length === 0) {
    console.log('\nGeen initiatieven gevonden.');
    return { saved: 0, failed: 0, total: 0 };
  }

  console.log(`\nGeocoden van ${allEntries.length} initiatieven...`);
  const rows = [];
  for (const entry of allEntries) {
    if (!VALID_CATEGORIES.includes(entry.category)) {
      entry.category = 'anders';
    }
    const coords = await geocode(entry);
    if (!coords) {
      console.warn(`  Kon geen locatie vinden voor "${entry.name}" (${entry.city}), overgeslagen.`);
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
    });
  }

  if (rows.length === 0) {
    console.log('Niets kon gegeocodeerd worden.');
    return { saved: 0, failed: 0, total: 0 };
  }

  const backupPath = writeBackup(rows);
  console.log(`Backup weggeschreven naar ${backupPath}.`);

  console.log(`Uploaden naar Supabase...`);
  const result = await uploadRows(rows);
  console.log(`\nKlaar. ${result.saved}/${result.total} initiatieven opgeslagen/bijgewerkt in Supabase.`);
  if (result.failed > 0) {
    console.log(`${result.failed} rij(en) faalden. Herstel met: --from-backup ${backupPath}`);
  }

  return result;
}

async function main() {
  if (fromBackupPath) {
    await runFromBackup(fromBackupPath);
  } else {
    await runScrape();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
