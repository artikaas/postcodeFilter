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
//
// Deze lijst is uitgebreid via een volledige ontdekken -> onafhankelijk
// verifiëren pipeline (zie scripts/lib/pipeline.mjs voor de geautomatiseerde
// variant): brede zoekronde per plaats, gevolgd door een aparte, kritische
// herverificatie van elke vondst. Ook daarbij vielen entries af, o.a. een
// "Wijkracht Dinkelland - Maatje"-claim (bleek alleen een gemeentebrede
// aankondiging, geen bevestigd initiatief specifiek in Denekamp) en
// "Welzijn Ouderen Borne" (verkeerde organisatie toegeschreven, en de
// frequentie van één activiteit klopte niet met de bron).
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

  // Enschede
  {
    name: "Alifa Welzijn Senioren - Maatje voor een Praatje",
    description: "Vrijwilligers bieden ouderen fysiek of telefonisch gezelschap via een praatje, wandeling of telefoongesprek, gericht op het doorbreken van eenzaamheid.",
    category: "gezelschap",
    address: "Pathmossingel 200, Enschede",
    postcode: "7513 CM",
    city: "Enschede",
    source_url: "https://www.alifa.nl/dienst/82/maatje-voor-een-praatje"
  },
  {
    name: "Alifa Welzijn Senioren - Vind Gezelschap",
    description: "Besloten online platform van Alifa waarop senioren na een intake door een vrijwilliger in contact komen met iemand om samen te winkelen, wandelen of naar het theater te gaan.",
    category: "gezelschap",
    address: "Pathmossingel 200, Enschede",
    postcode: "7513 CM",
    city: "Enschede",
    source_url: "https://www.alifa.nl/dienst/34/vind-gezelschap"
  },
  {
    name: "Livio - Huiskamer van de Wijk Twekkelerveld",
    description: "Kleinschalige inloopvoorziening voor thuiswonende ouderen waar vrijwilligers als gastheer/gastvrouw zorgen voor een praatje, ontmoeting en gezamenlijke activiteiten.",
    category: "gezelschap",
    address: "Schorpioenstraat 33, Enschede",
    postcode: "7521 HW",
    city: "Enschede",
    source_url: "https://www.livio.nl/zorg/dagbesteding/huiskamers-van-de-wijk/"
  },
  {
    name: "Livio - Huiskamer van de Wijk De Hatteler",
    description: "Wijkhuiskamer van Livio voor thuiswonende ouderen, mede draaiend op vrijwilligers, waar bewoners kunnen binnenlopen voor gezelschap en activiteiten.",
    category: "gezelschap",
    address: "Gerard Terborghplein 1, Enschede",
    postcode: "7545 BB",
    city: "Enschede",
    source_url: "https://www.livio.nl/zorg/dagbesteding/huiskamers-van-de-wijk/"
  },
  {
    name: "Buurthuis BEIEN",
    description: "Buurthuis in Enschede-Noord dat vrijwilligers zoekt om avondactiviteiten zoals bingo te ondersteunen en ontmoetingsgroepen voor (oudere) buurtbewoners te begeleiden.",
    category: "bingo",
    address: "Meeuwenstraat 160, Enschede",
    postcode: "7523 XZ",
    city: "Enschede",
    source_url: "https://www.beien.nl/"
  },
  {
    name: "Stroinkshuis - Ouderensoos Het Stroink Bingo",
    description: "Wekelijkse bingomiddag voor vijftigplussers in wijkcentrum Stroinkshuis, elke woensdag, gedraaid met hulp van vrijwilligers van het buurthuis.",
    category: "bingo",
    address: "Het Stroink 64, Enschede",
    postcode: "7542 GT",
    city: "Enschede",
    source_url: "https://www.stroinkshuis.nl/huisgenoten-en-huurders/84/ouderensoos-het-stroink-bingo"
  },
  {
    name: "Stichting Present Enschede - Sociale activiteit",
    description: "Vrijwilligersmakelaar die groepen koppelt aan eenzame ouderen voor een gezellige activiteit zoals theedrinken, muziek maken of een creatieve middag bij een zorginstelling.",
    category: "anders",
    address: "Deurningerstraat 12, Enschede",
    postcode: "7514 BH",
    city: "Enschede",
    source_url: "https://stichtingpresent.nl/enschede/wat-wil-jij-doen/sociale-activiteit/"
  },

  // Almelo
  {
    name: "De Zonnebloem, afdeling Almelo-Schelfhorst",
    description: "Vrijwilligers brengen huisbezoeken aan ouderen en mensen met een lichamelijke beperking voor gezelschap, een kopje koffie of om samen op stap te gaan.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Almelo",
    source_url: "https://www.zonnebloem.nl/almelo-schelfhorst"
  },
  {
    name: "Avedan - Ontmoetingscafé wijkcentrum De Schelf",
    description: "Elke eerste vrijdag van de maand een gratis inloop met koffie en thee in wijkcentrum De Schelf; Avedan zoekt vrijwilligers die bezoekers stimuleren om mee te doen en contact te maken.",
    category: "koffie",
    address: "Binnenhof 51, Almelo",
    postcode: "7608 KH",
    city: "Almelo",
    source_url: "https://www.avedan.nl/activiteit/voor-bijna-al-uw-vragen-de-inloop-schelfhorst/"
  },
  {
    name: "Ouderen Vereniging Almelo (OVA)",
    description: "Vrijwilligers organiseren en begeleiden ontmoetingsactiviteiten voor senioren zoals excursies, lezingen, wandelingen en gezellige bijeenkomsten.",
    category: "anders",
    address: "Mooie Vrouwenweg 27, Almelo",
    postcode: "7603 PA",
    city: "Almelo",
    source_url: "https://ouderenverenigingalmelo.nl/contact/"
  },
  {
    name: "TriviumMeulenbeltZorg - De Greven",
    description: "Vrijwilligers helpen bewoners van zorgcomplex De Greven bij welzijnsactiviteiten zoals spelletjes, wandelen en koffie schenken, en houden hen gezelschap.",
    category: "spelletjes",
    address: "Groene Bruglaan 5, Almelo",
    postcode: "7602 RE",
    city: "Almelo",
    source_url: "https://www.triviummeulenbeltzorg.nl/locaties/de-greven.html"
  },
  {
    name: "Thuisgenoten - De Löchte",
    description: "Vrijwilligers bieden ondersteuning en gezelschap aan bewoners met (beginnende) dementie bij het ontbijt en bij het koffie- en theeschenken.",
    category: "koffie",
    address: "Markgravenweg 1, Almelo",
    postcode: "7603 NP",
    city: "Almelo",
    source_url: "https://www.thuisgenoten.nl/wonen/onze-woonzorglocaties/de-lochte-almelo/"
  },
  {
    name: "ZorgAccent Dagbesteding De Koppel - vrijwilliger gastheer/gastvrouw",
    description: "Vrijwilliger maakt gemakkelijk contact met ouderen met geheugenproblemen of dementie die de dagbesteding bezoeken, is gastvrij en biedt een luisterend oor.",
    category: "gezelschap",
    address: "Brouwerijstraat 1, Almelo",
    postcode: "7601 BK",
    city: "Almelo",
    source_url: "https://www.zorgaccent.nl/vrijwilliger-gastheer-gastvrouw-worden-in-de-koppel-almelo/"
  },
  {
    name: "Stichting Almelo Doet Mee - vrijwilliger activiteiten/bingo",
    description: "Vrijwilligers voeren gesprekken met Almeloërs met weinig middelen (veel ouderen) en helpen hen via vouchers deelnemen aan sociale activiteiten zoals bingo, koorzang of schilderen.",
    category: "bingo",
    address: "Zwanenbelt 39, Almelo",
    postcode: "7607 JW",
    city: "Almelo",
    source_url: "https://almelodoetmee.nl/vrijwilligers/"
  },

  // Hengelo
  {
    name: "Wijkracht Hulpdienst Hengelo - Bezoekdienst tegen eenzaamheid",
    description: "Vrijwilligers bezoeken mensen thuis voor gezelligheid, een praatje, spelletjes of een wandeling, specifiek gericht tegen eenzaamheid.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Hengelo",
    source_url: "https://wijkrachtvrijwilligerswerk.nl/vacatures/vrijwilligers-met-een-warm-hart-gezocht-voor-onze-verschillende-bezoekdiensten"
  },
  {
    name: "Stichting Aandacht voor Elkaar",
    description: "Organiseert in het Marnixhoes ontspanningsmiddagen, lunches en bingomiddagen voor ouderen en mensen met een lichamelijke beperking om eenzaamheid te verminderen, en zoekt hiervoor vrijwilligers.",
    category: "bingo",
    address: "Marnixstraat 1, Hengelo",
    postcode: null,
    city: "Hengelo",
    source_url: "https://www.informatiewijzerhengelo.nl/onderwerp/eenzaamheid-ouderen"
  },
  {
    name: "De Zonnebloem, regio Hengelo",
    description: "Circa 150 vrijwilligers verdeeld over zes sub-afdelingen bezoeken mensen die door ziekte, handicap of leeftijd dreigen te vereenzamen en ondernemen samen activiteiten.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Hengelo",
    source_url: "https://www.zonnebloem.nl/regio-hengelo"
  },
  {
    name: "Koffieochtend Wijkcentrum Slangenbeek",
    description: "Elke maandagochtend van 10.00 tot 11.00 uur kunnen ouderen uit de wijk Slangenbeek samen koffiedrinken in het wijkcentrum, mede door Wijkracht georganiseerd.",
    category: "koffie",
    address: "Straatsburg 5, Hengelo",
    postcode: "7559 NM",
    city: "Hengelo",
    source_url: "https://wijkrachthengelo.nl/slangenbeek/organisaties/10538/wijkcentrum-slangenbeek/agenda?doelgroepen=senioren"
  },
  {
    name: "Wijkcentrum De Sterrentuin - ontmoetingsgroep",
    description: "Elke dinsdagmiddag een ontmoetingsgroep met koffie/thee en creatieve activiteiten, plus samen koken en eten, gericht op ontmoeting van (oudere) buurtbewoners.",
    category: "koffie",
    address: "Neptunusstraat 51, Hengelo",
    postcode: null,
    city: "Hengelo",
    source_url: "https://www.wijkrachthengelo.nl/ouderen/wijkhuyzen-hengelo/wijkcentrum-de-sterrentuin"
  },
  {
    name: "Parochie De Goede Herder Hengelo - bezoekdienst",
    description: "Vrijwilligers van de vijf geloofsgemeenschappen van deze parochie bezoeken zieke of eenzame ouderen die daar behoefte aan hebben.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Hengelo",
    source_url: "https://www.degoedeherderhengelo.nl/senioren/"
  },

  // Oldenzaal
  {
    name: "Koffie Club Oldenzaal",
    description: "Jonge vrijwilligers gaan wekelijks in tweetallen op huisbezoek bij oudere Oldenzalers voor een kopje koffie, een praatje, een wandeling of een kaartspel.",
    category: "koffie",
    address: null,
    postcode: null,
    city: "Oldenzaal",
    source_url: "https://koffiecluboldenzaal.nl/"
  },
  {
    name: "De Zonnebloem, afdeling Oldenzaal",
    description: "Vrijwilligers brengen huisbezoeken aan mensen met een lichamelijke beperking (waaronder ouderen) en organiseren activiteiten zoals bingo, uitstapjes en feestmiddagen.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Oldenzaal",
    source_url: "https://www.zonnebloem.nl/oldenzaal"
  },
  {
    name: "Inloopcafé Le Sourire (KBO Oldenzaal)",
    description: "Elke eerste vrijdag van de maand een inloopcafé bij Brasserie Le Sourire, waar senioren (lid of geen lid) onder het genot van een drankje gezellig kunnen keuvelen.",
    category: "koffie",
    address: "Groote Markt 11, Oldenzaal",
    postcode: "7571 EC",
    city: "Oldenzaal",
    source_url: "https://oldenzaal.kbo-overijssel.nl/activiteiten/inloopcafe-2/"
  },
  {
    name: "Inloopcentrum Kerkstraat - Parochie H. Plechelmus",
    description: "Vrijwilligers houden het inloopcentrum op maandag- en vrijdagmiddag open, waar iedereen (ook ouderen) vrij binnen kan lopen voor een kopje koffie en een praatje.",
    category: "koffie",
    address: "Kerkstraat 1, Oldenzaal",
    postcode: "7571 EE",
    city: "Oldenzaal",
    source_url: "https://www.plechelmus-parochie.nl/openingstijden-inloopcentrum-kerkstraat-oldenzaal/"
  },
  {
    name: "Pastoraal steunpunt Emmaus - Parochie H. Plechelmus",
    description: "Het Emmaushuis is op donderdag- en vrijdagochtend open voor een kopje koffie of thee en een praatje, gedraaid door vrijwilligers van de parochie.",
    category: "koffie",
    address: "Willem Dingeldeinstraat 37, Oldenzaal",
    postcode: "7576 TS",
    city: "Oldenzaal",
    source_url: "https://www.plechelmus-parochie.nl/kerken-in-de-parochie/steunpunt-emmaus/"
  },

  // Rijssen
  {
    name: "De Zonnebloem, afdeling Rijssen",
    description: "Vrijwilligers bezoeken mensen met een lichamelijke beperking of ziekte (vaak ouderen) aan huis voor gezelschap, een kopje koffie of een uitje zoals wandelen of museumbezoek.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Rijssen",
    source_url: "https://www.zonnebloem.nl/rijssen"
  },
  {
    name: "Telefooncirkel - ViaVie Welzijn Rijssen-Holten",
    description: "Vrijwilligers bellen van maandag t/m zaterdag tussen 8.00 en 9.00 uur mensen die alleen wonen voor een kort, dagelijks controle- en contactmoment tegen eenzaamheid.",
    category: "anders",
    address: "Rozengaarde 75A, Rijssen",
    postcode: "7461 DA",
    city: "Rijssen",
    source_url: "https://www.socialekaartrijssen-holten.nl/is/product/146024/197269/invis2/telefooncirkel"
  },
  {
    name: "Via Vorsa - Servicepunt Vrijwilligers",
    description: "Vrijwilligerscentrale voor Rijssen-Holten die vrijwilligers koppelt aan lokale organisaties, waaronder maatjesprojecten en bezoekwerk bij ouderen.",
    category: "anders",
    address: "Rozengaarde 75A, Rijssen",
    postcode: "7461 DA",
    city: "Rijssen",
    source_url: "https://viavorsa.nl/vacatures/vrijwilliger-bij-de-zonnebloem-afdeling-rijssen"
  },

  // Wierden
  {
    name: "De Zonnebloem, afdeling Wierden",
    description: "Circa 40 vrijwilligers doen bezoekwerk bij ouderen en mensen met een beperking, waaronder samen koffiedrinken, een praatje of een uitje.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Wierden",
    source_url: "https://www.zonnebloem.nl/wierden"
  },
  {
    name: "Ouderenvereniging Wierden - Kaarten en Bingo",
    description: "In het Ontmoetingscentrum wordt elke vrijdagmiddag gekaart en elke tweede woensdag van de maand bingo gespeeld voor senioren; de vereniging draait op vrijwillige inzet.",
    category: "bingo",
    address: "Spoorstraat 7, Wierden",
    postcode: null,
    city: "Wierden",
    source_url: "https://www.socialekaartwierden.nl/is/product/154267/220494/invis2/kaarten-en-bingo-sport-voor-senioren"
  },
  {
    name: "WierdenDoet! (Stichting De Welle)",
    description: "Centraal vrijwilligerspunt voor gemeente Wierden dat inwoners koppelt aan vrijwilligersvacatures, waaronder gezelschap en ondersteuning voor ouderen.",
    category: "anders",
    address: null,
    postcode: null,
    city: "Wierden",
    source_url: "https://www.stichtingdewelle.nl/vrijwilligerspunt/wierdendoet/"
  },

  // Goor
  {
    name: "De Zonnebloem, afdeling Goor/Markelo/Diepenheim",
    description: "Circa 45 vrijwilligers bezoeken mensen die door ziekte, handicap of beperking in een sociaal isolement dreigen te raken, via huisbezoeken en 1-op-1 uitjes.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Goor",
    source_url: "https://www.zonnebloem.nl/goor-markelo-diepenheim"
  },
  {
    name: "Salut Welzijn - Luisterend oor",
    description: "Welzijnsorganisatie voor Hof van Twente die vrijwilligers koppelt aan eenzame ouderen, bijvoorbeeld voor tweewekelijks bezoek met koffie en een gesprek.",
    category: "koffie",
    address: "Grotestraat 86, Goor",
    postcode: "7471 BR",
    city: "Goor",
    source_url: "https://salut-welzijn.nl/luisterend-oor/"
  },

  // Haaksbergen
  {
    name: "Wijkracht Haaksbergen - Ouderenwerk en vrijwilligerswerk",
    description: "Signaleert eenzaamheid bij ouderen in Haaksbergen en koppelt hen aan vrijwilligers; via het servicepunt vrijwilligerswerk kunnen inwoners zich aanmelden als maatje of begeleider.",
    category: "gezelschap",
    address: "Blankenburgerstraat 28, Haaksbergen",
    postcode: "7481 EB",
    city: "Haaksbergen",
    source_url: "https://www.wijkrachthaaksbergen.nl/noaberpoort"
  },
  {
    name: "De Zonnebloem, afdeling Haaksbergen",
    description: "Vrijwilligers leggen huisbezoeken af bij ouderen en mensen met een lichamelijke beperking voor een kop koffie of een uitstapje.",
    category: "koffie",
    address: null,
    postcode: null,
    city: "Haaksbergen",
    source_url: "https://www.zonnebloem.nl/haaksbergen"
  },

  // Borne
  {
    name: "De Zonnebloem, afdeling Borne",
    description: "Bezoekt regelmatig ouderen en mensen met een fysieke beperking voor een goed gesprek, gaat individueel met hen op pad en organiseert gezamenlijke uitstapjes.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Borne",
    source_url: "https://www.zonnebloem.nl/borne"
  },

  // Delden
  {
    name: "De Zonnebloem, afdeling Delden-Ambt en Stad",
    description: "Vrijwilligers bezoeken ouderen en mensen met een lichamelijke beperking in Delden, schenken koffie en thee tijdens activiteiten en helpen mee bij het organiseren van uitjes.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Delden",
    source_url: "https://www.zonnebloem.nl/delden"
  },
  {
    name: "Stichting Franje - Dagontmoeting 't Kruispunt",
    description: "Op de 1e en 3e donderdag van de maand een dagontmoeting met koffie en activiteiten voor ouderen, begeleid door vrijwilligers, om eenzaamheid en isolement te voorkomen.",
    category: "koffie",
    address: null,
    postcode: null,
    city: "Delden",
    source_url: "https://www.franje.nl/nieuws-en-activiteiten/kruispunt-naar-lancomode-delden~QZ7Am4tU/"
  },
  {
    name: "Noaberhoes Delden - Eten doe je samen",
    description: "Wekelijks op maandag organiseren Stichting Franje en v.v. Rood Zwart een gezamenlijke maaltijd voor senioren en alleenstaanden; vrijwilligers doen de inkopen, bereiden en serveren.",
    category: "anders",
    address: "Langestraat 155, Delden",
    postcode: "7491 AE",
    city: "Delden",
    source_url: "https://roodzwart.nl/nieuw-wekelijks-eetfestijn-in-het-noaberhoes-in-delden/"
  },

  // Ootmarsum
  {
    name: "Zonnebloem, afdeling Ootmarsum",
    description: "Coördineert al meer dan 55 jaar bezoekwerk bij ouderen en mensen met een beperking in Ootmarsum; bezoeksters leggen huisbezoekjes af en organiseren ontspanningsmiddagen.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Ootmarsum",
    source_url: "https://www.inenomootmarsum.nl/zonnebloem-ootmarsum-55-jaar/"
  },
  {
    name: "Vrijwilliger bij Huize den Oostenborgh",
    description: "Zorgvilla Huize den Oostenborgh zoekt vrijwilligers die bewoners gezelschap houden, gesprekken voeren en meegaan met uitstapjes, wandelingen of concertbezoeken.",
    category: "gezelschap",
    address: "Putstraat 7, Ootmarsum",
    postcode: "7631 GB",
    city: "Ootmarsum",
    source_url: "https://vrijwilligindebuurt.nl/vacatures/vrijwilliger-bij-huize-den-oostenborgh-in-ootmarsum"
  },
  {
    name: "Koffie Club Ootmarsum",
    description: "Jonge vrijwilligers bezoeken ouderen thuis voor een gezellig koffiemoment, en organiseren elk kwartaal een gezamenlijke activiteit zoals een high tea of een uitje. Geïnspireerd op Koffie Club Oldenzaal.",
    category: "koffie",
    address: null,
    postcode: null,
    city: "Ootmarsum",
    source_url: "https://koffieclubootmarsum.nl/"
  },

  // Vriezenveen
  {
    name: "Zonnebloem, afdeling Vriezenveen/Aadorp/Westerhaar",
    description: "Vrijwilligers doen bezoekwerk aan huis en gaan mee met deelnemers naar activiteiten, van koffie op het terras tot een excursie, om isolement bij mensen met een beperking te voorkomen.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Vriezenveen",
    source_url: "https://www.zonnebloem.nl/vriezenveen-aadorp-westerhaar/vacatures"
  },
  {
    name: "Vrijwilliger huiskamerondersteuning De Weemelanden",
    description: "Verpleeghuis De Weemelanden zoekt vrijwilligers die in avonden en/of weekenden ondersteuning bieden in de gemeenschappelijke huiskamers van bewoners.",
    category: "koffie",
    address: "Koningsweg 24, Vriezenveen",
    postcode: "7672 GD",
    city: "Vriezenveen",
    source_url: "https://www.vrijwilligerswerktwenterand.nl/categorie/gezelschapbezoek"
  },
  {
    name: "Vrijwilliger activiteitenondersteuning De Vriezenhof",
    description: "Woon- en zorgcentrum De Vriezenhof zoekt vrijwilligers voor ondersteuning bij activiteiten voor bewoners en wijkbewoners, zoals bingo, koffiedrinken en gezellige middagen met optredens.",
    category: "bingo",
    address: "Jonkerlaan 5, Vriezenveen",
    postcode: "7671 GM",
    city: "Vriezenveen",
    source_url: "https://www.vrijwilligerswerktwenterand.nl/vacature/gezelschapbezoek/477"
  },

  // Weerselo
  {
    name: "Zonnebloem, afdeling Weerselo",
    description: "Zet zich in voor mensen met een lichamelijke beperking vanaf 18 jaar; vrijwilligers komen langs voor een kop koffie of gaan samen op pad en organiseren activiteiten.",
    category: "koffie",
    address: null,
    postcode: null,
    city: "Weerselo",
    source_url: "https://www.zonnebloem.nl/weerselo"
  },
  {
    name: "Vrijwilligerswerk Woonzorgcentrum Sint Jozef Weerselo",
    description: "Biedt ontspanningsavonden/-middagen met o.a. koor, muziek, dans, toneel of bingo, waarbij vrijwilligers hun talenten inzetten voor bewoners en buurtbewoners.",
    category: "bingo",
    address: null,
    postcode: null,
    city: "Weerselo",
    source_url: "https://www.zorggroepsintmaarten.nl/gemeenschap/dinkelland-tubbergen/sint-jozef-in-weerselo/vrijwilligers/"
  },

  // Losser
  {
    name: "Zonnebloem, afdeling Losser-Overdinkel",
    description: "Vrijwilligers brengen huisbezoeken en organiseren activiteiten voor mensen met een lichamelijke beperking of mobiliteitsbeperking, vaak ouderen, die daardoor sociaal geïsoleerd kunnen raken.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Losser",
    source_url: "https://hallolosser.nl/nieuws/2025/vrijwilligers-zonnebloem-losser-overdinkel-in-het-zonnetje-gezet/"
  },

  // Tubbergen
  {
    name: "SWTD Open eettafel Tubbergen",
    description: "Stichting Welzijn Tubbergen Dinkelland organiseert een open eettafel waar ouderen een driegangenmaaltijd krijgen en de tijd hebben om een praatje te maken; vrijwillige gastheren/gastvrouwen dekken de tafel en serveren.",
    category: "anders",
    address: null,
    postcode: null,
    city: "Tubbergen",
    source_url: "https://swtd.nl/agenda/open-eettafel-tubbergen/"
  },
  {
    name: "KBO Tubbergen",
    description: "Lokale afdeling van de seniorenvereniging KBO Overijssel die ontmoetings- en ledenactiviteiten voor ouderen organiseert; wie wil helpen bij het organiseren en begeleiden kan contact zoeken met de afdeling.",
    category: "anders",
    address: "Viool 8, Tubbergen",
    postcode: "7651 HH",
    city: "Tubbergen",
    source_url: "https://tubbergen.kbo-overijssel.nl/activiteiten/"
  },

  // Denekamp
  {
    name: "SWTD Open eettafel Denekamp - Gerardus Majella",
    description: "SWTD organiseert samen met de keuken van Aveleijn-Denekamp wekelijks een open eettafel bij wooncomplex Gerardus Majella, met een driegangenmaaltijd en tijd om bij te praten; vrijwillige gastvrouwen/gastheren dekken de tafel en serveren.",
    category: "anders",
    address: "Berghumerstraat 15, Denekamp",
    postcode: "7591 GX",
    city: "Denekamp",
    source_url: "https://swtd.nl/agenda/open-eettafel-denekamp-gerardus-majella/"
  },
  {
    name: "Vrijwilliger bij Zorggroep Sint Maarten Denekamp",
    description: "Zorggroep Sint Maarten zoekt vrijwilligers voor de woonzorgcentra Gerardus Majella en Gravenstate in Denekamp, die hun tijd inzetten voor gezelschap en activiteiten met de bewoners.",
    category: "gezelschap",
    address: null,
    postcode: null,
    city: "Denekamp",
    source_url: "https://www.zorggroepsintmaarten.nl/vrijwilligers/waar/maak-jij-het-verschil-als-vrijwilliger-bij-zorggroep-sint-maarten-in-denekamp/"
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
