import { CATEGORY_LABELS, type Initiative } from '../types/initiative';

const CATEGORY_STYLE: Record<Initiative['category'], { emoji: string; bg: string }> = {
  gezelschap: { emoji: '🤝', bg: 'linear-gradient(135deg,#ec6ea3,#6b1f3f)' },
  spelletjes: { emoji: '🎲', bg: 'linear-gradient(135deg,#f5a83c,#c96a1e)' },
  koffie: { emoji: '☕', bg: 'linear-gradient(135deg,#a9764f,#6b1f3f)' },
  bingo: { emoji: '🎱', bg: 'linear-gradient(135deg,#3f6b4f,#264a33)' },
  anders: { emoji: '⭐', bg: 'linear-gradient(135deg,#cbb08a,#8a6a44)' },
};

interface InitiativeCardProps {
  initiative: Initiative;
}

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  const style = CATEGORY_STYLE[initiative.category] ?? CATEGORY_STYLE.anders;
  const location = [initiative.city, initiative.postcode].filter(Boolean).join(' · ');

  return (
    <article className="initiative-card">
      <div className="initiative-card-image" style={{ background: style.bg }}>
        <span aria-hidden="true">{style.emoji}</span>
      </div>
      <div className="initiative-card-body">
        <div className="initiative-card-tags">
          <span className="category-tag">{CATEGORY_LABELS[initiative.category]}</span>
          {typeof initiative.distance_km === 'number' && (
            <span className="distance-tag">
              {initiative.distance_km < 1
                ? '< 1 km'
                : `${initiative.distance_km.toFixed(1)} km`}{' '}
              van jou
            </span>
          )}
        </div>
        <h3>{initiative.name}</h3>
        <p>{initiative.description}</p>
        {location && <span className="meta-line">{location}</span>}
        {initiative.source_url && (
          <a
            className="source-link"
            href={initiative.source_url}
            target="_blank"
            rel="noreferrer"
          >
            Meer informatie
          </a>
        )}
      </div>
    </article>
  );
}
