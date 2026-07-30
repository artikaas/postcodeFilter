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

// GEVERIFIEERDE INITIATIEVEN - ENIG GELDIGE BRON
// Elke entry is individueel gecontroleerd op: (1) bestaan van de organisatie,
// (2) inhoud van de bron-URL, (3) juistheid van de gemeente. Twee eerder
// opgenomen entries bleken bij herverificatie onjuist en zijn verwijderd:
// "Stichting Samen Eten Oldenzaal" (geen enkele bron bevestigt dat deze
// stichting bestaat) en "Humanitas Twente - Vrijwilligerscentrale" (bron-URL
// klopte niet en het enige andere concrete Humanitas Twente-programma,
// "Samen Actief", richt zich op statushouders, niet op ouderen).
const VERIFIED_INITIATIVES = [
  {
    name: "Manna Zorggroep - Vrijwilligerswerk",
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
    postcode: null,
    city: "Enschede",
    source_url: "https://humanitastwente.nl/wat-we-doen/tandem/"
  },
  {
    name: "De Groene Visite - IVN Almelo",
    description: "Met een collega vrijwilliger bezoeken jullie dementerende ouderen in verzorg- en verpleeghuizen. Via een natuurkoffer en spullen worden herinneringen en gesprekken gestimuleerd.",
    category: "gezelschap",
    address: "Natuurhus Almelo (IVN afdeling)",
    postcode: null,
    city: "Almelo",
    source_url: "https://www.ivn.nl/afdeling/almelo/de-groene-visite/"
  },
  {
    name: "Almelovoorelkaar - Maatjesplatform",
    description: "Digitale marktplaats van Avedan Welzijn waar je jezelf inschrijft voor het maatjeswerk dat bij je past. Ruim de helft van de hulpvragen gaat over gezelschap of een maatje voor een oudere.",
    category: "gezelschap",
    address: "Het Baken 3, Bibliotheek Almelo",
    postcode: null,
    city: "Almelo",
    source_url: "https://www.almelovoorelkaar.nl/over-almelovoorelkaar"
  },
  {
    name: "Wijkracht - Huiskamer Kulturhus Hasselo",
    description: "Inloopcentrum voor ouderen met dagelijks koffie en een praatje. Ook regelmatige bingo-avonden (2e en 4e vrijdagavond van de maand). Draait op vrijwilligers.",
    category: "koffie",
    address: "Henry Woodstraat 62, Hengelo (Kulturhus)",
    postcode: null,
    city: "Hengelo",
    source_url: "https://www.wijkracht.nl/nieuws/huiskamer-van-wijkracht-in-kulturhus-hasselo"
  },
  {
    name: "Wijkracht Hengelo - Een maatje",
    description: "Vrijwilligers als wandelmaatje, gespreksmaatje of vriendenkring-begeleider. Je helpt ouderen met sociale contacten en dagbesteding in hun buurt.",
    category: "gezelschap",
    address: "Johannaweg 26, Hengelo",
    postcode: "7555 CR",
    city: "Hengelo",
    source_url: "https://www.wijkrachthengelo.nl/ik_zoek/een_maatje/"
  },
  {
    name: "Zorgfederatie Oldenzaal - Vrijwilligers",
    description: "Zo'n 300 vrijwilligers werken bij deze zorgorganisatie. Je kunt kiezen uit wandelmaatje, gespreksmaatje, hulp bij klusjes, begeleiding naar afspraken of samen op de duofiets.",
    category: "gezelschap",
    address: "Fonteinstraat 55, Oldenzaal",
    postcode: "7573 CG",
    city: "Oldenzaal",
    source_url: "https://www.zorgfederatieoldenzaal.nl/portal-over-het-bedrijf/vrijwilligers"
  },
  {
    name: "Impuls Oldenzaal - Maaltijden en Open Eettafel",
    description: "Vrijwilligers bezorgen warme maaltijden aan huis bij ouderen. Daarnaast is er elke dinsdag en donderdag een Open Eettafel voor 60-plussers bij Breedwijs, mede door vrijwilligers georganiseerd.",
    category: "anders",
    address: "Helmichstraat 42b, Oldenzaal (Breedwijs, Zuid Berghuizen)",
    postcode: null,
    city: "Oldenzaal",
    source_url: "https://www.impuls-oldenzaal.nl/diensten/vrijwilligerswerk/"
  },
  {
    name: "Rode Kruis Twente",
    description: "Vrijwilligers die eenzame en kwetsbare ouderen ondersteunen, onder meer via telefooncirkels en contactcirkels waarbij dagelijks of op afgesproken momenten contact wordt gehouden.",
    category: "gezelschap",
    address: "Twente",
    postcode: null,
    city: "Enschede",
    source_url: "https://www.rodekruis.nl/twente/dit-doen-we/"
  },
  {
    name: "Fietsmaatjes Borne",
    description: "Als fietsvrijwilliger maak je op een duo-fiets met elektrische trapondersteuning tochten met iemand die niet meer zelfstandig kan fietsen. Zelf te bepalen hoe vaak: wekelijks, tweewekelijks of in eigen ritme.",
    category: "gezelschap",
    address: "Gemeente Borne",
    postcode: null,
    city: "Borne",
    source_url: "https://fietsmaatjesborne.nl/fietsvrijwilliger/"
  },
  {
    name: "Ontmoetingsgroep Noaberpoort",
    description: "Elke vrijdagochtend een goed gesprek, een potje kaarten en koffie of thee, afgesloten met een warme maaltijd. Vrijwilligers maken deze wekelijkse ontmoeting voor ouderen mogelijk.",
    category: "koffie",
    address: "Clubgebouw HSC'21, Haaksbergen",
    postcode: null,
    city: "Haaksbergen",
    source_url: "https://www.rondhaaksbergen.nl/ontmoetingsgroep-van-noaberpoort/"
  },
  {
    name: "Evenmens - Zorgvrijwilliger Rijssen-Holten en Wierden",
    description: "Koppeling met een individuele hulpvraag van een oudere in de buurt, bijvoorbeeld samen naar buiten, boodschappen of een bezoek aan de kapper. Aandacht, tijd en een luisterend oor staan centraal.",
    category: "gezelschap",
    address: "Regio Rijssen-Holten en Wierden",
    postcode: null,
    city: "Rijssen",
    source_url: "https://evenmens.nl/vacatures-vrijwilligers/"
  },
  {
    name: "Losser doet! - Vrijwilligersvacaturebank",
    description: "Overzicht van vrijwilligerswerk in de gemeente Losser, met regelmatig concrete maatjesvragen van ouderen die op zoek zijn naar gezelschap of een praatje.",
    category: "gezelschap",
    address: "Gemeente Losser",
    postcode: null,
    city: "Losser",
    source_url: "https://www.losserdoet.nl/vacaturebank/"
  },
  {
    name: "SWTD - Servicepunt Vrijwillige Inzet Tubbergen",
    description: "Spreekuur waar inwoners van Tubbergen en Dinkelland die vrijwilligerswerk zoeken, gekoppeld worden aan een passende hulpvraag, waaronder ondersteuning van ouderen.",
    category: "anders",
    address: "Bibliotheek Tubbergen",
    postcode: null,
    city: "Tubbergen",
    source_url: "https://swtd.nl/ons-aanbod/vrijwillige-inzet/servicepunt-vrijwillige-inzet"
  },
];

