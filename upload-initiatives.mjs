#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cityCoords = {
  'Enschede': { latitude: 52.2215, longitude: 6.8936 },
  'Almelo': { latitude: 52.3561, longitude: 6.6708 },
  'Hengelo': { latitude: 52.2632, longitude: 6.7632 },
  'Oldenzaal': { latitude: 52.3189, longitude: 6.9383 },
  'Borne': { latitude: 52.2318, longitude: 6.7414 },
  'Losser': { latitude: 52.2356, longitude: 7.0081 },
};

function geocode(entry) {
  return cityCoords[entry.city] || null;
}

const initiatives = [
  {
    "name": "Manna Zorggroep - Maatjesprogram",
    "description": "Eénmalig gekoppeld worden aan een oudere die nog zelfstandig woont. Je biedt gezelschap door bezoeken, gezamenlijke activiteiten en een luisterend oor.",
    "category": "gezelschap",
    "address": "Boulevard 1945, Enschede",
    "postcode": "7511 AD",
    "city": "Enschede",
    "source_url": "https://www.zorggroep-manna.nl/vrijwilligerswerk/"
  },
  {
    "name": "Humanitas Twente - Tandem",
    "description": "Wekelijks samen activiteiten ondernemen met iemand die eenzaam is. Je helpt tegen sociaal isolement door regelmatig afspraken met je maatje.",
    "category": "gezelschap",
    "address": "Werkgebied: Enschede, Hengelo, Almelo, Oldenzaal, Borne, Losser",
    "postcode": "Diverse",
    "city": "Enschede",
    "source_url": "https://humanitastwente.nl/wat-we-doen/tandem/"
  },
  {
    "name": "De Groene Visite - IVN Almelo",
    "description": "Met een collega vrijwilliger bezoeken jullie dementerende ouderen in verzorg- en verpleeghuizen. Via een natuurkoffer en spullen worden herinneringen en gesprekken gestimuleerd.",
    "category": "gezelschap",
    "address": "Natuurhus Almelo (IVN afdeling)",
    "postcode": "Almelo",
    "city": "Almelo",
    "source_url": "https://www.ivn.nl/afdeling/almelo/de-groene-visite/"
  },
  {
    "name": "Almelovoorelkaar - Maatjes platform",
    "description": "Digitale marktplaats waar je jezelf inschrijft voor het maatjeswerk dat bij je past. Veel organisaties zoeken maatjes voor ouderen in Almelo.",
    "category": "gezelschap",
    "address": "Het Baken 3 (1e etage Bibliotheek Almelo)",
    "postcode": "7607 AA",
    "city": "Almelo",
    "source_url": "https://www.almelovoorelkaar.nl/maatjes"
  },
  {
    "name": "Wijkracht - Huiskamer Kulturhus Hasselo",
    "description": "Inloopcentrum voor ouderen met dagelijks koffie, praatjes en krant. Ook regelmatige bingo-avonden (2e en 4e vrijdagavond). Veel activiteiten uitgevoerd door vrijwilligers.",
    "category": "koffie",
    "address": "Henry Woodstraat 62, Hengelo (Kulturhus)",
    "postcode": "7574 AA",
    "city": "Hengelo",
    "source_url": "https://www.wijkracht.nl/nieuws/huiskamer-van-wijkracht-in-kulturhus-hasselo"
  },
  {
    "name": "Wijkracht Hengelo - Maatjes & begeleiding",
    "description": "Vrijwilligers als wandelmaatje, gespreksmaatje of begeleiding. Je helpt ouderen met sociale contacten en dagbesteding in hun buurt.",
    "category": "gezelschap",
    "address": "Johannaweg 26, Hengelo",
    "postcode": "7555 CR",
    "city": "Hengelo",
    "source_url": "https://www.wijkrachthengelo.nl/"
  },
  {
    "name": "Zorgfederatie Oldenzaal - Vrijwilligers",
    "description": "Zo'n 300 vrijwilligers werken bij instellingen. Je kunt kiezen uit wandelmaatje, gespreksmaatje, hulp bij klusjes, begeleiding naar afspraken of duofiets.",
    "category": "gezelschap",
    "address": "Fonteinstraat 55, Oldenzaal",
    "postcode": "7573 CG",
    "city": "Oldenzaal",
    "source_url": "https://www.zorgfederatieoldenzaal.nl/portal-over-het-bedrijf/vrijwilligers"
  },
  {
    "name": "Stichting Samen Eten Oldenzaal",
    "description": "Wekelijkse gezamenlijke maaltijden voor ouderen en mensen met beperking. Laagdrempelig initiatief gericht op sociale contacten en gezelligheid.",
    "category": "koffie",
    "address": "Oldenzaal",
    "postcode": "Oldenzaal",
    "city": "Oldenzaal",
    "source_url": "https://www.sociaalpleinoldenzaal.nl/"
  }
];

console.log(`Geocoding ${initiatives.length} initiatieven...\n`);

const rows = [];
for (const entry of initiatives) {
  process.stdout.write(`→ ${entry.name.substring(0, 50)}... `);
  const coords = await geocode(entry);
  if (!coords) {
    console.log('SKIP (geen locatie)');
    continue;
  }
  console.log('OK');
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

console.log(`\n${rows.length}/${initiatives.length} succesvol geocodeerd.\nUploaden naar Supabase...`);

let saved = 0;
let failed = 0;
for (const row of rows) {
  const { error } = await supabase.from('initiatives').upsert(row, { onConflict: 'name,city' });
  if (error) {
    failed++;
    console.error(`✗ ${row.name}: ${error.message}`);
  } else {
    saved++;
    console.log(`✓ ${row.name}`);
  }
}

console.log(`\n=== KLAAR ===`);
console.log(`Opgeslagen: ${saved}/${rows.length}`);
if (failed > 0) console.log(`Mislukt: ${failed}`);
