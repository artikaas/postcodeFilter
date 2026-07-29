#!/usr/bin/env node
// Vindt echte, bestaande ouderenzorg-initiatieven (gezelschap, spelletjes,
// koffie, bingo, etc.) rond opgegeven plaatsen via Claude's web search tool,
// geocodet ze via PDOK, en zet ze in de Supabase-tabel `initiatives`.
//
// Gebruik:
//   node scripts/scrape-initiatives.mjs "Ootmarsum" "Enschede" "Almelo"
//   node scripts/scrape-initiatives.mjs                # gebruikt DEFAULT_LOCATIONS
//
// Vereist in .env (zie .env.example):
//   ANTHROPIC_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Dit script draait bewust NIET automatisch/live vanuit de browser: het
// gebruikt de service-role key en een Anthropic API-key, die nooit in de
// frontend-bundle terecht mogen komen.

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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

const anthropicKey = requireEnv('ANTHROPIC_API_KEY');
const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const anthropic = new Anthropic({ apiKey: anthropicKey });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

async function findInitiativesForLocation(location) {
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
    const response = await anthropic.messages.create({
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

    // Only client-side tools (record_initiative) need a tool_result to
    // unblock the conversation, web_search is a server tool, handled
    // entirely by Anthropic within the same response.
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

async function main() {
  const locations = process.argv.slice(2);
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

  console.log(`\nGeocoden en opslaan van ${allEntries.length} initiatieven...`);
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

  const { error, data } = await supabase
    .from('initiatives')
    .upsert(rows, { onConflict: 'name,city' })
    .select('id');

  if (error) {
    console.error('Opslaan in Supabase mislukt:', error.message);
    process.exit(1);
  }

  console.log(`\nKlaar. ${data.length} initiatieven opgeslagen/bijgewerkt in Supabase.`);
}

main();
