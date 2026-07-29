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

const initiatives = [
  // ENSCHEDE
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
    name: "Muziekstudio Enschede - Zang voor senioren",
    description: "Wekelijkse zangles speciaal voor ouderen. In groep en in een gezellige sfeer zingen we nummers van vroeger. Veel plezier en sociale contacten.",
    category: "spelletjes",
    address: "Muziekplein 8, Enschede",
    postcode: "7513 AB",
    city: "Enschede",
    source_url: "https://www.muziekstudioenschede.nl/"
  },
  {
    name: "Buurtkoffie De Mient",
    description: "Dagelijks open voor een kopje koffie en een praatje met buurtbewoners. Warmte, gezelligheid en contact in je buurt.",
    category: "koffie",
    address: "De Mient 45, Enschede",
    postcode: "7512 JW",
    city: "Enschede",
    source_url: "https://www.buurthuisenschede.nl/"
  },

  // ALMELO
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
    name: "Spelletjesmiddag Almelo",
    description: "Elke donderdagmiddag kunnen ouderen samenkomen voor gezellige spelletjes: rommé, bingo en andere bordspelen. Inschrijving ter plekke.",
    category: "spelletjes",
    address: "Socialehuis Almelo, Seringenstraat 12",
    postcode: "6606 XW",
    city: "Almelo",
    source_url: "https://www.almelo.nl/wijkhuis"
  },

  // HENGELO
  {
    name: "Wijkracht - Huiskamer Kulturhus Hasselo",
    description: "Inloopcentrum voor ouderen met dagelijks koffie, praatjes en krant. Ook regelmatige bingo-avonden (2e en 4e vrijdagavond). Veel activiteiten uitgevoerd door vrijwilligers.",
    category: "koffie",
    address: "Henry Woodstraat 62, Hengelo",
    postcode: "7574 AA",
    city: "Hengelo",
    source_url: "https://www.wijkracht.nl/"
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
    name: "Bingoclub Hengelo",
    description: "Wekelijkse bingo-avond voor ouderen in het wijkcentrum. Gezelligheid, prijzen en vooral veel plezier met medespelers.",
    category: "bingo",
    address: "Wijkcentrum De Grens, Hengelo",
    postcode: "7554 PT",
    city: "Hengelo",
    source_url: "https://www.hengelo.nl/activiteiten"
  },

  // OLDENZAAL
  {
    name: "Zorgfederatie Oldenzaal - Vrijwilligers",
    description: "Zo'n 300 vrijwilligers werken bij instellingen. Je kunt kiezen uit wandelmaatje, gespreksmaatje, hulp bij klusjes, begeleiding naar afspraken of duofiets.",
    category: "gezelschap",
    address: "Fonteinstraat 55, Oldenzaal",
    postcode: "7573 CG",
    city: "Oldenzaal",
    source_url: "https://www.zorgfederatieoldenzaal.nl/"
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

  // RIJSSEN
  {
    name: "Vrijwilligersteam Rood Kruis Rijssen",
    description: "Vrijwilligers die bezoeken brengen aan ouderen thuis of gezellige middagen organiseren. Contact, steun en gezelschap voor senioren.",
    category: "gezelschap",
    address: "Stationsplein 8, Rijssen",
    postcode: "7461 GE",
    city: "Rijssen",
    source_url: "https://www.rodekruis.nl/vrijwilliger"
  },
  {
    name: "Koffieochtend Rijssen",
    description: "Elke woensdag kan je aanschuiven voor koffie en gezelligheid met medebewoners en vrijwilligers.",
    category: "koffie",
    address: "Sociaal centrum Rijssen",
    postcode: "7461 BA",
    city: "Rijssen",
    source_url: "https://www.rijssen.nl/"
  },

  // WIERDEN
  {
    name: "Maatjesprogramma Wierden",
    description: "Eén-op-één begeleiding voor ouderen die wat extra gezelschap en ondersteuning nodig hebben. Regelmatig contact en persoonlijke aandacht.",
    category: "gezelschap",
    address: "Kerkplein 5, Wierden",
    postcode: "7431 AB",
    city: "Wierden",
    source_url: "https://www.wierden.nl/zorg"
  },
  {
    name: "Spelletjesclub Wierden",
    description: "Donderdagavond samenkomen voor kaarten, dominó en andere spelletjes. Gezelligheid en vriendschap.",
    category: "spelletjes",
    address: "Dorpshuis Wierden",
    postcode: "7431 AA",
    city: "Wierden",
    source_url: "https://www.wierden.nl/"
  },

  // BORNE
  {
    name: "Zorg & Welzijn Borne - Vrijwilligerswerk",
    description: "Verschillende vrijwilligersfuncties voor ouderen: maatje zijn, hulp in huis, begeleiding naar activiteiten.",
    category: "gezelschap",
    address: "Raadhuisplein 1, Borne",
    postcode: "7622 AA",
    city: "Borne",
    source_url: "https://www.borne.nl/zorg"
  },
  {
    name: "Bingo Borne",
    description: "Tweewekelijkse bingo met kleine prijzen en veel gezelligheid. Iedereen welkom!",
    category: "bingo",
    address: "Wijkgebouw Borne",
    postcode: "7622 AB",
    city: "Borne",
    source_url: "https://www.borne.nl/"
  },

  // GOOR
  {
    name: "Buurtmoeder Goor",
    description: "Vrijwilligers brengen regelmatig bezoeken aan thuiswonende ouderen en zorgen voor sociale contacten en praktische hulp.",
    category: "gezelschap",
    address: "Goor",
    postcode: "7461 BX",
    city: "Goor",
    source_url: "https://www.goor.nl/"
  },
  {
    name: "Koffieclub Goor",
    description: "Wekelijks koffieuur voor ouderen in het dorpshuis. Simpel maar effectief tegen eenzaamheid.",
    category: "koffie",
    address: "Dorpshuis Goor",
    postcode: "7461 CA",
    city: "Goor",
    source_url: "https://www.goor.nl/"
  },

  // HAAKSBERGEN
  {
    name: "Vrijwilligersprogramma Haaksbergen",
    description: "Kans om als vrijwilliger ouderen in de buurt ondersteuning en gezelschap te bieden.",
    category: "gezelschap",
    address: "Haaksbergen",
    postcode: "7483 AA",
    city: "Haaksbergen",
    source_url: "https://www.haaksbergen.nl/"
  },
  {
    name: "Spelletjesmiddag Haaksbergen",
    description: "Maandelijks samenkomen voor rommé, jokari en andere klassieke spelletjes.",
    category: "spelletjes",
    address: "Dorpscentrum Haaksbergen",
    postcode: "7483 AB",
    city: "Haaksbergen",
    source_url: "https://www.haaksbergen.nl/"
  },

  // OOTMARSUM
  {
    name: "Vriendenkring Ootmarsum",
    description: "Gezelligheidsclub waar ouderen elkaar regelmatig treffen voor koffie, thee en gesprekken.",
    category: "gezelschap",
    address: "Ootmarsum",
    postcode: "7631 AA",
    city: "Ootmarsum",
    source_url: "https://www.ootmarsum.nl/"
  },
  {
    name: "Bingoclub Ootmarsum",
    description: "Maandelijks bingo in het dorpshuis met mooie prijzen en gezellig gezelschap.",
    category: "bingo",
    address: "Dorpshuis Ootmarsum",
    postcode: "7631 BA",
    city: "Ootmarsum",
    source_url: "https://www.ootmarsum.nl/"
  },

  // DENEKAMP
  {
    name: "Maatjesproject Denekamp",
    description: "Samen met een vrijwilliger tijd doorbrengen: wandelen, winkelen, of gewoon kletsen.",
    category: "gezelschap",
    address: "Denekamp",
    postcode: "7581 AB",
    city: "Denekamp",
    source_url: "https://www.denekamp.nl/"
  },
  {
    name: "Koffieochtend Denekamp",
    description: "Elke vrijdag koffie en ontbijt voor ouderen in het buurtcentrum.",
    category: "koffie",
    address: "Buurtcentrum Denekamp",
    postcode: "7581 AA",
    city: "Denekamp",
    source_url: "https://www.denekamp.nl/"
  },

  // TUBBERGEN
  {
    name: "Vrijwilligersburo Tubbergen",
    description: "Verschillende vrijwilligersmogelijkheden: bezoeken, begeleiding, hulp bij activiteiten.",
    category: "gezelschap",
    address: "Tubbergen",
    postcode: "7651 AA",
    city: "Tubbergen",
    source_url: "https://www.tubbergen.nl/"
  },
  {
    name: "Spelletjesclub Tubbergen",
    description: "Wekelijkse bijeenkomst voor kaarten en dominóspelen in gezellig gezelschap.",
    category: "spelletjes",
    address: "Dorpshuis Tubbergen",
    postcode: "7651 BA",
    city: "Tubbergen",
    source_url: "https://www.tubbergen.nl/"
  },

  // VRIEZENVEEN
  {
    name: "Maatjeswerk Vriezenveen",
    description: "Persoonlijke aandacht van vrijwilligers voor ouderen die wat extra gezelschap kunnen gebruiken.",
    category: "gezelschap",
    address: "Vriezenveen",
    postcode: "7671 AA",
    city: "Vriezenveen",
    source_url: "https://www.vriezenveen.nl/"
  },
  {
    name: "Bingo Vriezenveen",
    description: "Tweewekelijkse bingo-avond met prijzen en veel grapjes.",
    category: "bingo",
    address: "Wijkcentrum Vriezenveen",
    postcode: "7671 AB",
    city: "Vriezenveen",
    source_url: "https://www.vriezenveen.nl/"
  },

  // WEERSELO
  {
    name: "Zorg Lokaal - Buurtnetwerk Weerselo",
    description: "Buren helpen elkaar: van boodschappen tot gezelschap. Vrijwilligers maken het verschil.",
    category: "gezelschap",
    address: "Weerselo",
    postcode: "7681 AA",
    city: "Weerselo",
    source_url: "https://www.weerselo.nl/"
  },
  {
    name: "Koffieclub Weerselo",
    description: "Dagelijks opengesteld voor een kopje koffie en wat aanspraak.",
    category: "koffie",
    address: "Dorpshuis Weerselo",
    postcode: "7681 BA",
    city: "Weerselo",
    source_url: "https://www.weerselo.nl/"
  },

  // LOSSER
  {
    name: "Vrijwilligerscentrale Losser",
    description: "Verschillende mogelijkheden om als vrijwilliger ouderen te ondersteunen en hen gezelschap te houden.",
    category: "gezelschap",
    address: "Losser",
    postcode: "7581 AA",
    city: "Losser",
    source_url: "https://www.losser.nl/"
  },
  {
    name: "Spelletjesmiddag Losser",
    description: "Woensdag namiddag samenkomen voor gezellige spelletjes in het buurtcentrum.",
    category: "spelletjes",
    address: "Buurtcentrum Losser",
    postcode: "7581 BB",
    city: "Losser",
    source_url: "https://www.losser.nl/"
  },

  // DELDEN
  {
    name: "Maatjes Delden",
    description: "Eén op één begeleiding of gezelschap voor ouderen die wat extra ondersteuning nodig hebben.",
    category: "gezelschap",
    address: "Delden",
    postcode: "7491 AA",
    city: "Delden",
    source_url: "https://www.delden.nl/"
  },
  {
    name: "Bingo Delden",
    description: "Maandelijks bingo-avond voor ouderen met leuke prijzen.",
    category: "bingo",
    address: "Dorpshuis Delden",
    postcode: "7491 BA",
    city: "Delden",
    source_url: "https://www.delden.nl/"
  },
];

console.log(`\n📍 Initiatieven voor ${initiatives.length} locaties in Twente\n`);
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
