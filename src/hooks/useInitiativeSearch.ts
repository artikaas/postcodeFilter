import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { geocodePostcode, normalizePostcode } from '../lib/geocode';
import type { Initiative } from '../types/initiative';

export const MIN_RADIUS_KM = 5;
export const MAX_RADIUS_KM = 20;
export const DEFAULT_RADIUS_KM = 5;

interface ActiveLocation {
  postcode: string;
  label: string;
  lat: number;
  lng: number;
}

export function useInitiativeSearch() {
  const [postcodeInput, setPostcodeInput] = useState('');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [activeLocation, setActiveLocation] = useState<ActiveLocation | null>(null);

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow, stale request overwriting a newer one.
  const requestId = useRef(0);

  const fetchAll = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from('initiatives')
      .select('*')
      .order('created_at', { ascending: false });
    if (id !== requestId.current) return;
    if (dbError) {
      setError('Initiatieven konden niet geladen worden. Probeer het later opnieuw.');
      setInitiatives([]);
    } else {
      setInitiatives(data ?? []);
    }
    setLoading(false);
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number, radius: number) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase.rpc('nearby_initiatives', {
      lat,
      lng,
      radius_km: radius,
    });
    if (id !== requestId.current) return;
    if (dbError) {
      setError('Initiatieven konden niet geladen worden. Probeer het later opnieuw.');
      setInitiatives([]);
    } else {
      setInitiatives(data ?? []);
    }
    setLoading(false);
  }, []);

  // Initial load: show everything until someone searches on postcode.
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Re-run the radius search whenever the slider moves, without re-geocoding.
  useEffect(() => {
    if (!activeLocation) return;
    fetchNearby(activeLocation.lat, activeLocation.lng, radiusKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, activeLocation]);

  const search = useCallback(async () => {
    const trimmed = postcodeInput.trim();
    if (!trimmed) {
      setActiveLocation(null);
      setRadiusKm(DEFAULT_RADIUS_KM);
      await fetchAll();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await geocodePostcode(trimmed);
      if (!result) {
        setError(`Postcode ${normalizePostcode(trimmed)} kon niet gevonden worden.`);
        setLoading(false);
        return;
      }
      setRadiusKm(DEFAULT_RADIUS_KM);
      // Setting activeLocation triggers the radius-search effect below,
      // which does the actual fetchNearby call — avoids firing it twice.
      setActiveLocation({
        postcode: normalizePostcode(trimmed),
        label: result.label,
        lat: result.lat,
        lng: result.lng,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis bij het zoeken.');
      setLoading(false);
    }
  }, [postcodeInput, fetchAll]);

  const clearSearch = useCallback(() => {
    setPostcodeInput('');
    setActiveLocation(null);
    setRadiusKm(DEFAULT_RADIUS_KM);
    fetchAll();
  }, [fetchAll]);

  return {
    postcodeInput,
    setPostcodeInput,
    radiusKm,
    setRadiusKm,
    activePostcode: activeLocation?.postcode ?? null,
    activeLocationLabel: activeLocation?.label ?? null,
    search,
    clearSearch,
    initiatives,
    loading,
    error,
  };
}
