import { useEffect, useRef } from 'react'
import { amount, mainRule } from '../chemistry/engine'
import { substanceMap } from '../chemistry/substances'
import { displayFormula } from '../chemistry/formula'
import type { Simulation, Vessel } from '../chemistry/types'
import { Atom } from 'lucide-react'

const atomColors: Record<string, string> = {
  H: '#ecf0ec',
  O: '#df786e',
  C: '#526370',
  Na: '#a48bc7',
  Cu: '#5faacf',
  Fe: '#9caf96',
  Mn: '#827c94',
  Cl: '#99bd75',
  S: '#d9b65c',
  Mg: '#a5b4c0',
  K: '#ab8bc6',
  Zn: '#b2b8b5',
  Ca: '#8ba7ce',
}
const ions: Record<string, { label: string; el: string; n: number }[]> = {
  CuSO4: [
    { label: 'Cu²⁺', el: 'Cu', n: 1 },
    { label: 'SO₄²⁻', el: 'S', n: 1 },
  ],
  NaOH: [
    { label: 'Na⁺', el: 'Na', n: 1 },
    { label: 'OH⁻', el: 'O', n: 1 },
  ],
  HCl: [
    { label: 'H⁺', el: 'H', n: 1 },
    { label: 'Cl⁻', el: 'Cl', n: 1 },
  ],
  NaCl: [
    { label: 'Na⁺', el: 'Na', n: 1 },
    { label: 'Cl⁻', el: 'Cl', n: 1 },
  ],
  Na2SO4: [
    { label: 'Na⁺', el: 'Na', n: 2 },
    { label: 'SO₄²⁻', el: 'S', n: 1 },
  ],
  FeSO4: [
    { label: 'Fe²⁺', el: 'Fe', n: 1 },
    { label: 'SO₄²⁻', el: 'S', n: 1 },
  ],
  H2SO4: [
    { label: 'H⁺', el: 'H', n: 2 },
    { label: 'SO₄²⁻', el: 'S', n: 1 },
  ],
  CaCl2: [
    { label: 'Ca²⁺', el: 'Ca', n: 1 },
    { label: 'Cl⁻', el: 'Cl', n: 2 },
  ],
  ZnSO4: [
    { label: 'Zn²⁺', el: 'Zn', n: 1 },
    { label: 'SO₄²⁻', el: 'S', n: 1 },
  ],
}
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 9.2) * 43758.5
  return x - Math.floor(x)
}
export function MicroView({ vessel: v, sim }: { vessel?: Vessel; sim: Simulation }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !v) return
    const c = canvas.getContext('2d')
    if (!c) return
    function draw() {
      const bounds = canvas!.getBoundingClientRect(),
        w = bounds.width,
        h = bounds.height,
        dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      c!.scale(dpr, dpr)
      const ctx = c!,
        time = sim.time
      ctx.fillStyle = '#eff5ef'
      ctx.fillRect(0, 0, w, h)
      for (let x = 15; x < w; x += 23)
        for (let y = 15; y < h; y += 23) {
          ctx.fillStyle = '#aac0ae55'
          ctx.beginPath()
          ctx.arc(x, y, 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
      const drawAtom = (x: number, y: number, el: string, label = el, r = 13) => {
        const color = atomColors[el] ?? '#a9b5ae',
          g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r)
        g.addColorStop(0, '#ffffff')
        g.addColorStop(0.25, color)
        g.addColorStop(1, color + 'cc')
        ctx.shadowColor = '#40594c25'
        ctx.shadowBlur = 7
        ctx.shadowOffsetY = 3
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        ctx.strokeStyle = '#ffffffaa'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.fillStyle = ['O', 'C', 'Mn'].includes(el) ? '#fff' : '#3a5148'
        ctx.font = (label.length > 3 ? '10' : '11') + 'px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, x, y + 0.5)
      }
      let serial = 1
      for (const p of v!.contents.filter(
        (p) => p.id !== 'H2O' && p.mmol > 0.0001 && substanceMap[p.id].category !== 'indicator',
      )) {
        const count = Math.min(9, Math.max(1, Math.round(p.mmol * 1.2)))
        for (let j = 0; j < count; j++) {
          const k = serial++
          const solid = p.phase === 's',
            catalyst = p.id === 'MnO2'
          const x =
            45 +
            seed(k + 13) * (w - 90) +
            Math.sin(time * (solid ? 0.08 : 0.3) + k) * (!solid ? 13 : 2)
          const y = solid
            ? h - 48 - seed(k + 43) * 38
            : 55 + seed(k + 21) * (h - 160) + Math.cos(time * 0.3 + k) * 12
          const split = p.phase === 'aq' ? ions[p.id] : undefined
          if (split) {
            split
              .flatMap((ion) => Array.from({ length: ion.n }, () => ion))
              .forEach((ion, i) =>
                drawAtom(
                  x + (i - 0.5) * 31,
                  y + Math.sin(k + i) * 20,
                  ion.el,
                  ion.label,
                  ion.label.length > 3 ? 18 : 14,
                ),
              )
          } else {
            const atoms = Object.entries(substanceMap[p.id].atoms)
              .flatMap(([el, n]) => Array(Math.min(6, n)).fill(el) as string[])
              .slice(0, 14)
            const positions = atoms.map((el, i) => ({
              el,
              x: x + (i === 0 ? 0 : Math.cos(i * 2.4 + time * 0.06) * Math.sqrt(i) * 15),
              y: y + (i === 0 ? 0 : Math.sin(i * 2.4 + time * 0.06) * Math.sqrt(i) * 12),
            }))
            positions.slice(1).forEach((a, i) => {
              ctx.strokeStyle = '#99aaa3'
              ctx.lineWidth = 4
              ctx.beginPath()
              ctx.moveTo(positions[Math.floor(i / 2)].x, positions[Math.floor(i / 2)].y)
              ctx.lineTo(a.x, a.y)
              ctx.stroke()
              ctx.strokeStyle = '#e5eee5'
              ctx.lineWidth = 1
              ctx.stroke()
            })
            positions
              .reverse()
              .forEach((a) => drawAtom(a.x, a.y, a.el, a.el, a.el === 'H' ? 9 : 12))
            if (catalyst) {
              ctx.setLineDash([3, 4])
              ctx.strokeStyle = '#8d80a099'
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.ellipse(x, y, 40, 28, 0, 0, Math.PI * 2)
              ctx.stroke()
              ctx.setLineDash([])
            }
          }
        }
      }
      if (!serial || serial === 1) {
        ctx.fillStyle = '#869c8c'
        ctx.textAlign = 'center'
        ctx.font = '14px system-ui'
        ctx.fillText('加入试剂，观察粒子组成', w / 2, h / 2)
      }
      if (amount(v!, 'MnO2') > 0) {
        ctx.fillStyle = '#617c6e'
        ctx.textAlign = 'left'
        ctx.font = '11px system-ui'
        ctx.fillText('虚线区域：催化剂作用示意 · 自身不消耗', 20, h - 15)
      }
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [v, sim])
  return (
    <div className="micro-view">
      <div className="micro-heading">
        <Atom size={15} />
        <span>微观粒子视图</span>
        <span className="badge">组成抽样示意</span>
      </div>
      <canvas ref={ref} aria-label="当前物质对应的分子、离子与固体粒子示意" />
      <BondIllustration vessel={v} sim={sim} />
      <div className="micro-legend">
        {['H', 'O', 'Cu', 'Na', 'Fe', 'Mn', 'Cl'].map((el) => (
          <span key={el}>
            <i style={{ background: atomColors[el] }} />
            {el}
          </span>
        ))}
      </div>
      <div className="micro-species">
        {v?.contents
          .filter((p) => p.id !== 'H2O')
          .map((p) => (
            <span key={p.id + p.phase}>
              {displayFormula(p.id)}{' '}
              <b>{p.mmol < 0.01 ? p.mmol.toPrecision(2) : p.mmol.toFixed(2)}</b> mmol
            </span>
          ))}
      </div>
      <p className="micro-note">
        溶剂水省略；粒子数量为抽样。键线表示连接关系，运动与键变化为教学示意，不是分子动力学轨迹。
      </p>
    </div>
  )
}

