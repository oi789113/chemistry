const weights: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Mn: 54.938,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Ag: 107.868,
  Ba: 137.327,
}

/** Parse school-level molecular formulae, including nested parentheses. */
export function parseFormula(formula: string): Record<string, number> {
  const tokens = formula.match(/[A-Z][a-z]?|\d+|[()]/g) ?? []
  if (tokens.join('') !== formula) throw new Error(`无法解析化学式：${formula}`)
  let i = 0
  function group(nested = false): Record<string, number> {
    const atoms: Record<string, number> = {}
    while (i < tokens.length && tokens[i] !== ')') {
      const token = tokens[i++]
      let part: Record<string, number>
      if (token === '(') {
        part = group(true)
        if (tokens[i++] !== ')') throw new Error('括号不匹配')
      } else {
        if (!(token in weights)) throw new Error(`未知元素：${token}`)
        part = { [token]: 1 }
      }
      const factor = /^\d+$/.test(tokens[i] ?? '') ? Number(tokens[i++]) : 1
      for (const [atom, count] of Object.entries(part))
        atoms[atom] = (atoms[atom] ?? 0) + count * factor
    }
    if (!nested && i !== tokens.length) throw new Error('括号不匹配')
    return atoms
  }
  return group()
}
export function molarMass(atoms: Record<string, number>): number {
  return Object.entries(atoms).reduce((mass, [atom, n]) => mass + weights[atom] * n, 0)
}
export function displayFormula(value: string): string {
  return value.replace(/\d/g, (n) => '₀₁₂₃₄₅₆₇₈₉'[Number(n)])
}
