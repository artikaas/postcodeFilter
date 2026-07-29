import type { Initiative, InitiativeCategory } from '../types/initiative';
import { CategoryFilter } from './CategoryFilter';
import { InitiativeCard } from './InitiativeCard';

interface ResultsSectionProps {
  initiatives: Initiative[];
  loading: boolean;
  activePostcode: string | null;
  radiusKm: number;
  onClearFilter: () => void;
  selectedCategories: InitiativeCategory[];
  onToggleCategory: (category: InitiativeCategory) => void;
}

export function ResultsSection({
  initiatives,
  loading,
  activePostcode,
  radiusKm,
  onClearFilter,
  selectedCategories,
  onToggleCategory,
}: ResultsSectionProps) {
  const hasCategoryFilter = selectedCategories.length > 0;

  return (
    <section className="results-section">
      <div className="container">
        <CategoryFilter selected={selectedCategories} onToggle={onToggleCategory} />

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
            {emptyResultsMessage(Boolean(activePostcode), hasCategoryFilter)}
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

function emptyResultsMessage(hasLocationFilter: boolean, hasCategoryFilter: boolean): string {
  if (hasLocationFilter && hasCategoryFilter) {
    return 'Geen initiatieven gevonden. Probeer de zoekstraal te vergroten of pas de filters aan.';
  }
  if (hasLocationFilter) {
    return 'Geen initiatieven gevonden binnen deze straal. Probeer de zoekstraal te vergroten.';
  }
  if (hasCategoryFilter) {
    return 'Geen initiatieven gevonden voor de gekozen type(s) activiteit. Pas de filters aan.';
  }
  return 'Geen initiatieven gevonden.';
}
