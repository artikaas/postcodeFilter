-- Zelf Zorgen, Samen Doen, "In jouw buurt" postcode filter
-- Prototype schema: elderly-care/companionship initiatives + a haversine-based
-- radius search function. No PostGIS/earthdistance extension required, so this
-- runs on any Supabase project (including the free tier) without extra setup.

create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null default 'anders'
    check (category in ('gezelschap', 'spelletjes', 'koffie', 'bingo', 'anders')),
  address text,
  postcode text,
  city text,
  latitude double precision not null,
  longitude double precision not null,
  source_url text,
  image_url text,
  created_at timestamptz not null default now(),
  -- Lets the scraper script upsert on (name, city) so re-running it doesn't
  -- create duplicate entries for the same initiative.
  constraint initiatives_name_city_key unique (name, city)
);

comment on table public.initiatives is
  'Zorginitiatieven gericht op ouderen (gezelschap, spelletjes, koffie, bingo, etc.). '
  'Gevuld via scripts/scrape-initiatives.mjs of handmatig.';

create index if not exists initiatives_lat_lng_idx
  on public.initiatives (latitude, longitude);

create index if not exists initiatives_category_idx
  on public.initiatives (category);

-- Row Level Security: this is public, read-only directory data for a
-- prototype. Anonymous users may read; writes go through the service role
-- key only (used by the scraper script), never the anon key.
alter table public.initiatives enable row level security;

drop policy if exists "Public read access" on public.initiatives;
create policy "Public read access"
  on public.initiatives
  for select
  to anon, authenticated
  using (true);

-- Haversine distance search. Returns every initiative within radius_km of
-- (lat, lng), nearest first, with the computed distance attached.
create or replace function public.nearby_initiatives(
  lat double precision,
  lng double precision,
  radius_km double precision
)
returns table (
  id uuid,
  name text,
  description text,
  category text,
  address text,
  postcode text,
  city text,
  latitude double precision,
  longitude double precision,
  source_url text,
  image_url text,
  created_at timestamptz,
  distance_km double precision
)
language sql
stable
as $$
  select
    i.id,
    i.name,
    i.description,
    i.category,
    i.address,
    i.postcode,
    i.city,
    i.latitude,
    i.longitude,
    i.source_url,
    i.image_url,
    i.created_at,
    6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(lat)) * cos(radians(i.latitude)) *
        cos(radians(i.longitude) - radians(lng)) +
        sin(radians(lat)) * sin(radians(i.latitude))
      ))
    ) as distance_km
  from public.initiatives i
  where 6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(lat)) * cos(radians(i.latitude)) *
        cos(radians(i.longitude) - radians(lng)) +
        sin(radians(lat)) * sin(radians(i.latitude))
      ))
    ) <= radius_km
  order by distance_km asc;
$$;

grant execute on function public.nearby_initiatives(double precision, double precision, double precision)
  to anon, authenticated;
