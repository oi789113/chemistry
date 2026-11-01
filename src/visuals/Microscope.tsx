import { useEffect, useRef } from 'react';
import { ArrowRight, Atom, X } from 'lucide-react';
import { useLab } from '../store/lab';
import { atoms } from '../chemistry/formula';
import { amount, matches, progress } from '../chemistry/engine';
import { microModels, microBonds } from '../chemistry/micro';
import type { MicroUnit } from '../chemistry/micro';
const elementColor: Record<string, string> = {
  H: '#dce6eb',
  O: '#dd796f',
  Cu: '#b78258',
  Na: '#a88aca',
  Cl: '#73b99a',
  C: '#657785',
  Mn: '#9b88b0',
  K: '#b49ac9',
  Fe: '#a38466',
  Mg: '#8db6c2',
  Zn: '#92acb2',
  S: '#d9bb55',
  Ca: '#94cba8',
  Ag: '#9cabb8',
  Ba: '#a6b46f',
};
interface Point {
  a: string;
  x: number;
  y: number;
}
function positions(unit: MicroUnit, x: number, y: number, scale = 1): Point[] {
  const list = Object.entries(atoms(unit.formula)).flatMap(([a, n]) =>
    Array.from({ length: n }, () => a),
  );
  const special: Record<string, number[][]> = {
    H2O: [
      [-20, 13],
      [20, 13],
      [0, 0],
    ],
    H2O2: [
      [-30, -10],
      [30, 10],
      [-11, 0],
      [11, 0],
    ],
    CO2: [
      [0, 0],
      [-25, 0],
      [25, 0],
    ],
    CH3COOH: [
      [-18, 0],
      [8, 0],
      [-30, -18],
      [-36, 0],
      [-30, 18],
      [45, 12],
      [10, -24],
      [33, 10],
    ],
    CH3COO: [
      [-18, 0],
      [8, 0],
      [-30, -18],
      [-36, 0],
      [-30, 18],
      [10, -24],
      [33, 10],
    ],
    SO4: [
      [0, 0],
      [-25, 0],
      [25, 0],
      [0, -25],
      [0, 25],
    ],
    OH: [
      [0, 0],
      [20, -10],
    ],
  };
  const coords = special[unit.formula];
  return list.map((a, i) => ({
    a,
    x:
      x +
      (coords ? coords[i][0] : list.length === 1 ? 0 : (i - (list.length - 1) / 2) * 18) * scale,
    y: y + (coords ? coords[i][1] : list.length < 3 ? 0 : Math.sin(i * 2.4) * 13) * scale,
  }));
}
export function Microscope() {
  const ref = useRef<HTMLCanvasElement>(null);
  const v = useLab((s) => s.lab.vessels.find((v) => v.uid === s.selected));
  const set = useLab((s) => s.setMicroscopic);
  const reaction = v ? matches(v)[0] : undefined;
  const model = reaction ? microModels[reaction.id] : undefined;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 820 * dpr;
    canvas.height = 320 * dpr;
    c.scale(dpr, dpr);
    let frame = 0;
    function sphere(point: Point, scale = 1) {
      const { a, x, y } = point;
      const radius = (a === 'H' ? 9 : 13) * scale;
      const gradient = c!.createRadialGradient(
        x - radius * 0.35,
        y - radius * 0.4,
        0,
        x,
        y,
        radius,
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, elementColor[a] ?? '#92b6c2');
      gradient.addColorStop(1, elementColor[a] ?? '#92b6c2');
      c!.fillStyle = gradient;
      c!.beginPath();
      c!.arc(x, y, radius, 0, Math.PI * 2);
      c!.fill();
      c!.fillStyle = a === 'H' ? '#4d6471' : '#fff';
      c!.font = `600 ${11 * scale}px sans-serif`;
      c!.textAlign = 'center';
      c!.textBaseline = 'middle';
      c!.fillText(a, x, y);
    }
    function bonds(points: Point[], lattice: boolean, alpha = 1, formula = '') {
      c!.globalAlpha = alpha;
      c!.strokeStyle = lattice ? '#a2b9b8' : '#8da7af';
      c!.lineWidth = 2.5;
      c!.setLineDash(lattice ? [3, 4] : []);
      const edges: [number, number, number][] = lattice
        ? points.slice(1).map((_, i) => [i, i + 1, 1])
        : (microBonds[formula] ?? []);
      for (const [from, to, order] of edges) {
        const a = points[from],
          b = points[to];
        if (!a || !b) continue;
        const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        for (let j = 0; j < order; j++) {
          const offset = (j - (order - 1) / 2) * 4,
            dx = (-(b.y - a.y) / length) * offset,
            dy = ((b.x - a.x) / length) * offset;
          c!.beginPath();
          c!.moveTo(a.x + dx, a.y + dy);
          c!.lineTo(b.x + dx, b.y + dy);
          c!.stroke();
        }
      }
      c!.setLineDash([]);
      c!.globalAlpha = 1;
    }
    function unit(unit: MicroUnit, x: number, y: number, opacity: number) {
      const points = positions(unit, x, y, 0.95);
      c!.globalAlpha = opacity;
      bonds(points, unit.kind === 'lattice', opacity, unit.formula);
      c!.globalAlpha = opacity;
      for (const p of points) sphere(p, 0.95);
      c!.fillStyle = '#53756b';
      c!.font = '13px sans-serif';
      c!.textAlign = 'center';
      c!.fillText(unit.label, x, y + 36);
      if (unit.kind === 'lattice') {
        c!.fillStyle = '#96a89b';
        c!.font = '9px sans-serif';
        c!.fillText('式量单位 / 晶格示意', x, y + 50);
      }
      if (unit.charge) {
        c!.fillStyle = '#6b8e82';
        c!.font = '12px sans-serif';
        const charge = Math.abs(unit.charge) === 1 ? '' : Math.abs(unit.charge);
        c!.fillText(`${charge}${unit.charge > 0 ? '+' : '−'}`, x + 22, y - 20);
      }
      c!.globalAlpha = 1;
      return points;
    }
    const draw = () => {
      const s = useLab.getState(),
        v = s.lab.vessels.find((v) => v.uid === s.selected),
        r = v ? matches(v)[0] : undefined,
        m = r ? microModels[r.id] : undefined,
        t = s.lab.time,
        p = v ? progress(v) : 0;
      c.clearRect(0, 0, 820, 320);
      c.strokeStyle = '#dfeae2';
      c.setLineDash([4, 6]);
      c.beginPath();
      c.moveTo(410, 15);
      c.lineTo(410, 180);
      c.stroke();
      c.setLineDash([]);
      if (m && r) {
        const paintSide = (units: MicroUnit[], offset: number, product: boolean) => {
          const expanded = units.flatMap((u) => Array.from({ length: u.count }, () => u));
          const points: Point[] = [];
          expanded.forEach((u, i) => {
            const count = expanded.length,
              x = offset + (count === 1 ? 205 : count === 2 ? 118 + i * 170 : 95 + (i % 2) * 210),
              y = count <= 2 ? 95 : 55 + Math.floor(i / 2) * 100;
            points.push(
              ...unit(
                u,
                x + Math.sin(t * 0.7 + i) * 4,
                y + Math.cos(t * 0.8 + i) * 4,
                product ? 0.35 + 0.65 * p : 1 - 0.5 * p,
              ),
            );
          });
          return points;
        };
        paintSide(m.before, 0, false);
        paintSide(m.after, 420, true);
        // A separate, atom-conserving schematic maps every reactant atom to a product atom.
        const smallSide = (units: MicroUnit[], center: number) => {
          const expanded = units.flatMap((u) => Array.from({ length: u.count }, () => u));
          return expanded.map((u, i) => ({
            unit: u,
            points: positions(u, center + (i - (expanded.length - 1) / 2) * 64, 260, 0.55),
          }));
        };
        const before = smallSide(m.before, 270),
          after = smallSide(m.after, 550),
          endpoints = after.flatMap((u) => u.points),
          used = new Set<number>();
        const current = before
          .flatMap((u) => u.points)
          .map((start) => {
            const i = endpoints.findIndex((end, i) => end.a === start.a && !used.has(i));
            used.add(i);
            const end = endpoints[i] ?? start;
            return {
              a: start.a,
              x: start.x + (end.x - start.x) * p,
              y: start.y + (end.y - start.y) * p - Math.sin(p * Math.PI) * ((used.size % 3) * 10),
            };
          });
        c.fillStyle = '#f6faf3';
        c.strokeStyle = '#e0ebdc';
        c.beginPath();
        c.roundRect(135, 214, 550, 85, 10);
        c.fill();
        c.stroke();
        c.fillStyle = '#8ba082';
        c.font = '10px sans-serif';
        c.textAlign = 'center';
        c.fillText(`原子重排示意 · ${(p * 100).toFixed(0)}%`, 410, 230);
        before.forEach((u) =>
          bonds(u.points, u.unit.kind === 'lattice', Math.max(0, 1 - p * 2), u.unit.formula),
        );
        after.forEach((u) =>
          bonds(u.points, u.unit.kind === 'lattice', Math.max(0, (p - 0.5) * 2), u.unit.formula),
        );
        current.forEach((point) => sphere(point, 0.55));
        if (r.catalyst) {
          const present = v && amount(v, r.catalyst) > 0;
          c.fillStyle = present ? '#678b6a' : '#9aac92';
          c.font = '11px sans-serif';
          c.fillText(
            present
              ? 'MnO₂ 保留 · 降低活化能 · 不改变总产量'
              : '未加入 MnO₂ · 反应途径的活化能较高',
            410,
            313,
          );
        }
      } else {
        c.fillStyle = '#93a88b';
        c.font = '15px sans-serif';
        c.textAlign = 'center';
        c.fillText('加入支持的反应物，观察粒子重组', 410, 115);
        c.font = '12px sans-serif';
        c.fillText('酸碱指示剂的显色与溶液 pH 联动；物理分离不改变物质组成', 410, 155);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="micro-panel">
      <div className="micro-header">
        <span>
          <Atom size={17} />
          微观反应视角 <small>原子守恒 · 离子反应 · 非比例</small>
        </span>
        <button className="icon-button" onClick={() => set(false)} aria-label="关闭微观模式">
          <X size={18} />
        </button>
      </div>
      <div className="micro-labels">
        <span>反应前 · 分子 / 离子</span>
        <ArrowRight size={17} />
        <span>反应后 · 新的组成</span>
      </div>
      <canvas
        ref={ref}
        className="micro-canvas"
        aria-label="动态原子、分子、离子与键变化教学示意"
      />
      <div className="micro-note">
        {reaction?.ionic && <strong>{reaction.ionic}</strong>}
        <p>{reaction?.micro ?? '添加匹配试剂后，显示配平的微观反应单位。'}</p>
        {model?.spectators && <p>{model.spectators}</p>}
        <small>键变化为教学示意，不代表真实反应路径。</small>
      </div>
    </div>
  );
}
