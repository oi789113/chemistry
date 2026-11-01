import { beforeEach, describe, it, expect } from 'vitest';
import { useLab } from '../src/store/lab';
import { amount, pH, solutionColor, volume } from '../src/chemistry/engine';
const s = () => useLab.getState();
beforeEach(() => s().loadExperiment('peroxide'));
const advance = (ticks = 20) => {
  s().setRunning(true);
  for (let i = 0; i < ticks; i++) s().tick();
  s().setRunning(false);
};
describe('experiment clock, operations and history', () => {
  it('does not advance a paused simulation', () => {
    const before = structuredClone(s().lab);
    s().tick();
    expect(s().lab).toEqual(before);
  });
  it('restores chemistry on seek and exactly replays stored states', () => {
    const before = structuredClone(s().lab);
    advance();
    const after = structuredClone(s().lab),
      index = s().cursor;
    s().seek(0);
    expect(s().lab).toEqual(before);
    advance(index);
    expect(s().lab).toEqual(after);
  });
  it('forks history and discards future operations when editing the past', () => {
    advance(10);
    const cursor = s().cursor;
    advance(10);
    s().add({ id: 'naoh', phase: 'aq', amount: 1, concentration: 1 });
    s().seek(cursor);
    s().add({ id: 'hcl', phase: 'aq', amount: 1, concentration: 1 });
    expect(s().history).toHaveLength(cursor + 2);
    expect(s().logs.some((l) => l.text.includes('naoh'))).toBe(false);
    expect(
      amount(
        s().lab.vessels.find((v) => v.uid === 'reactor')!,
        'naoh',
      ),
    ).toBe(0);
  });
  it('can compare catalysed and uncatalysed experiments', () => {
    s().loadExperiment('peroxide', true, false);
    advance(20);
    const slow = s().lab.vessels.find((v) => v.uid === 'reactor')!.records.peroxide.extent;
    s().loadExperiment('peroxide', true, true);
    advance(20);
    const fast = s().lab.vessels.find((v) => v.uid === 'reactor')!.records.peroxide.extent;
    expect(fast).toBeGreaterThan(slow * 10);
  });
  it('prepares pink indicator and lets the user add acid to neutralize', () => {
    s().loadExperiment('indicator');
    const before = s().lab.vessels[0];
    expect(pH(before)).toBeGreaterThan(10);
    expect(solutionColor(before)).toBe('#e54f9c');
    expect(amount(before, 'hcl')).toBe(0);
    s().add({ id: 'hcl', phase: 'aq', amount: 20, concentration: 0.05 });
    advance(200);
    const after = s().lab.vessels[0];
    expect(pH(after)).toBeCloseTo(7);
    expect(amount(after, 'nacl')).toBeGreaterThan(0);
    expect(amount(after, 'phenolphthalein')).toBeCloseTo(amount(before, 'phenolphthalein'), 12);
  });
  it('requires a sealed source before connecting, and unseals when pouring', () => {
    s().toggleSeal();
    s().setAction('connect');
    expect(s().actionMode).toBeNull();
    expect(s().notice?.kind).toBe('error');
    s().toggleSeal();
    s().setAction('connect');
    s().completeAction('collector');
    expect(s().lab.connections).toHaveLength(1);
    s().setAction('pour');
    s().completeAction('collector');
    expect(s().lab.connections).toHaveLength(0);
    expect(s().lab.vessels.find((v) => v.uid === 'reactor')!.sealed).toBe(false);
  });
  it('fixes and releases a vessel using a stand', () => {
    const x = s().lab.vessels.find((v) => v.uid === 'reactor')!.x;
    s().addEquipment('stand');
    s().move('reactor', 40, 40);
    expect(s().lab.vessels.find((v) => v.uid === 'reactor')!.x).toBe(x);
    s().addEquipment('stand');
    s().move('reactor', 40, 40);
    expect(s().lab.vessels.find((v) => v.uid === 'reactor')!.x).toBe(40);
  });
  it('adds containers in free space and prevents overflow', () => {
    s().addEquipment('beaker');
    const v = s().lab.vessels.find((v) => v.uid === s().selected)!;
    expect(Math.abs(v.x - 610)).toBeGreaterThanOrEqual(165);
    s().add({ id: 'h2o', phase: 'l', amount: 300, concentration: 1 });
    expect(s().notice?.kind).toBe('error');
    expect(volume(s().lab.vessels.find((v) => v.uid === s().selected)!)).toBe(0);
  });
  it('preserves at least one container', () => {
    s().newFree();
    s().addEquipment('stand');
    s().removeEquipment();
    expect(s().lab.vessels.some((v) => v.kind === 'beaker')).toBe(true);
  });
});
