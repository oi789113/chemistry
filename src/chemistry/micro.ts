export interface MicroUnit {
  formula: string;
  label: string;
  kind: 'molecule' | 'ion' | 'lattice' | 'atom';
  count: number;
  charge: number;
}
export interface MicroModel {
  before: MicroUnit[];
  after: MicroUnit[];
  spectators?: string;
  note: string;
}
const molecule = (formula: string, label: string, count = 1): MicroUnit => ({
  formula,
  label,
  kind: 'molecule',
  count,
  charge: 0,
});
const atom = (formula: string, label: string, count = 1): MicroUnit => ({
  formula,
  label,
  kind: 'atom',
  count,
  charge: 0,
});
const ion = (formula: string, label: string, charge: number, count = 1): MicroUnit => ({
  formula,
  label,
  kind: 'ion',
  count,
  charge,
});
const lattice = (formula: string, label: string, count = 1): MicroUnit => ({
  formula,
  label,
  kind: 'lattice',
  count,
  charge: 0,
});
const note = '原子与离子数按净反应配比展示；键变化是教学示意，不代表真实反应路径。';
export const microModels: Record<string, MicroModel> = {
  peroxide: {
    before: [molecule('H2O2', 'H₂O₂', 2)],
    after: [molecule('H2O', 'H₂O', 2), molecule('O2', 'O₂')],
    note,
  },
  permanganate: {
    before: [lattice('KMnO4', 'KMnO₄', 2)],
    after: [lattice('K2MnO4', 'K₂MnO₄'), lattice('MnO2', 'MnO₂'), molecule('O2', 'O₂')],
    note,
  },
  carbonate: {
    before: [lattice('CaCO3', 'CaCO₃'), ion('H', 'H⁺', 1, 2)],
    after: [ion('Ca', 'Ca²⁺', 2), molecule('H2O', 'H₂O'), molecule('CO2', 'CO₂')],
    spectators: 'Cl⁻ 为旁观离子，留在溶液中',
    note,
  },
  zinc: {
    before: [atom('Zn', 'Zn'), ion('H', 'H⁺', 1, 2)],
    after: [ion('Zn', 'Zn²⁺', 2), molecule('H2', 'H₂')],
    spectators: 'SO₄²⁻ 为旁观离子',
    note,
  },
  'copper-hydroxide': {
    before: [ion('Cu', 'Cu²⁺', 2), ion('OH', 'OH⁻', -1, 2)],
    after: [lattice('Cu(OH)2', 'Cu(OH)₂↓')],
    spectators: 'Na⁺、SO₄²⁻ 为旁观离子，溶液中不以 CuSO₄ 分子存在',
    note,
  },
  'iron-copper': {
    before: [atom('Fe', 'Fe'), ion('Cu', 'Cu²⁺', 2)],
    after: [ion('Fe', 'Fe²⁺', 2), atom('Cu', 'Cu')],
    spectators: 'SO₄²⁻ 为旁观离子；每个铁原子转移两个电子',
    note,
  },
  neutralization: {
    before: [ion('H', 'H⁺', 1), ion('OH', 'OH⁻', -1)],
    after: [molecule('H2O', 'H₂O')],
    spectators: 'Na⁺、Cl⁻ 为旁观离子',
    note,
  },
  'sulfuric-neutralization': {
    before: [ion('H', 'H⁺', 1, 2), ion('OH', 'OH⁻', -1, 2)],
    after: [molecule('H2O', 'H₂O', 2)],
    spectators: 'Na⁺、SO₄²⁻ 为旁观离子',
    note,
  },
  magnesium: {
    before: [atom('Mg', 'Mg', 2), molecule('O2', 'O₂')],
    after: [lattice('MgO', 'MgO', 2)],
    note,
  },
  limewater: {
    before: [molecule('CO2', 'CO₂'), ion('Ca', 'Ca²⁺', 2), ion('OH', 'OH⁻', -1, 2)],
    after: [lattice('CaCO3', 'CaCO₃↓'), molecule('H2O', 'H₂O')],
    note,
  },
  'silver-chloride': {
    before: [ion('Ag', 'Ag⁺', 1), ion('Cl', 'Cl⁻', -1)],
    after: [lattice('AgCl', 'AgCl↓')],
    spectators: 'Na⁺、NO₃⁻ 为旁观离子',
    note,
  },
  'barium-sulfate': {
    before: [ion('Ba', 'Ba²⁺', 2), ion('SO4', 'SO₄²⁻', -2)],
    after: [lattice('BaSO4', 'BaSO₄↓')],
    spectators: 'Na⁺、Cl⁻ 为旁观离子',
    note,
  },
  'iron-hydroxide': {
    before: [ion('Fe', 'Fe³⁺', 3), ion('OH', 'OH⁻', -1, 3)],
    after: [lattice('Fe(OH)3', 'Fe(OH)₃↓')],
    spectators: 'Na⁺、Cl⁻ 为旁观离子',
    note,
  },
  'acetic-neutralization': {
    before: [molecule('CH3COOH', 'CH₃COOH'), ion('OH', 'OH⁻', -1)],
    after: [ion('CH3COO', 'CH₃COO⁻', -1), molecule('H2O', 'H₂O')],
    spectators: 'Na⁺ 为旁观离子，弱酸乙酸保留分子式',
    note,
  },
};

/** Covalent bonds: indices follow formula.ts atom order; lattices use separate dashed guides. */
export const microBonds: Record<string, [number, number, number][]> = {
  H2O: [
    [2, 0, 1],
    [2, 1, 1],
  ],
  H2O2: [
    [0, 2, 1],
    [2, 3, 1],
    [3, 1, 1],
  ],
  O2: [[0, 1, 2]],
  H2: [[0, 1, 1]],
  CO2: [
    [0, 1, 2],
    [0, 2, 2],
  ],
  OH: [[0, 1, 1]],
  CH3COOH: [
    [0, 1, 1],
    [0, 2, 1],
    [0, 3, 1],
    [0, 4, 1],
    [1, 6, 2],
    [1, 7, 1],
    [7, 5, 1],
  ],
  CH3COO: [
    [0, 1, 1],
    [0, 2, 1],
    [0, 3, 1],
    [0, 4, 1],
    [1, 5, 2],
    [1, 6, 1],
  ],
  SO4: [
    [0, 1, 2],
    [0, 2, 2],
    [0, 3, 1],
    [0, 4, 1],
  ],
};
