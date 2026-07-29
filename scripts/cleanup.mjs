#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log('Deleting all existing initiatives...');
  const { error, count } = await supabase.from('initiatives').delete().neq('id', 'impossible-value-to-delete-all');

  if (error) {
    console.error('Error deleting initiatives:', error.message);
    process.exit(1);
  }

  console.log(`Deleted ${count} initiatives.`);
}

cleanup();