// Maak set van geverifieerde initiative-namen
const VERIFIED_NAMES = new Set(VERIFIED_INITIATIVES.map(i => i.name));

console.log(`\n🔄 Database opschonen en geverifieerde initiatieven uploaden\n`);

// Stap 1: Haal alle huidige initiatieven op
console.log('1️⃣  Huidige database controleren...\n');
const { data: currentInitiatives, error: fetchError } = await supabase
  .from('initiatives')
  .select('id, name, city');

if (fetchError) {
  console.error('❌ Fout bij ophalen database:', fetchError.message);
  process.exit(1);
}

console.log(`   ${currentInitiatives.length} initiatieven gevonden in database\n`);

// Stap 2: Verwijder niet-geverifieerde initiatieven
if (currentInitiatives.length > 0) {
  console.log('2️⃣  Niet-geverifieerde initiatieven verwijderen...\n');
  let deleted = 0;
  for (const initiative of currentInitiatives) {
    if (!VERIFIED_NAMES.has(initiative.name)) {
      const { error: deleteError } = await supabase
        .from('initiatives')
        .delete()
        .eq('id', initiative.id);
      if (deleteError) {
        console.log(`   ✗ Verwijdering mislukt: ${initiative.name}`);
      } else {
        deleted++;
        console.log(`   ✓ Verwijderd: ${initiative.name} (${initiative.city})`);
      }
    }
  }
  if (deleted === 0) {
    console.log('   (geen niet-geverifieerde initiatieven gevonden)\n');
  } else {
    console.log(`\n   ${deleted} initiatieven verwijderd\n`);
  }
}

// Stap 3: Upload geverifieerde initiatieven
console.log('3️⃣  Geverifieerde initiatieven uploaden...\n');

const rows = [];
for (const entry of VERIFIED_INITIATIVES) {
  const coords = geocode(entry);
  if (!coords) {
    console.log(`   ⚠ ${entry.name}: geen coördinaten`);
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

let saved = 0;
let failed = 0;
for (const row of rows) {
  const { error } = await supabase.from('initiatives').upsert(row, { onConflict: 'name,city' });
  if (error) {
    failed++;
    console.log(`   ✗ ${row.name}: ${error.message}`);
  } else {
    saved++;
    console.log(`   ✓ ${row.name} (${row.city})`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ KLAAR`);
console.log(`   Opgeslagen: ${saved}/${rows.length} geverifieerde initiatieven`);
if (failed > 0) console.log(`   Mislukt: ${failed}`);
console.log(`${'='.repeat(60)}\n`);
