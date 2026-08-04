#!/usr/bin/env node
// Vindt echte, bestaande ouderenzorg-initiatieven (gezelschap, spelletjes,
// koffie, bingo, etc.) rond opgegeven plaatsen, via een hybride aanpak:
// Haiku 4.5 zoekt breed en diep, Sonnet verifieert elke vondst daarna
// onafhankelijk (eigen web search, geen gedeelde context met de zoekstap),
// een technische link-check bevestigt dat de bron ook echt bereikbaar is,
// en pas dan gaat het naar Supabase (via PDOK-geocoding).
//
// Kan op twee manieren draaien:
// 1. Direct via CLI (vereist ANTHROPIC_API_KEY in .env):
//    node scripts/scrape-initiatives.mjs "Ootmarsum" "Enschede"
// 2. Via Agent (geen API-key nodig, Agent heeft eigen access):
//    import { scrapeInitiatives } from './scrape-initiatives.mjs'
//
// Voordat er iets naar Supabase gaat, wordt de verzamelde data altijd eerst
// lokaal opgeslagen in scripts/output/ (inclusief afgewezen/uitgesloten
// kandidaten, met reden). Gaat de Supabase-upload om wat voor reden dan ook
// mis, dan zijn de resultaten niet weg: herstel met:
//   node scripts/scrape-initiatives.mjs --from-backup scripts/output/<bestand>.json

import 'dotenv/config';
import { readFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { runPipeline, uploadRows } from './lib/pipeline.mjs';

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

// Alleen nodig om nieuwe initiatieven te zoeken/verifiëren, niet om een
// backup opnieuw te uploaden. Probeer env var eerst, gebruik dan impliciete
// credentials (bijv. wanneer dit via een Agent-context draait).
const anthropic = fromBackupPath
  ? null
  : new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || undefined,
    });

async function runFromBackup(path) {
  console.log(`Backup laden vanaf ${path}...`);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const rows = Array.isArray(raw) ? raw : raw.uploaded ?? [];
  if (rows.length === 0) {
    console.log('Geen geüploade rijen in deze backup (mogelijk alleen afgewezen kandidaten).');
    return;
  }
  console.log(`${rows.length} initiatieven gevonden in backup, uploaden naar Supabase...`);
  const { saved, failed, total } = await uploadRows(rows, supabase);
  console.log(`\nKlaar. ${saved}/${total} initiatieven opgeslagen/bijgewerkt in Supabase.`);
  if (failed > 0) {
    console.log(`${failed} rij(en) faalden, zie foutmeldingen hierboven. De backup-file blijft staan.`);
  }
}

export async function scrapeInitiatives(anthropicClient, locations = DEFAULT_LOCATIONS) {
  return runPipeline(anthropicClient, locations, supabase);
}

async function main() {
  if (fromBackupPath) {
    await runFromBackup(fromBackupPath);
    return;
  }

  const locations = process.argv.slice(2).filter((arg) => arg !== '--from-backup');
  const targets = locations.length > 0 ? locations : DEFAULT_LOCATIONS;
  await runPipeline(anthropic, targets, supabase);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
