import { FORMATS } from '../converters';
import type { FormatId } from '../converters/types';
import type { ConversionRoute } from '../converters/types';

interface FormatSelectorProps {
  sourceLabel: string;
  routes: ConversionRoute[];
  selected: FormatId | null;
  onSelect: (target: FormatId) => void;
}

export default function FormatSelector({
  sourceLabel,
  routes,
  selected,
  onSelect,
}: FormatSelectorProps) {
  if (!routes.length) {
    return (
      <p className="muted">
        No conversions are available for <strong>{sourceLabel}</strong> files.
      </p>
    );
  }

  return (
    <div className="formats">
      <div className="formats__from">
        Convert <strong>{sourceLabel}</strong> to:
      </div>
      <div className="formats__grid" role="radiogroup" aria-label="Target format">
        {routes.map((route) => {
          const meta = FORMATS[route.target];
          const active = selected === route.target;
          return (
            <button
              key={route.target}
              type="button"
              role="radio"
              aria-checked={active}
              className={`format-chip${active ? ' format-chip--active' : ''}`}
              onClick={() => onSelect(route.target)}
            >
              <span className="format-chip__label">{meta.label}</span>
              <span className="format-chip__desc">{meta.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
