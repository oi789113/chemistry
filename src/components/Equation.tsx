import type { Reaction } from '../chemistry/types';
import { substanceById as db } from '../data/substances';
export function Formula({ value }: { value: string }) {
  return (
    <span className="formula">
      {value.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : p))}
    </span>
  );
}
export function Equation({
  reaction: r,
  compact = false,
}: {
  reaction: Reaction;
  compact?: boolean;
}) {
  const side = (terms: Reaction['reactants'], product = false) =>
    terms.map((term, i) => (
      <span key={term.id} className="equation-term">
        {i > 0 && <span className="equation-plus"> + </span>}
        {term.coefficient !== 1 && term.coefficient}
        <Formula value={db[term.id].formula} />
        {product && term.phase === 'g' && '↑'}
        {product && term.phase === 's' && r.effect === 'precipitate' && '↓'}
      </span>
    ));
  return (
    <div className={`equation ${compact ? 'compact' : ''}`}>
      <span>{side(r.reactants)}</span>
      <span className="reaction-arrow">
        <small>{r.catalyst ? 'MnO₂' : r.minTemp ? '△' : r.ignition ? '点燃' : ''}</small>
        <span>⟶</span>
      </span>
      <span>{side(r.products, true)}</span>
    </div>
  );
}
