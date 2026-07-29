import type { Initiative } from '../types/initiative';
import { InitiativeCard } from './InitiativeCard';

interface ResultsSectionProps {
  initiatives: Initiative[];
  loading: boolean;
  activePostcode: string | null;
  radiusKm: number;
  onClearFilter: () => void;
}

export function ResultsSection({
  initiatives,
  loading,
  activePostcode,
  radiusKm,
  onClearFilter,
}: ResultsSectionProps) {
  return (
    <section className="results-section">
      <div className="container">
        <div className="results-meta">
          {activePostcode && (
            <span className="filter-chip">
              {activePostcode} · {radiusKm} km
              <button type="button" onClick={onClearFilter} aria-label="Filter wissen">
                ×
              </button>
            </span>
          )}
          <span className="results-count">
            <strong>{initiatives.length}</strong> resultaten voor initiatieven
          </span>
        </div>

        {loading && <p className="results-status">Initiatieven zoeken…</p>}

        {!loading && initiatives.length === 0 && (
          <p className="results-status">
            Geen initiatieven gevonden{activePostcode ? ' binnen deze straal' : ''}.
            {activePostcode && ' Probeer de zoekstraal te vergroten.'}
          </p>
        )}

        {!loading && initiatives.length > 0 && (
          <div className="results-grid">
            {initiatives.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
