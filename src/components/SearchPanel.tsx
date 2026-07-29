import type { FormEvent } from 'react';
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from '../hooks/useInitiativeSearch';

interface SearchPanelProps {
  postcodeInput: string;
  onPostcodeChange: (value: string) => void;
  onSubmit: () => void;
  radiusKm: number;
  onRadiusChange: (value: number) => void;
  showRadius: boolean;
  error: string | null;
}

export function SearchPanel({
  postcodeInput,
  onPostcodeChange,
  onSubmit,
  radiusKm,
  onRadiusChange,
  showRadius,
  error,
}: SearchPanelProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="search-section">
      <div className="container">
        <div className="search-panel">
          <h2>
            Vind een initiatief
            <br />
            bij jou in de buurt
          </h2>

          <div>
            <p className="copy">
              Vul je postcode in en we laten zien welke initiatieven voor
              ouderen, zoals gezelschap, een spelletje of een kop koffie, er
              bij jou in de buurt zijn. Geen postcode? Dan zie je alle
              initiatieven.
            </p>

            <form className="search-form" onSubmit={handleSubmit}>
              <input
                type="text"
                inputMode="text"
                placeholder="Bijv. 7512XB"
                value={postcodeInput}
                onChange={(event) => onPostcodeChange(event.target.value)}
                aria-label="Postcode"
              />
              <button type="submit" className="btn-search">
                Zoeken →
              </button>
            </form>

            {error && (
              <p className="search-error" role="alert">
                {error}
              </p>
            )}

            {showRadius && (
              <div className="radius-control">
                <div className="radius-control-label">
                  <span>Zoekstraal</span>
                  <span>{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  step={1}
                  value={radiusKm}
                  onChange={(event) => onRadiusChange(Number(event.target.value))}
                  aria-label="Zoekstraal in kilometers"
                />
                <div className="radius-scale">
                  <span>{MIN_RADIUS_KM} km</span>
                  <span>{MAX_RADIUS_KM} km</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
