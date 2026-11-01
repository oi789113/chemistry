import { useState } from 'react'
import { Beaker, Search, Grip, ChevronDown, Info } from 'lucide-react'
import { substances, categoryNames, substanceMap, phaseNames } from '../chemistry/substances'
import { instruments } from '../chemistry/instruments'
import { displayFormula } from '../chemistry/formula'
import { gasMolarVolume } from '../chemistry/engine'
import type { Category, Phase, Substance } from '../chemistry/types'
import { useLabStore } from '../store/lab'
import { Glassware } from './Glassware'
import { Modal } from './Modal'

export function ReagentIcon({ s }: { s: Substance }) {
  const color = s.solutionColor ?? s.color
  return (
    <svg className="reagent-icon" viewBox="0 0 52 58" aria-hidden="true">
      {s.phase === 'g' ? (
        <>
          <rect
            x="15"
            y="14"
            width="23"
            height="37"
            rx="7"
            fill={color}
            fillOpacity=".55"
            stroke="#91a6a1"
          />
          <path d="M23 8 h8 v7 h-8 Z M22 6 h10" stroke="#6c8981" fill="#a7bfb3" strokeWidth="2" />
          <path d="M20 23 v18" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
          <path d="M22 32 h9" stroke="#6c8981" strokeWidth="1.2" />
        </>
      ) : (
        <>
          <path
            d="M20 12 h13 v11 l9 8 v20 Q42 54 39 54 H13 Q10 54 10 51 V31 l10-8 Z"
            fill="#e9f1e8"
            stroke="#a6b8aa"
            strokeWidth="1.1"
          />
          <path
            d="M12 36 Q27 39 40 36 V50 Q40 52 38 52 H14 Q12 52 12 50 Z"
            fill={color}
            fillOpacity={s.phase === 's' ? '.9' : '.7'}
          />
          {s.phase === 's' &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <rect
                key={i}
                x={14 + (i % 3) * 8}
                y={43 + Math.floor(i / 3) * 5}
                width="4"
                height="3"
                rx=".5"
                fill="#ffffff66"
                transform={'rotate(' + i * 7 + ' 26 48)'}
              />
            ))}
          <rect
            x="18"
            y="8"
            width="17"
            height="9"
            rx="2"
            fill={
              s.category === 'acid' ? '#c5a180' : s.category === 'indicator' ? '#b58fa1' : '#83a593'
            }
          />
          <path
            d="M15 33 v12"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity=".9"
          />
          <rect x="15" y="28" width="23" height="13" rx="1.5" fill="#fffdf5" fillOpacity=".9" />
          <text x="26" y="37" textAnchor="middle" fontSize="6.2" fill="#627a6b">
            {s.formula.length > 9 ? 'CHEM' : s.formula}
          </text>
        </>
      )}
    </svg>
  )
}
export function Library({
  onReagent,
  onHelp,
}: {
  onReagent: (id: string) => void
  onHelp: () => void
}) {
  const [tab, setTab] = useState<'reagents' | 'instruments'>('reagents'),
    [search, setSearch] = useState(''),
    [category, setCategory] = useState<Category | 'all'>('all')
  const addEquipment = useLabStore((s) => s.addEquipment)
  const normal = (s: string) =>
    s
      .toLowerCase()
      .replace(/[₀-₉]/g, (n) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(n)))
      .replace(/\s/g, '')
  const items = substances.filter(
    (s) =>
      (category === 'all' ||
        s.category === category ||
        (category === 'acid' && s.id === 'CH3COOH') ||
        (category === 'oxide' && s.id === 'MnO2')) &&
      normal(s.name + s.formula).includes(normal(search)),
  )
  const equipment = instruments.filter((i) => (i.name + i.description).includes(search))
  return (
    <aside className="library">
      <div className="panel-title">
        <div>
          <span className="eyebrow">YOUR LAB, YOUR ELEMENTS</span>
          <h2>实验物品库</h2>
        </div>
        <span className="count-badge">
          {tab === 'reagents' ? substances.length : instruments.length}
        </span>
      </div>
      <div className="library-tabs">
        <button className={tab === 'reagents' ? 'active' : ''} onClick={() => setTab('reagents')}>
          <Beaker size={15} />
          化学试剂
        </button>
        <button
          className={tab === 'instruments' ? 'active' : ''}
          onClick={() => setTab('instruments')}
        >
          <Grip size={15} />
          实验仪器
        </button>
      </div>
      <label className="search-box">
        <Search size={16} />
        <input
          placeholder={tab === 'reagents' ? '搜索名称 / 化学式' : '搜索实验仪器'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="搜索物品"
        />
        <kbd>⌕</kbd>
      </label>
      {tab === 'reagents' && (
        <div className="category-grid">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
            全部
          </button>
          {Object.entries(categoryNames).map(([key, name]) => (
            <button
              key={key}
              className={category === key ? 'active' : ''}
              onClick={() => setCategory(key as Category)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="library-list-heading">
        <span>
          {tab === 'reagents'
            ? category === 'all'
              ? '常用化学试剂'
              : categoryNames[category]
            : '玻璃仪器与工具'}
        </span>
        <span>
          {tab === 'reagents' ? items.length : equipment.length} 件 <ChevronDown size={12} />
        </span>
      </div>
      <div className="library-items" data-testid="library-items">
        {tab === 'reagents'
          ? items.map((s) => (
              <button
                key={s.id}
                className="library-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/chemlab',
                    JSON.stringify({ type: 'substance', id: s.id }),
                  )
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => onReagent(s.id)}
                title={s.appearance + ' · 点击设置用量或拖入容器'}
              >
                <div
                  className="item-visual"
                  style={{
                    background:
                      s.category === 'indicator'
                        ? '#f2e7eb'
                        : s.category === 'salt'
                          ? '#e9eff0'
                          : '#edf1e8',
                  }}
                >
                  <ReagentIcon s={s} />
                  <span className="item-add">+</span>
                </div>
                <span className="item-name">{s.name}</span>
                <span className="item-formula">{displayFormula(s.formula)}</span>
                <span className="item-state">{phaseNames[s.phase]}</span>
              </button>
            ))
          : equipment.map((i) => (
              <button
                key={i.id}
                className="library-item instrument-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/chemlab',
                    JSON.stringify({ type: 'instrument', id: i.id }),
                  )
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => addEquipment(i.id)}
                title={i.description}
              >
                <div className="item-visual">
                  <Glassware kind={i.id} mini />
                  <span className="item-add">+</span>
                </div>
                <span className="item-name">{i.name}</span>
                <span className="item-formula">{i.capacity ? i.capacity + ' mL' : '操作工具'}</span>
              </button>
            ))}
        {(tab === 'reagents' ? items : equipment).length === 0 && (
          <div className="empty-search">
            没有匹配的物品
            <br />
            <button
              onClick={() => {
                setSearch('')
                setCategory('all')
              }}
            >
              清除筛选
            </button>
          </div>
        )}
      </div>
      <button className="library-help" onClick={onHelp}>
        <Info size={15} />
        <span>点击添加，拖动自由布置</span>
        <span>↗</span>
      </button>
    </aside>
  )
}

export function ReagentDialog({
  id: initialId,
  targetId,
  onClose,
  dropper = false,
}: {
  id: string
  targetId?: string
  onClose: () => void
  dropper?: boolean
}) {
  const [id, setId] = useState(initialId)
  const s = substanceMap[id],
    store = useLabStore(),
    selected = store.sim.vessels.find((v) => v.id === (targetId ?? store.selectedId))
  const [phase, setPhase] = useState<Phase>(dropper ? 'aq' : s.phase),
    [quantity, setQuantity] = useState(
      dropper ? 0.05 : s.phase === 'aq' ? 10 : s.phase === 'g' ? 25 : s.phase === 'l' ? 10 : 0.1,
    ),
    [concentration, setConcentration] = useState(0.5)
  const unit = phase === 's' ? 'g' : 'mL'
  const mmol =
    phase === 'aq'
      ? quantity * concentration
      : phase === 's'
        ? (quantity / s.molarMass) * 1000
        : phase === 'g'
          ? quantity / gasMolarVolume(selected?.temperature ?? 25)
          : id === 'H2O'
            ? quantity * 55.5
            : ((quantity * 0.789) / s.molarMass) * 1000
  const volumeMl = phase === 'aq' || phase === 'l' ? quantity : 0
  function submit() {
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      (phase === 'aq' &&
        (!Number.isFinite(concentration) || concentration <= 0 || concentration > 2))
    ) {
      store.notify('请输入正数用量；溶液浓度范围为 0.001–2 mol/L。')
      return
    }
    const before = useLabStore.getState().sim
    store.add(id, mmol, phase, volumeMl, targetId)
    if (useLabStore.getState().sim !== before) onClose()
  }
  return (
    <Modal title={dropper ? '滴加溶液' : '添加化学试剂'} onClose={onClose}>
      <div className="reagent-detail">
        <div className="detail-icon">
          <ReagentIcon s={s} />
        </div>
        <div>
          <span className="eyebrow">
            {categoryNames[s.category]} · {s.appearance}
          </span>
          <h3>
            {s.name}
            <span>{displayFormula(s.formula)}</span>
          </h3>
          <p>{s.properties}</p>
        </div>
      </div>
      <div className="dialog-target">
        加入容器{' '}
        <b>
          {selected
            ? ((
                {
                  beaker: '烧杯',
                  flask: '锥形瓶',
                  testTube: '试管',
                  gasJar: '集气瓶',
                  dish: '蒸发皿',
                  crucible: '坩埚',
                  roundFlask: '圆底烧瓶',
                  cylinder: '量筒',
                } as Record<string, string>
              )[selected.kind] ?? '请选择容器')
            : '尚未选择'}
        </b>
        <span>当前 {selected?.volumeMl.toFixed(1) ?? '0'} mL</span>
      </div>
      {dropper && (
        <label className="dropper-reagent-select">
          滴管中的溶液
          <select aria-label="滴加试剂" value={id} onChange={(e) => setId(e.target.value)}>
            {substances
              .filter((s) => s.phase === 'aq')
              .map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name} · {displayFormula(s.formula)}
                </option>
              ))}
          </select>
        </label>
      )}
      <div className="form-row">
        <label>
          物态
          <select
            aria-label="试剂物态"
            value={phase}
            onChange={(e) => {
              const p = e.target.value as Phase
              setPhase(p)
              setQuantity(p === 's' ? 0.1 : 10)
            }}
          >
            {[
              ...new Set<Phase>([
                s.phase,
                ...(s.soluble && s.phase !== 'g' && s.phase !== 'l'
                  ? (['s', 'aq'] as Phase[])
                  : []),
              ]),
            ].map((p) => (
              <option key={p} value={p}>
                {phaseNames[p]}
              </option>
            ))}
          </select>
        </label>
        <label>
          用量（{unit}）
          <input
            type="number"
            min="0.001"
            step={dropper ? '.05' : phase === 's' ? '.1' : '1'}
            aria-label="试剂用量"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        {phase === 'aq' && (
          <label>
            浓度（mol/L）
            <input
              type="number"
              min="0.001"
              max="2"
              step=".1"
              aria-label="溶液浓度"
              value={concentration}
              onChange={(e) => setConcentration(Number(e.target.value))}
            />
          </label>
        )}
      </div>
      {phase === 'aq' && (
        <div className="dose-presets">
          <span>快速选择</span>
          <button onClick={() => setQuantity(0.05)}>一滴 · 0.05 mL</button>
          <button onClick={() => setQuantity(5)}>5 mL</button>
          <button onClick={() => setQuantity(10)}>10 mL</button>
          <button onClick={() => setQuantity(20)}>20 mL</button>
        </div>
      )}
      <div className="quantity-summary">
        <span>物质的量</span>
        <b>
          {Number.isFinite(mmol) ? (mmol < 0.01 ? mmol.toPrecision(3) : mmol.toFixed(3)) : '—'}{' '}
          <small>mmol</small>
        </b>
      </div>
      <div className="substance-notes">
        <p>
          <b>反应条件</b>
          {s.conditions}
        </p>
        <p>
          <b>安全信息</b>
          {s.safety}
        </p>
      </div>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose}>
          取消
        </button>
        <button className="primary-button" onClick={submit}>
          {quantity === 0.05 && phase === 'aq' ? '滴加到容器' : '添加到容器'} <span>＋</span>
        </button>
      </div>
    </Modal>
  )
}
