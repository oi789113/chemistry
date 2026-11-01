import { useRef, useState, useEffect, type PointerEvent } from 'react'
import {
  Atom,
  Beaker,
  Cable,
  Flame,
  Move,
  RotateCw,
  Thermometer,
  Droplets,
  ArrowRightLeft,
  Trash2,
  Wind,
  Check,
  ChevronRight,
} from 'lucide-react'
import { useLabStore } from '../store/lab'
import { amount, gasVolume, describeSystem, prepareWaterCollection } from '../chemistry/engine'
import { instrumentMap, isContainer } from '../chemistry/instruments'
import { substanceMap } from '../chemistry/substances'
import { lessonMap } from '../chemistry/lessons'
import { displayFormula } from '../chemistry/formula'
import type { InstrumentKind, Simulation, Vessel } from '../chemistry/types'
import { Glassware } from './Glassware'
import { ReactionCanvas } from './ReactionCanvas'
import { MicroView } from './MicroView'
import { Modal } from './Modal'
import { geometry } from './geometry'

function BenchObject({
  v,
  sim,
  board,
  onTool,
}: {
  v: Vessel
  sim: Simulation
  board: HTMLDivElement | null
  onTool: (kind: InstrumentKind, id?: string) => void
}) {
  const selectedId = useLabStore((s) => s.selectedId),
    select = useLabStore((s) => s.select),
    move = useLabStore((s) => s.move),
    operation = useLabStore((s) => s.operation)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{
    x: number
    y: number
    clientX: number
    clientY: number
    moved: boolean
  } | null>(null)
  const container = isContainer(v.kind),
    selected = selectedId === v.id
  const lampOn = v.kind === 'lamp' && sim.vessels.some((x) => x.heating)
  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: v.x, y: v.y, clientX: e.clientX, clientY: e.clientY, moved: false }
    if (container) select(v.id)
  }
  function moving(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || !board) return
    const bounds = board.getBoundingClientRect()
    if (Math.abs(e.clientX - d.clientX) + Math.abs(e.clientY - d.clientY) > 4) d.moved = true
    if (d.moved)
      setPos({
        x: Math.max(10, Math.min(90, d.x + ((e.clientX - d.clientX) / bounds.width) * 100)),
        y: Math.max(16, Math.min(84, d.y + ((e.clientY - d.clientY) / bounds.height) * 100)),
      })
  }
  function up() {
    const d = drag.current
    if (!d) return
    if (d.moved && pos) move(v.id, pos.x, pos.y)
    else if (!container) onTool(v.kind, v.id)
    setPos(null)
    drag.current = null
  }
  if (v.kind === 'tube' && sim.connections.length) return null
  const gasName = v.contents
    .filter((p) => p.phase === 'g')
    .map((p) => displayFormula(p.id))
    .join(' / ')
  return (
    <div
      className={
        'bench-object object-' +
        v.kind +
        (selected ? ' selected' : '') +
        (pos ? ' is-dragging' : '') +
        (operation?.source === v.id ? ' pouring' : '')
      }
      style={{
        left: (pos?.x ?? v.x) + '%',
        top: (pos?.y ?? v.y) + '%',
        zIndex: v.kind === 'stand' ? 1 : v.kind === 'lamp' ? 4 : selected ? 8 : 5,
      }}
      onPointerDown={down}
      onPointerMove={moving}
      onPointerUp={up}
      onPointerCancel={() => {
        setPos(null)
        drag.current = null
      }}
      role="button"
      tabIndex={0}
      aria-label={
        instrumentMap[v.kind].name + (container ? '，点击选择；方向键移动' : '，点击操作或拖动')
      }
      aria-pressed={container ? selected : undefined}
      onKeyDown={(e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault()
          const step = e.shiftKey ? 5 : 1
          move(
            v.id,
            v.x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0),
            v.y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0),
          )
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (container) select(v.id)
          else onTool(v.kind, v.id)
        } else if (e.key === 'Delete') {
          e.preventDefault()
          useLabStore.getState().removeEquipment(v.id)
        }
      }}
      data-vessel-id={v.id}
      title={instrumentMap[v.kind].description}
    >
      <div className="object-shadow" />
      {container && <ReactionCanvas vessel={v} sim={sim} />}
      <Glassware
        kind={v.kind}
        heated={lampOn || v.heating}
        active={lampOn && useLabStore.getState().playing}
        level={v.kind === 'trough' ? v.volumeMl / 500 : undefined}
      />
      {v.stoppered && ['testTube', 'flask', 'roundFlask'].includes(v.kind) && (
        <span
          className="vessel-stopper"
          style={{ top: (geometry(v.kind).mouth / 210) * 100 + '%' }}
        />
      )}
      {v.supported && container && (
        <span className="support-indicator" title="容器已固定">
          <Check size={9} />
        </span>
      )}
      <div className="object-label">
        <span>{instrumentMap[v.kind].name}</span>
        {(container || v.kind === 'trough') && (
          <small>
            {v.kind === 'gasJar'
              ? (gasName ? gasName + ' · ' : '') +
                gasVolume(v).toFixed(1) +
                ' mL' +
                (sim.connections.some((c) => c.to === v.id && c.method === 'water')
                  ? ' · 排水集气'
                  : '')
              : v.volumeMl > 0
                ? v.volumeMl.toFixed(1) + ' mL'
                : v.contents.length
                  ? '固体反应区'
                  : '空容器'}
          </small>
        )}
      </div>
      {selected && (
        <div className="object-selection">
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  )
}

