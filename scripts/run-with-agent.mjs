#!/usr/bin/env node
// Agent-friendly scraper entry point.
// Deze wrapper is ontworpen om aangeroepen te worden vanuit Claude (Agent context)
// met impliciete Anthropic API-access, in plaats van een eigen ANTHROPIC_API_KEY.
// Gebruikt dezelfde ontdekken -> onafhankelijk verifiëren -> link-check ->
// upload pipeline als scrape-initiatives.mjs, zie scripts/lib/pipeline.mjs.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { runPipeline } from './lib/pipeline.mjs';

const DEFAULT_LOCATIONS = [
  'Enschede', 'Almelo', 'Hengelo', 'Oldenzaal', 'Rijssen', 'Wierden',
  'Borne', 'Goor', 'Haaksbergen', 'Ootmarsum', 'Denekamp', 'Tubbergen',
  'Vriezenveen', 'Weerselo', 'Losser', 'Delden',
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function scrapeWithAgent(anthropicClient, locations = DEFAULT_LOCATIONS) {
  return runPipeline(anthropicClient, locations, supabase);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Run this module via Agent with Anthropic client.');
  process.exit(1);
}
