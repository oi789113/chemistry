import { describe, it, expect } from 'vitest';
import {
  addDose,
  amount,
  createVessel,
  elementLedger,
  pH,
  stepLab,
  transfer,
  volume,
} from '../src/chemistry/engine';
import { atoms } from '../src/chemistry/formula';
import { reactions } from '../src/data/reactions';
import { substances, substanceById as db } from '../src/data/substances';
import type { LabState, Vessel } from '../src/chemistry/types';
function run(v: Vessel, seconds = 60) {
  let lab: LabState = { vessels: [v], connections: [], time: 0 };
  for (let i = 0; i < seconds * 10; i++) lab = stepLab(lab, 0.1);
  return lab;
}
function seed(id: string) {
  const r = reactions.find((r) => r.id === id)!;
  const v = createVessel('beaker', 'v');
  v.contents = r.reactants
    .filter((t) => !t.air)
    .map((t) => ({ id: t.id, phase: t.phase, moles: 0.01 * t.coefficient }));
  v.contents.push({ id: 'h2o', phase: 'l', moles: 2 });
  if (r.minTemp) {
    v.contents = v.contents.filter((m) => m.id !== 'h2o');
    v.temperature = 280;
    v.targetTemp = 280;
    v.heating = true;
  }
  v.ignited = true;
  return v;
}
function closeLedger(before: Record<string, number>, after: Record<string, number>) {
  for (const element of new Set([...Object.keys(before), ...Object.keys(after)]))
    expect(after[element] ?? 0, element).toBeCloseTo(before[element] ?? 0, 8);
}
describe('chemical database and rules', () => {
  it('has unique, structured substance entries with valid formulae', () => {
    expect(new Set(substances.map((s) => s.id)).size).toBe(substances.length);
    for (const s of substances) {
      expect(s.molarMass).toBeGreaterThan(1);
      expect(s.safety).toBeTruthy();
    }
  });
  it('parses parentheses and hydrates', () => {
    expect(atoms('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(atoms('CuSO4·5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });
  for (const r of reactions)
    it(`balances all elements and mass: ${r.id}`, () => {
      const counts = (side: typeof r.reactants) =>
        side.reduce<Record<string, number>>((a, t) => {
          for (const [e, n] of Object.entries(atoms(db[t.id].formula)))
            a[e] = (a[e] ?? 0) + n * t.coefficient;
          return a;
        }, {});
      expect(counts(r.reactants)).toEqual(counts(r.products));
      const mass = (side: typeof r.reactants) =>
        side.reduce((n, t) => n + t.coefficient * db[t.id].molarMass, 0);
      expect(mass(r.reactants)).toBeCloseTo(mass(r.products), 5);
    });
});
describe('bounded state simulation', () => {
  for (const r of reactions)
    it(`conserves elements throughout ${r.id}`, () => {
      const v = seed(r.id);
      const initial = { vessels: [v], connections: [], time: 0 };
      const result = run(v);
      closeLedger(elementLedger(initial), elementLedger(result));
      expect(result.vessels[0].records[r.id]?.extent).toBeGreaterThan(0);
      for (const m of result.vessels[0].contents) expect(m.moles).toBeGreaterThanOrEqual(0);
    });
  it('respects thermal and ignition conditions', () => {
    const v = seed('permanganate');
    v.heating = false;
    v.temperature = 22;
    expect(run(v, 5).vessels[0].records).toEqual({});
    const m = seed('magnesium');
    m.ignited = false;
    expect(run(m, 5).vessels[0].records).toEqual({});
  });
  it('catalyst accelerates without consumption or changed yield', () => {
    const plain = seed('peroxide');
    const catalyst = addDose(plain, { id: 'mno2', amount: 0.1, phase: 's', concentration: 1 });
    const a = run(plain, 10).vessels[0],
      b = run(catalyst, 10).vessels[0];
    expect(b.records.peroxide.extent).toBeGreaterThan(a.records.peroxide.extent * 10);
    expect(amount(b, 'mno2')).toBeCloseTo(amount(catalyst, 'mno2'), 12);
    expect(b.records.peroxide.capacity).toBeCloseTo(a.records.peroxide.capacity, 10);
  });
  it('limits by stoichiometry, never consumes extra reagent', () => {
    let v = seed('copper-hydroxide');
    v.contents.find((m) => m.id === 'naoh')!.moles = 0.002;
    v = run(v, 120).vessels[0];
    expect(amount(v, 'cuoh2')).toBeCloseTo(0.001, 8);
    expect(amount(v, 'cuso4')).toBeCloseTo(0.009, 8);
  });
  it('concentration changes rate at equal moles', () => {
    const a = seed('carbonate'),
      b = structuredClone(a);
    b.contents.find((m) => m.id === 'h2o')!.moles = 8;
    expect(run(a, 2).vessels[0].records.carbonate.extent).toBeGreaterThan(
      run(b, 2).vessels[0].records.carbonate.extent,
    );
  });
  it('does not invent unsupported reactions', () => {
    let v = createVessel('beaker', 'v');
    v = addDose(v, { id: 'al', amount: 1, phase: 's', concentration: 1 });
    v = addDose(v, { id: 'hno3', amount: 20, phase: 'aq', concentration: 1 });
    expect(run(v).vessels[0].records).toEqual({});
  });
  it('computes acid/base/neutral pH', () => {
    const v = createVessel('beaker', 'v');
    expect(pH(v)).toBe(7);
    const a = addDose(v, { id: 'hcl', amount: 20, phase: 'aq', concentration: 0.1 });
    expect(pH(a)).toBeCloseTo(1, 3);
    const b = addDose(v, { id: 'naoh', amount: 20, phase: 'aq', concentration: 0.1 });
    expect(pH(b)).toBeCloseTo(13, 3);
  });
  it('filters solids but transfers solvent and dissolved ions, conserving mass', () => {
    const a = seed('copper-hydroxide'),
      b = createVessel('dish', 'b');
    a.contents.push({ id: 'cuoh2', phase: 's', moles: 0.01 });
    const lab = { vessels: [a, b], connections: [], time: 0 };
    const result = transfer(lab, 'v', 'b', 1, true);
    expect(amount(result.vessels[1], 'cuoh2')).toBe(0);
    expect(volume(result.vessels[0])).toBeCloseTo(0);
    expect(amount(result.vessels[1], 'cuso4')).toBeCloseTo(0.01);
    closeLedger(elementLedger(lab), elementLedger(result));
  });
  it('collects gas only through a sealed connection, with overflow accounted', () => {
    const v = seed('peroxide');
    v.sealed = true;
    v.contents.push({ id: 'o2', phase: 'g', moles: 0.02 });
    const jar = createVessel('gas-jar', 'j');
    const lab = { vessels: [v, jar], connections: [{ from: 'v', to: 'j' }], time: 0 };
    let result = lab;
    for (let i = 0; i < 100; i++) result = stepLab(result, 0.1);
    expect(amount(result.vessels[1], 'o2')).toBeGreaterThan(0);
    closeLedger(elementLedger(lab), elementLedger(result));
  });
  it('evaporates solvent with water accounted in environment', () => {
    let v = createVessel('dish', 'v');
    v = addDose(v, { id: 'h2o', amount: 20, phase: 'l', concentration: 1 });
    v.temperature = 100;
    v.targetTemp = 120;
    v.heating = true;
    const lab = { vessels: [v], connections: [], time: 0 };
    const result = run(v, 5);
    expect(volume(result.vessels[0])).toBeLessThan(20);
    closeLedger(elementLedger(lab), elementLedger(result));
  });
  it('rejects overflow and invalid transfer', () => {
    const v = createVessel('test-tube', 'v');
    expect(() => addDose(v, { id: 'h2o', amount: 100, phase: 'l', concentration: 1 })).toThrow(
      '容量',
    );
    expect(() => transfer({ vessels: [v], connections: [], time: 0 }, 'v', 'v', 1)).toThrow();
  });
  it('leaves input immutable and replay is deterministic', () => {
    const v = seed('peroxide');
    const lab = { vessels: [v], connections: [], time: 0 };
    const copy = structuredClone(lab);
    expect(stepLab(lab, 0.1)).toEqual(stepLab(lab, 0.1));
    expect(lab).toEqual(copy);
  });
});

it('rejects gas doses that exceed the available container volume', () => {
  const jar = createVessel('gas-jar', 'jar');
  expect(() => addDose(jar, { id: 'o2', phase: 'g', amount: 300, concentration: 1 })).toThrow(
    '气体容量',
  );
});
