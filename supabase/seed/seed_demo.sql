-- Optional demo data so the prototype has something to show before the
-- scraper (scripts/scrape-initiatives.mjs) has been run. Coordinates are
-- real (Enschede/Twente area, near demo postcode 7512XB) but the
-- initiatives themselves are fictional placeholders, replace with real
-- scraped data before showing this to a client.
insert into public.initiatives
  (name, description, category, address, postcode, city, latitude, longitude, source_url)
values
  ('Samen Koffie Twente', 'Wekelijks koffie-uurtje voor ouderen in de buurt, met vrijwilligers die langskomen voor een praatje.', 'koffie', 'Oude Markt 1', '7511GB', 'Enschede', 52.2215, 6.8937, null),
  ('Bingomiddag De Vlinder', 'Maandelijkse bingoavond speciaal voor senioren, inclusief gratis kopje koffie en gebak.', 'bingo', 'Boddenkampsingel 40', '7514AN', 'Enschede', 52.2088, 6.9048, null),
  ('Maatjesproject Ouderenzorg Overijssel', 'Vrijwilligers die op bezoek gaan bij eenzame ouderen voor gezelschap en een luisterend oor.', 'gezelschap', 'Van Heekplein 2', '7511CA', 'Enschede', 52.2224, 6.8925, null),
  ('Spelletjesmiddag Buurthuis De Ring', 'Elke woensdag sjoelen, kaarten en rummikub voor 65-plussers uit de wijk.', 'spelletjes', 'Ripperdastraat 15', '7513DH', 'Enschede', 52.2334, 6.8791, null),
  ('Wandelclub Gezellig Ouder Worden', 'Korte, rustige wandelingen met aansluitend koffie, voor ouderen die graag onder de mensen zijn.', 'anders', 'Lasondersingel 10', '7514JA', 'Enschede', 52.2170, 6.9052, null);