function Tubes({ sim, width, height }: { sim: Simulation; width: number; height: number }) {
  const cubic = (t: number, a: number, b: number, c: number, d: number) =>
    Math.pow(1 - t, 3) * a +
    3 * Math.pow(1 - t, 2) * t * b +
    3 * (1 - t) * t * t * c +
    t * t * t * d
  return (
    <svg
      className="connection-layer"
      viewBox={'0 0 ' + width + ' ' + height}
      aria-label="导管及气体流动"
    >
      {sim.connections.map((link) => {
        const a = sim.vessels.find((v) => v.id === link.from),
          b = sim.vessels.find((v) => v.id === link.to)
        if (!a || !b) return null
        const objectHeight = window.innerWidth <= 700 ? 164 : 228
        const x1 = (a.x / 100) * width,
          y1 =
            (a.y / 100) * height - objectHeight / 2 + (geometry(a.kind).mouth / 210) * objectHeight,
          x2 = (b.x / 100) * width,
          y2 =
            (b.y / 100) * height - objectHeight / 2 + (geometry(b.kind).mouth / 210) * objectHeight
        const d =
          'M ' +
          x1 +
          ' ' +
          y1 +
          ' C ' +
          x1 +
          ' ' +
          (y1 - 60) +
          ' ' +
          x2 +
          ' ' +
          (y2 - 65) +
          ' ' +
          x2 +
          ' ' +
          y2
        const gas = a.contents.filter((p) => p.phase === 'g').reduce((n, p) => n + p.mmol, 0)
        return (
          <g key={link.from}>
            <path d={d} fill="none" stroke="#7c9e8e" strokeWidth="9" opacity=".65" />
            <path d={d} fill="none" stroke="#e4efe5" strokeWidth="6" />
            <path
              d={d}
              fill="none"
              stroke="#fff"
              strokeWidth="1.3"
              transform="translate(-1 -1)"
              opacity=".8"
            />
            {gas > 0.0001 &&
              Array.from({ length: Math.min(9, Math.ceil(gas * 30)) }, (_, i) => {
                const t = (sim.time * 0.3 + i * 0.16) % 1
                return (
                  <circle
                    key={i}
                    cx={cubic(t, x1, x1, x2, x2)}
                    cy={cubic(t, y1, y1 - 60, y2 - 65, y2)}
                    r="2.2"
                    fill="#70a891"
                  />
                )
              })}
            <text
              x={(x1 + x2) / 2}
              y={Math.min(y1, y2) - 45}
              textAnchor="middle"
              fill="#6e9380"
              fontSize="10"
              letterSpacing="1.5"
            >
              气体通路
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function Bench({
  onReagent,
  onTransfer,
}: {
  onReagent: (id: string, target?: string, dropper?: boolean) => void
  onTransfer: () => void
}) {
  const sim = useLabStore((s) => s.sim),
    selectedId = useLabStore((s) => s.selectedId),
    micro = useLabStore((s) => s.micro),
    mode = useLabStore((s) => s.mode),
    lessonId = useLabStore((s) => s.lessonId)
  const board = useRef<HTMLDivElement>(null),
    [dimensions, setDimensions] = useState({ w: 640, h: 410 }),
    [dragOver, setDragOver] = useState(false)
  const selected = sim.vessels.find((v) => v.id === selectedId)
  const operation = useLabStore((s) => s.operation),
    playing = useLabStore((s) => s.playing)
  const [toolDialog, setToolDialog] = useState(false)
  useEffect(() => {
    const el = board.current
    if (!el) return
    const o = new ResizeObserver(() => setDimensions({ w: el.clientWidth, h: el.clientHeight }))
    o.observe(el)
    return () => o.disconnect()
  }, [micro])
  function tool(kind: InstrumentKind, id?: string) {
    const store = useLabStore.getState()
    if (kind === 'lamp') store.heat()
    else if (kind === 'rod') store.stir()
    else if (kind === 'tube') store.connect()
    else if (kind === 'funnel') onTransfer()
    else if (kind === 'dropper') {
      if (!sim.vessels.some((v) => v.kind === 'dropper'))
        store.addEquipment('dropper', Math.min(85, (selected?.x ?? 40) + 18), 25)
      onReagent('NaOH', undefined, true)
    } else if (kind === 'thermometer')
      store.notify(
        '选中容器温度：' + (selected?.temperature.toFixed(1) ?? '—') + ' ℃。可在右侧调整恒温环境。',
      )
    else if (['stand', 'clamp', 'stopper'].includes(kind))
      store.mutate(
        (s) => {
          const v = s.vessels.find((v) => v.id === selectedId)
          if (!v) return '请先选中容器。'
          if (kind === 'stopper') {
            if (!['testTube', 'flask', 'roundFlask', 'gasJar'].includes(v.kind))
              return '该容器不适合使用此橡胶塞。'
            v.stoppered = !v.stoppered
          } else v.supported = !v.supported
        },
        kind === 'stopper' ? '切换橡胶塞' : '切换夹具固定',
      )
    else if (kind === 'trough') {
      const ok = store.mutate((s) => {
        const link =
          s.connections.find((c) => c.from === selectedId || c.to === selectedId) ??
          s.connections[0]
        const trough =
          s.vessels.find((v) => v.id === id && v.kind === 'trough') ??
          s.vessels.find((v) => v.kind === 'trough')
        if (!link || !trough) return '请先连接发生容器与集气瓶，再点击水槽。'
        return prepareWaterCollection(s, link.from, trough.id) ?? undefined
      }, '用水槽充满集气瓶，启用排水集气')
      if (ok) store.notify('已启用排水集气：生成气体将瓶中清水排回水槽。')
    }
  }
  return (
    <section className="bench-section">
      <div className="bench-intro">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> VIRTUAL CHEMISTRY LAB
          </div>
          <h1>
            {mode === 'guided' ? lessonMap[lessonId].title : '自由探索实验室'}
            <span>探索每一次变化</span>
          </h1>
          <p>
            {mode === 'guided'
              ? lessonMap[lessonId].subtitle
              : '选择试剂与仪器，提出假设，让反应自己发生。'}
          </p>
        </div>
        <button
          className="round-button"
          onClick={() => setToolDialog(true)}
          aria-label="查看实验操作说明"
        >
          ?
        </button>
      </div>
      <div className="bench-card">
        <div className="bench-card-header">
          <div className="view-tabs">
            <button
              className={!micro ? 'active' : ''}
              onClick={() => {
                if (micro) useLabStore.getState().toggleMicro()
              }}
            >
              <Beaker size={15} />
              实验操作台
            </button>
            <button
              className={micro ? 'active' : ''}
              onClick={() => {
                if (!micro) useLabStore.getState().toggleMicro()
              }}
            >
              <Atom size={15} />
              微观模式
            </button>
          </div>
          <button
            className="environment-control"
            onClick={() =>
              useLabStore.getState().mutate((s) => {
                s.environment = s.environment === 'air' ? 'closed' : 'air'
              }, '切换反应环境')
            }
            title="切换开放空气 / 密闭环境"
          >
            <Wind size={13} />
            {sim.environment === 'air' ? '空气环境' : '密闭环境'}
            <span className="live-dot" />
          </button>
        </div>
        <div
          className={
            'bench-arena' +
            (dragOver ? ' drag-over' : '') +
            (playing ? ' is-playing' : ' is-paused')
          }
          ref={board}
          data-testid="bench"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('application/chemlab')) {
              e.preventDefault()
              setDragOver(true)
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            try {
              const data = JSON.parse(e.dataTransfer.getData('application/chemlab'))
              const rect = e.currentTarget.getBoundingClientRect()
              if (data.type === 'instrument' && instrumentMap[data.id])
                useLabStore
                  .getState()
                  .addEquipment(
                    data.id,
                    ((e.clientX - rect.left) / rect.width) * 100,
                    ((e.clientY - rect.top) / rect.height) * 100,
                  )
              if (data.type === 'substance' && substanceMap[data.id]) {
                const el = (e.target as HTMLElement).closest('[data-vessel-id]')
                const target = el?.getAttribute('data-vessel-id') ?? selectedId
                onReagent(data.id, target)
              }
            } catch {
              useLabStore.getState().notify('无法识别拖入的物品。')
            }
          }}
        >
          {micro ? (
            <MicroView vessel={selected} sim={sim} />
          ) : (
            <>
              <div className="arena-corner">
                <span>实验台 01</span>
                <span>CHEMLAB / SCIENCE IN MOTION</span>
              </div>
              <div className="bench-backdrop" />
              <div className="bench-surface" />
              <div className="bench-front" />
              {sim.vessels.map((v) => (
                <BenchObject
                  key={v.id + (operation?.source === v.id ? operation.key : '')}
                  v={v}
                  sim={sim}
                  board={board.current}
                  onTool={tool}
                />
              ))}
              <Tubes sim={sim} width={dimensions.w} height={dimensions.h} />
              <OperationEffect key={operation?.key} sim={sim} />
              <div className="arena-scale">
                <span>0</span>
                <i />
                <span>10</span>
                <i />
                <span>20</span>
                <small>cm · 示意比例</small>
              </div>
              <div className="arena-hint">
                <Move size={11} /> 拖动仪器，自由布置实验台
              </div>
            </>
          )}
        </div>
        <div className="bench-toolbar">
          <div className="selected-vessel">
            <span className="selected-dot" />
            <div>
              <select
                aria-label="选择反应容器"
                value={selectedId}
                onChange={(e) => useLabStore.getState().select(e.target.value)}
              >
                {sim.vessels
                  .filter((v) => isContainer(v.kind))
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {instrumentMap[v.kind].name} · {v.id}
                    </option>
                  ))}
              </select>
              <small>{selected ? '已选中容器' : '点击实验台上的仪器'}</small>
            </div>
          </div>
          <div className="bench-tools">
            <button onClick={() => tool('dropper')} title="使用滴管添加溶液">
              <Droplets size={17} />
              <span>滴加</span>
            </button>
            <button onClick={onTransfer} title="向另一容器定量倾倒或过滤">
              <ArrowRightLeft size={17} />
              <span>转移</span>
            </button>
            <button
              onClick={() => tool('lamp')}
              className={selected?.heating ? 'tool-active' : ''}
              title="点燃 / 熄灭酒精灯"
            >
              <Flame size={17} />
              <span>{selected?.heating ? '熄灯' : '加热'}</span>
            </button>
            <button
              onClick={() => tool('rod')}
              className={selected?.stirring ? 'tool-active' : ''}
              title="用玻璃棒搅拌"
            >
              <RotateCw size={16} />
              <span>搅拌</span>
            </button>
            <button onClick={() => tool('tube')} title="连接 / 断开集气装置">
              <Cable size={17} />
              <span>导管</span>
            </button>
            <button onClick={() => useLabStore.getState().removeEquipment()} title="移除空仪器">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
      <div
        className={
          'system-status' + (describeSystem(selected, sim).includes('暂不支持') ? ' warning' : '')
        }
      >
        <span className="status-icon">
          <Thermometer size={15} />
        </span>
        <p>{describeSystem(selected, sim)}</p>
        <span>实时判断</span>
      </div>
      {mode === 'guided' && <Guide />}
      {toolDialog && (
        <Modal title="如何使用实验台" onClose={() => setToolDialog(false)}>
          <div className="help-content">
            <p>从左侧拖入仪器，点击试剂设置物态、用量与浓度。点击容器选中，再使用下方工具操作。</p>
            <p>
              酒精灯为选中容器加热；试管、圆底烧瓶和坩埚需要先点击铁架台或夹具固定。玻璃棒可搅拌。点击导管连接已放置的集气瓶。
            </p>
            <p>
              滴管按每滴 0.05 mL
              加入溶液；转移面板可倾倒或过滤，过滤需先放置漏斗。量筒可量取并转移指定比例的溶液。
            </p>
            <p>
              水槽配合导管与集气瓶提供排水集气的教学场景。收集体积依据理想气体方程；绿色填充表示累计量，不表示气体实际有色。
            </p>
            <p>
              时间轴只可拖到已模拟的时间。回到过去后播放会重放已有状态；修改试剂或条件会从该处重新演算。
            </p>
            <div className="keyboard-help">
              <span>
                <kbd>Space</kbd> 播放 / 暂停
              </span>
              <span>
                <kbd>M</kbd> 微观视图
              </span>
              <span>
                <kbd>R</kbd> 重置
              </span>
              <span>
                <kbd>方向键</kbd> 移动聚焦仪器
              </span>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

function OperationEffect({ sim }: { sim: Simulation }) {
  const operation = useLabStore((s) => s.operation)
  useEffect(() => {
    if (!operation) return
    const timer = setTimeout(() => useLabStore.setState({ operation: null }), 1500)
    return () => clearTimeout(timer)
  }, [operation])
  if (!operation) return null
  const v = sim.vessels.find((v) => v.id === operation.target)
  if (!v) return null
  return (
    <div
      className={'operation-effect ' + (operation.phase === 's' ? 'solid-dose' : 'liquid-dose')}
      style={{ left: v.x + '%', top: v.y + '%', color: operation.color }}
      aria-hidden="true"
    >
      {Array.from({ length: operation.drop ? 1 : 5 }, (_, i) => (
        <i
          key={i}
          style={{
            animationDelay: i * 0.12 + 's',
            marginLeft: (operation.phase === 's' ? ((i % 3) - 1) * 6 : 0) + 'px',
          }}
        />
      ))}
    </div>
  )
}

export function Guide() {
  const lessonId = useLabStore((s) => s.lessonId),
    completed = useLabStore((s) => s.completed),
    guide = useLabStore((s) => s.guide),
    lesson = lessonMap[lessonId]
  const index = lesson.steps.findIndex((s) => !completed.includes(s.action)),
    current = index === -1 ? lesson.steps.length - 1 : index,
    step = lesson.steps[current]
  return (
    <div className="guide-card">
      <div className="guide-number">
        {index === -1 ? <Check size={20} /> : String(current + 1).padStart(2, '0')}
      </div>
      <div className="guide-copy">
        <div>
          <span>实验引导</span>
          <span className="guide-dots">
            {lesson.steps.map((s, i) => (
              <button
                key={i}
                className={
                  (completed.includes(s.action) ? 'complete ' : '') +
                  (i === current ? 'current' : '')
                }
                onClick={() => guide(s.action)}
                aria-label={s.label}
                title={s.text}
              />
            ))}
          </span>
          <small>{index === -1 ? '已完成操作' : current + 1 + ' / ' + lesson.steps.length}</small>
        </div>
        <p>
          {index === -1 ? '操作步骤已完成。继续观察反应，或拖动时间轴比较前后变化。' : step.text}
        </p>
      </div>
      <button className="guide-action" onClick={() => guide(index === -1 ? 'micro' : step.action)}>
        {index === -1 ? '微观观察' : step.label}
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

export function TransferDialog({ onClose }: { onClose: () => void }) {
  const sim = useLabStore((s) => s.sim),
    selectedId = useLabStore((s) => s.selectedId),
    pour = useLabStore((s) => s.pour)
  const targets = sim.vessels.filter(
    (v) => v.id !== selectedId && isContainer(v.kind) && v.kind !== 'gasJar',
  )
  const [target, setTarget] = useState(targets[0]?.id ?? ''),
    [fraction, setFraction] = useState(0.5),
    [filter, setFilter] = useState(false)
  return (
    <Modal title="倾倒与过滤" onClose={onClose}>
      <p className="dialog-description">
        将选中容器的内容物定量转移。过滤时，不溶性固体留作滤渣，溶液进入接收容器。
      </p>
      <div className="form-row">
        <label>
          接收容器
          <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="接收容器">
            {targets.map((v) => (
              <option key={v.id} value={v.id}>
                {instrumentMap[v.kind].name} · {v.id} · {v.volumeMl.toFixed(1)} mL
              </option>
            ))}
          </select>
        </label>
        <label>
          转移比例
          <select
            aria-label="转移比例"
            value={fraction}
            onChange={(e) => setFraction(Number(e.target.value))}
          >
            <option value=".25">25%</option>
            <option value=".5">50%</option>
            <option value="1">全部 · 100%</option>
          </select>
        </label>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={filter} onChange={(e) => setFilter(e.target.checked)} />
        使用漏斗与滤纸过滤（需已放置漏斗）
      </label>
      {!targets.length && <p className="notice">请先从仪器库添加一个接收容器。</p>}
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose}>
          取消
        </button>
        <button
          className="primary-button"
          disabled={!target}
          onClick={() => {
            const before = useLabStore.getState().sim
            pour(target, fraction, filter)
            if (useLabStore.getState().sim !== before) onClose()
          }}
        >
          {filter ? '开始过滤' : '定量倾倒'} <ChevronRight size={16} />
        </button>
      </div>
    </Modal>
  )
}
