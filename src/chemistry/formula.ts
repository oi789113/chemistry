const atomicMass: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  S: 32.06,
  P: 30.974,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Mn: 54.938,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Ag: 107.868,
  Ba: 137.327,
};
/** Parse formulae with nested parentheses. Hydrates use a middle dot, e.g. CuSO4·5H2O. */
export function atoms(formula: string): Record<string, number> {
  const total: Record<string, number> = {};
  for (const part of formula.split('·')) {
    const lead = part.match(/^(\d+)(?=[A-Z])/);
    const multiplier = lead ? Number(lead[1]) : 1;
    const tokens = part.slice(lead?.[1].length ?? 0).match(/[A-Z][a-z]?|\d+|[()]/g) ?? [];
    if (tokens.join('') !== part.slice(lead?.[1].length ?? 0))
      throw new Error(`Invalid formula: ${formula}`);
    const stack: Record<string, number>[] = [{}];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === '(') stack.push({});
      else if (t === ')') {
        if (stack.length < 2) throw new Error('Unbalanced parentheses');
        const group = stack.pop()!;
        const n = /^\d+$/.test(tokens[i + 1] ?? '') ? Number(tokens[++i]) : 1;
        for (const [a, count] of Object.entries(group))
          stack[stack.length - 1][a] = (stack[stack.length - 1][a] ?? 0) + n * count;
      } else if (/^[A-Z]/.test(t) && atomicMass[t]) {
        const n = /^\d+$/.test(tokens[i + 1] ?? '') ? Number(tokens[++i]) : 1;
        stack[stack.length - 1][t] = (stack[stack.length - 1][t] ?? 0) + n;
      } else throw new Error(`Unknown element or token ${t}`);
    }
    if (stack.length !== 1) throw new Error('Unbalanced parentheses');
    for (const [a, count] of Object.entries(stack[0]))
      total[a] = (total[a] ?? 0) + count * multiplier;
  }
  if (!Object.keys(total).length) throw new Error('Empty formula');
  return total;
}
export function molarMass(formula: string) {
  return Object.entries(atoms(formula)).reduce((n, [a, c]) => n + atomicMass[a] * c, 0);
}
export function prettyFormula(formula: string) {
  return formula.replace(/\d/g, (n) => '₀₁₂₃₄₅₆₇₈₉'[Number(n)]);
}
