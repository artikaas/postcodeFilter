import { CATEGORY_LABELS, type InitiativeCategory } from '../types/initiative';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as InitiativeCategory[];

interface CategoryFilterProps {
  selected: InitiativeCategory[];
  onToggle: (category: InitiativeCategory) => void;
}

export function CategoryFilter({ selected, onToggle }: CategoryFilterProps) {
  return (
    <div className="category-filter" role="group" aria-label="Filter op type activiteit">
      {ALL_CATEGORIES.map((category) => {
        const active = selected.includes(category);
        return (
          <button
            key={category}
            type="button"
            className={`category-filter-chip${active ? ' active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(category)}
          >
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