function BondIllustration({ vessel: v, sim }: { vessel?: Vessel; sim: Simulation }) {
  const rule = mainRule(v, sim)
  if (
    !rule ||
    !['peroxide', 'copper-precipitate', 'neutralization', 'iron-copper', 'magnesium'].includes(
      rule.id,
    )
  )
    return null
  const activity = sim.activities.find((a) => a.vesselId === v?.id && a.reactionId === rule.id)
  const phase = activity ? 0.5 + 0.5 * Math.sin(sim.time * 3) : 0
  const node = (x: number, y: number, el: string, label = el) => (
    <g>
      <circle
        cx={x}
        cy={y}
        r={label.length > 2 ? 14 : 10}
        fill={atomColors[el] ?? '#adc1a3'}
        stroke="#fff"
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 3}
        textAnchor="middle"
        fill={['O', 'Cu', 'Fe'].includes(el) ? '#fff' : '#4b6351'}
        fontSize={label.length > 2 ? 8 : 9}
      >
        {label}
      </text>
    </g>
  )
  const bond = (x1: number, y1: number, x2: number, y2: number, breaking = false) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={breaking ? '#bf8c72' : '#9cae9a'}
      strokeWidth={3}
      strokeDasharray={breaking ? '4 3' : undefined}
      opacity={breaking ? 1 - phase * 0.6 : 1}
    />
  )
  let illustration
  if (rule.id === 'peroxide')
    illustration = (
      <>
        {bond(53, 31, 83, 31, true)}
        {bond(53, 31, 33, 46)}
        {bond(83, 31, 103, 46)}
        {node(53, 31, 'O')}
        {node(83, 31, 'O')}
        {node(33, 46, 'H')}
        {node(103, 46, 'H')}
        <text x="18" y="20" className="bond-coefficient">
          2×
        </text>
        {bond(218, 31, 200, 47)}
        {bond(218, 31, 236, 47)}
        {node(218, 31, 'O')}
        {node(200, 47, 'H')}
        {node(236, 47, 'H')}
        <text x="185" y="20" className="bond-coefficient">
          2×
        </text>
        {bond(284, 29, 310, 29)}
        {bond(284, 34, 310, 34)}
        {node(284, 31, 'O')}
        {node(310, 31, 'O')}
      </>
    )
  else if (rule.id === 'copper-precipitate')
    illustration = (
      <>
        {node(35, 32, 'Cu', 'Cu²⁺')}
        {node(95, 17, 'O', 'OH⁻')}
        {node(95, 49, 'O', 'OH⁻')}
        {bond(250, 32, 223, 20)}
        {bond(223, 20, 204, 13)}
        {bond(250, 32, 276, 43)}
        {bond(276, 43, 296, 49)}
        {node(250, 32, 'Cu')}
        {node(223, 20, 'O')}
        {node(204, 13, 'H')}
        {node(276, 43, 'O')}
        {node(296, 49, 'H')}
      </>
    )
  else if (rule.id === 'neutralization')
    illustration = (
      <>
        {node(40, 32, 'H', 'H⁺')}
        {node(97, 32, 'O', 'OH⁻')}
        {bond(254, 28, 231, 45)}
        {bond(254, 28, 277, 45)}
        {node(254, 28, 'O')}
        {node(231, 45, 'H')}
        {node(277, 45, 'H')}
      </>
    )
  else if (rule.id === 'iron-copper')
    illustration = (
      <>
        {node(40, 32, 'Fe')}
        {node(97, 32, 'Cu', 'Cu²⁺')}
        {node(225, 32, 'Fe', 'Fe²⁺')}
        {node(284, 32, 'Cu')}
        <path d="M48 9 Q69 -3 88 9" stroke="#a3b78d" fill="none" strokeDasharray="3 3" />
        <text x="68" y="7" textAnchor="middle" fontSize="7" fill="#88a173">
          2e⁻
        </text>
      </>
    )
  else
    illustration = (
      <>
        {node(40, 32, 'Mg')}
        <text x="19" y="19" className="bond-coefficient">
          2×
        </text>
        {bond(87, 29, 110, 29)}
        {bond(87, 34, 110, 34)}
        {node(87, 32, 'O')}
        {node(110, 32, 'O')}
        {bond(240, 32, 268, 32)}
        {node(240, 32, 'Mg')}
        {node(268, 32, 'O')}
        <text x="211" y="19" className="bond-coefficient">
          2×
        </text>
      </>
    )
  return (
    <div className="bond-illustration">
      <span>
        {rule.id.includes('precipitate') || rule.id === 'neutralization'
          ? '净离子结合示意'
          : rule.id === 'iron-copper'
            ? '电子转移示意'
            : '断键与重组示意'}
      </span>
      <svg viewBox="0 0 340 63" aria-label={rule.title + '的粒子与键变化示意'}>
        <path d="M143 31 h32 m-6 -4 l6 4 -6 4" stroke="#89a277" strokeWidth="1.5" fill="none" />
        {illustration}
      </svg>
      <small>连接关系简化表达，比例标签对应方程式系数</small>
    </div>
  )
}
