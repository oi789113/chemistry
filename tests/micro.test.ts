import { describe, it, expect } from 'vitest';
import { microModels, microBonds } from '../src/chemistry/micro';
import type { MicroUnit } from '../src/chemistry/micro';
import { atoms } from '../src/chemistry/formula';
import { reactions } from '../src/data/reactions';
describe('microscopic educational models', () => {
  for (const r of reactions)
    it(`${r.id}: balances atoms and electric charge in the net model`, () => {
      const m = microModels[r.id];
      expect(m).toBeDefined();
      const elements = (units: MicroUnit[]) =>
        units.reduce<Record<string, number>>((out, u) => {
          for (const [a, n] of Object.entries(atoms(u.formula)))
            out[a] = (out[a] ?? 0) + n * u.count;
          return out;
        }, {});
      const charge = (units: MicroUnit[]) => units.reduce((q, u) => q + u.count * u.charge, 0);
      expect(elements(m.before)).toEqual(elements(m.after));
      expect(charge(m.before)).toBe(charge(m.after));
    });
});

for (const formula of ['H2O', 'H2O2', 'O2', 'CO2'])
  it(`${formula} displays chemically valid covalent valences`, () => {
    const sequence = Object.entries(atoms(formula)).flatMap(([a, n]) =>
      Array.from({ length: n }, () => a),
    );
    const degrees = sequence.map(() => 0);
    for (const [a, b, order] of microBonds[formula]) {
      degrees[a] += order;
      degrees[b] += order;
    }
    sequence.forEach((a, i) => expect(degrees[i]).toBe(a === 'H' ? 1 : a === 'C' ? 4 : 2));
  });
