#!/usr/bin/env node
// Agent-friendly scraper entry point.
// Deze wrapper is ontworpen om aangeroepen te worden vanuit Claude (Agent context)
// met impliciete Anthropic API-access.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(SCRIPT_DIR, 'output');

const DEFAULT_LOCATIONS = [
  'Enschede', 'Almelo', 'Hengelo', 'Oldenzaal', 'Rijssen', 'Wierden',
  'Borne', 'Goor', 'Haaksbergen', 'Ootmarsum', 'Denekamp', 'Tubbergen',
  'Vriezenveen', 'Weerselo', 'Losser', 'Delden',
];

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOOL_ROUNDS = 6;
const SEARCH_RADIUS_HINT_KM = 15;
const VALID_CATEGORIES = ['gezelschap', 'spelletjes', 'koffie', 'bingo', 'anders'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

async function findInitiatives(anthropicClient, location) {
  const RECORD_TOOL = {
    name: 'record_initiative',
    description: 'Slaat één gevonden, echt bestaand ouderenzorg-initiatief op.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Naam van het initiatief of de activiteit.' },
        description: { type: 'string', description: 'Korte beschrijving (max 2 zinnen).' },
        category: {
          type: 'string',
          enum: VALID_CATEGORIES,
          description: 'Categorie: gezelschap, spelletjes, koffie, bingo, of anders.',
        },
        address: { type: 'string', description: 'Adres indien bekend.' },
        postcode: { type: 'string', description: 'Postcode indien bekend.' },
        city: { type: 'string', description: 'Plaatsnaam.' },
        source_url: { type: 'string', description: 'URL naar de bron.' },
      },
      required: ['name', 'description', 'category', 'city', 'source_url'],
    },
  };

  const messages = [
    {
      role: 'user',
      content:
        `Zoek naar 3 tot 6 echte, bestaande initiatieven waar bewoners van ` +
        `${location} (Nederland) en omgeving (binnen ongeveer ${SEARCH_RADIUS_HINT_KM} km) ` +
        `zich als vrijwilliger, maatje of helper kunnen inzetten voor ouderen. ` +
        `Houd je aan de bronregels. Sla elk gevonden initiatief op met de record_initiative tool.`,
    },
  ];

  const found = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await anthropicClient.messages.create({
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

async function uploadRows(rows) {
  const deduped = dedupeByNameAndCity(rows);
  if (deduped.length !== rows.length) {
    console.log(`  ${rows.length - deduped.length} dubbele (naam + plaats) verwijderd.`);
  }

  let saved = 0;
  let failed = 0;
  for (const row of deduped) {
    const { error } = await supabase.from('initiatives').upsert(row, { onConflict: 'name,city' });
    if (error) {
      failed += 1;
      console.error(`  Opslaan mislukt: "${row.name}" (${row.city}): ${error.message}`);
    } else {
      saved += 1;
    }
  }
  return { saved, failed, total: deduped.length };
}

export async function scrapeWithAgent(anthropicClient, locations = DEFAULT_LOCATIONS) {
  console.log(`Zoeken in: ${locations.join(', ')}\n`);

  const allEntries = [];
  for (const location of locations) {
    console.log(`→ ${location}`);
    try {
      const entries = await findInitiatives(anthropicClient, location);
      console.log(`  ${entries.length} gevonden`);
      allEntries.push(...entries);
    } catch (err) {
      console.error(`  Fout: ${err.message}`);
    }
  }

  if (allEntries.length === 0) {
    console.log('\nGeen initiatieven gevonden.');
    return { saved: 0, failed: 0, total: 0 };
  }

  console.log(`\nGeocoden ${allEntries.length} initiatieven...`);
  const rows = [];
  for (const entry of allEntries) {
    if (!VALID_CATEGORIES.includes(entry.category)) {
      entry.category = 'anders';
    }
    const coords = await geocode(entry);
    if (!coords) {
      console.warn(`  Geen locatie voor "${entry.name}", overgeslagen.`);
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
  console.log(`Backup: ${backupPath}`);

  console.log(`Uploading naar Supabase...`);
  const result = await uploadRows(rows);
  console.log(`\nKlaar: ${result.saved}/${result.total} opgeslagen.`);
  if (result.failed > 0) {
    console.log(`${result.failed} faalden.`);
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Run this module via Agent with Anthropic client.');
  process.exit(1);
}
