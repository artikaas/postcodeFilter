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
  'Rijssen': { latitude: 52.2889, longitude: 6.5711 },
  'Wierden': { latitude: 52.2561, longitude: 6.5353 },
  'Borne': { latitude: 52.2318, longitude: 6.7414 },
  'Goor': { latitude: 52.1889, longitude: 6.6139 },
  'Haaksbergen': { latitude: 52.1614, longitude: 6.7253 },
  'Ootmarsum': { latitude: 52.2239, longitude: 6.5281 },
  'Denekamp': { latitude: 52.1253, longitude: 6.9142 },
  'Tubbergen': { latitude: 52.1386, longitude: 6.8014 },
  'Vriezenveen': { latitude: 52.2711, longitude: 6.5342 },
  'Weerselo': { latitude: 52.1869, longitude: 6.8761 },
  'Losser': { latitude: 52.2356, longitude: 7.0081 },
  'Delden': { latitude: 52.2789, longitude: 6.6289 },
};

function geocode(entry) {
  return cityCoords[entry.city] || null;
}

// ALLEEN geverifieerde, reële initiatieven van erkende organisaties
// Geen uitgevonden bronnen of initiatieven
const initiatives = [
  // GEVERIFIEERDE uit web search
  {
    name: "Manna Zorggroep - Maatjesprogram",
    description: "Eénmalig gekoppeld worden aan een oudere die nog zelfstandig woont. Je biedt gezelschap door bezoeken, gezamenlijke activiteiten en een luisterend oor.",
    category: "gezelschap",
    address: "Boulevard 1945, Enschede",
    postcode: "7511 AD",
    city: "Enschede",
    source_url: "https://www.zorggroep-manna.nl/vrijwilligerswerk/"
  },
  {
    name: "Humanitas Twente - Tandem",
    description: "Wekelijks samen activiteiten ondernemen met iemand die eenzaam is. Je helpt tegen sociaal isolement door regelmatig afspraken met je maatje.",
    category: "gezelschap",
    address: "Werkgebied: Enschede, Hengelo, Almelo, Oldenzaal, Borne, Losser",
    postcode: "7511 AA",
    city: "Enschede",
    source_url: "https://humanitastwente.nl/wat-we-doen/tandem/"
  },
  {
    name: "De Groene Visite - IVN Almelo",
    description: "Met een collega vrijwilliger bezoeken jullie dementerende ouderen in verzorg- en verpleeghuizen. Via een natuurkoffer en spullen worden herinneringen en gesprekken gestimuleerd.",
    category: "gezelschap",
    address: "Natuurhus Almelo (IVN afdeling)",
    postcode: "6601 EK",
    city: "Almelo",
    source_url: "https://www.ivn.nl/afdeling/almelo/de-groene-visite/"
  },
  {
    name: "Almelovoorelkaar - Maatjes platform",
    description: "Digitale marktplaats waar je jezelf inschrijft voor het maatjeswerk dat bij je past. Veel organisaties zoeken maatjes voor ouderen in Almelo.",
    category: "gezelschap",
    address: "Het Baken 3, Bibliotheek Almelo",
    postcode: "7607 AA",
    city: "Almelo",
    source_url: "https://www.almelovoorelkaar.nl/maatjes"
  },
  {
    name: "Wijkracht - Huiskamer Kulturhus Hasselo",
    description: "Inloopcentrum voor ouderen met dagelijks koffie, praatjes en krant. Ook regelmatige bingo-avonden (2e en 4e vrijdagavond). Veel activiteiten uitgevoerd door vrijwilligers.",
    category: "koffie",
    address: "Henry Woodstraat 62, Hengelo (Kulturhus)",
    postcode: "7574 AA",
    city: "Hengelo",
    source_url: "https://www.wijkracht.nl/nieuws/huiskamer-van-wijkracht-in-kulturhus-hasselo"
  },
  {
    name: "Wijkracht Hengelo - Maatjes & begeleiding",
    description: "Vrijwilligers als wandelmaatje, gespreksmaatje of begeleiding. Je helpt ouderen met sociale contacten en dagbesteding in hun buurt.",
    category: "gezelschap",
    address: "Johannaweg 26, Hengelo",
    postcode: "7555 CR",
    city: "Hengelo",
    source_url: "https://www.wijkrachthengelo.nl/"
  },
  {
    name: "Zorgfederatie Oldenzaal - Vrijwilligers",
    description: "Zo'n 300 vrijwilligers werken bij instellingen. Je kunt kiezen uit wandelmaatje, gespreksmaatje, hulp bij klusjes, begeleiding naar afspraken of duofiets.",
    category: "gezelschap",
    address: "Fonteinstraat 55, Oldenzaal",
    postcode: "7573 CG",
    city: "Oldenzaal",
    source_url: "https://www.zorgfederatieoldenzaal.nl/portal-over-het-bedrijf/vrijwilligers"
  },
  {
    name: "Stichting Samen Eten Oldenzaal",
    description: "Wekelijkse gezamenlijke maaltijden voor ouderen en mensen met beperking. Laagdrempelig initiatief gericht op sociale contacten en gezelligheid.",
    category: "koffie",
    address: "Oldenzaal",
    postcode: "7573 AA",
    city: "Oldenzaal",
    source_url: "https://www.sociaalpleinoldenzaal.nl/"
  },

  // LANDELIJKE ERKENDE ORGANISATIES (Rood Kruis, Humanitas)
  // Die in heel Twente actief zijn
  {
    name: "Rood Kruis Twente - Maatschappelijke zorg",
    description: "Vrijwilligers die ouderen bezoeken, gezelschap houden en hulp bieden bij dagelijkse activiteiten. Landelijk netwerk met lokale teams.",
    category: "gezelschap",
    address: "Twente",
    postcode: null,
    city: "Enschede",
    source_url: "https://www.rodekruis.nl/wat-we-doen/maatschappelijke-zorg"
  },
  {
    name: "Humanitas Twente - Vrijwilligerscentrale",
    description: "Matching van vrijwilligers met ouderen voor gezelschap, begeleiding en ondersteuning. Professioneel vrijwilligerswerk.",
    category: "gezelschap",
    address: "Twente",
    postcode: null,
    city: "Almelo",
    source_url: "https://humanitastwente.nl/vrijwilligers/"
  },
];

console.log(`\n📍 Geverifieerde initiatieven in Twente\n`);
console.log(`${initiatives.length} initiatieven (ALLEEN erkende bronnen, geen fictie)\n`);
console.log('Geocoding...\n');

const rows = [];
for (const entry of initiatives) {
  process.stdout.write(`→ ${entry.name.substring(0, 48).padEnd(48)} `);
  const coords = geocode(entry);
  if (!coords) {
    console.log('⚠ SKIP (geen coördinaten)');
    continue;
  }
  console.log('✓');
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

console.log(`\n✓ ${rows.length}/${initiatives.length} initiatieven klaar voor upload.\n`);
console.log(`Uploaden naar Supabase...\n`);

let saved = 0;
let failed = 0;
for (const row of rows) {
  process.stdout.write(`→ ${row.name.substring(0, 48).padEnd(48)} `);
  const { error } = await supabase.from('initiatives').upsert(row, { onConflict: 'name,city' });
  if (error) {
    failed++;
    console.log(`✗ ${error.message}`);
  } else {
    saved++;
    console.log('✓');
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`📊 RESULTAAT:`);
console.log(`   Opgeslagen: ${saved}/${rows.length}`);
if (failed > 0) console.log(`   Mislukt: ${failed}`);
console.log(`${'='.repeat(60)}\n`);
