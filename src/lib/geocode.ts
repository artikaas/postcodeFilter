// Geocoding via de PDOK Locatieserver (Kadaster), gratis, geen API-key nodig.
// Docs: https://www.pdok.nl/restful-api/-/article/pdok-locatieserver

const PDOK_FREE_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

/** "7512 xb" / "7512xb" -> "7512XB" */
export function normalizePostcode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

export function isValidDutchPostcode(input: string): boolean {
  return /^[1-9][0-9]{3}[A-Z]{2}$/.test(normalizePostcode(input));
}

interface PdokDoc {
  weergavenaam: string;
  centroide_ll: string; // "POINT(lon lat)"
}

interface PdokResponse {
  response: {
    docs: PdokDoc[];
  };
}

/**
 * Zoekt een Nederlandse postcode op en geeft de coördinaten terug.
 * Geeft `null` terug als de postcode niet gevonden kan worden.
 */
export async function geocodePostcode(
  rawPostcode: string
): Promise<GeocodeResult | null> {
  const postcode = normalizePostcode(rawPostcode);
  if (!isValidDutchPostcode(postcode)) {
    throw new Error('Voer een geldige Nederlandse postcode in, bijv. 7512XB.');
  }

  const url = new URL(PDOK_FREE_URL);
  url.searchParams.set('q', postcode);
  url.searchParams.set('fq', 'type:postcode');
  url.searchParams.set('rows', '1');
  url.searchParams.set('fl', 'weergavenaam,centroide_ll');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`PDOK Locatieserver gaf een fout terug (${res.status}).`);
  }

  const data = (await res.json()) as PdokResponse;
  const doc = data.response.docs[0];
  if (!doc) return null;

  const match = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(doc.centroide_ll);
  if (!match) return null;

  const [, lon, lat] = match;
  return { lat: Number(lat), lng: Number(lon), label: doc.weergavenaam };
}
