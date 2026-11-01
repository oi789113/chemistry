import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  FlaskConical,
  GitBranch,
  HelpCircle,
  Leaf,
  NotebookPen,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useLabStore, downloadNotebook } from './store/lab'
import { lessons } from './chemistry/lessons'
import { Library, ReagentDialog } from './components/Library'
import { Bench, TransferDialog } from './components/Bench'
import { Analysis } from './components/Analysis'
import { Timeline, formatTime } from './components/Timeline'
import { Modal } from './components/Modal'
import './styles.css'

function useClock() {
  useEffect(() => {
    let previous = performance.now(),
      buffer = 0,
      frame = 0
    const loop = (now: number) => {
      const s = useLabStore.getState(),
        dt = Math.min(0.15, (now - previous) / 1000)
      previous = now
      if (s.playing) {
        buffer += dt
        if (buffer >= 1 / 30) {
          s.advance(buffer * s.speed)
          buffer = 0
        }
      } else buffer = 0
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        document.querySelector('[role="dialog"]') ||
        (e.target as HTMLElement).closest('input,select,textarea,button,[role="button"]')
      )
        return
      const s = useLabStore.getState()
      if (e.code === 'Space') {
        e.preventDefault()
        s.togglePlay()
      } else if (e.key.toLowerCase() === 'm') s.toggleMicro()
      else if (e.key.toLowerCase() === 'r') s.reset()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
}

export default function App() {
  useClock()
  const mode = useLabStore((s) => s.mode)
  const [panel, setPanel] = useState<'lessons' | 'help' | 'notebook' | 'transfer' | null>(null)
  const [reagent, setReagent] = useState<{ id: string; target?: string; dropper?: boolean } | null>(
    null,
  )
  const openReagent = useCallback(
    (id: string, target?: string, dropper?: boolean) => setReagent({ id, target, dropper }),
    [],
  )
  const closePanel = useCallback(() => setPanel(null), []),
    closeReagent = useCallback(() => setReagent(null), [])
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setPanel('lessons')
          }}
          aria-label="ChemLab 实验选择"
        >
          <div className="brand-mark">
            <FlaskConical size={25} strokeWidth={1.6} />
            <i />
          </div>
          <div>
            <span>
              Chem<span>Lab</span>
              <sup>®</sup>
            </span>
            <small>让化学反应，看得见</small>
          </div>
        </a>
        <nav className="main-nav" aria-label="实验模式">
          <button className={mode === 'guided' ? 'active' : ''} onClick={() => setPanel('lessons')}>
            <BookOpen size={15} />
            教学实验<span>10</span>
          </button>
          <button
            className={mode === 'free' ? 'active' : ''}
            onClick={() => {
              if (mode !== 'free') useLabStore.getState().freeLab()
            }}
          >
            <Sparkles size={15} />
            自由实验
          </button>
        </nav>
        <div className="header-actions">
          <div className="local-status">
            <span className="live-dot" />
            本地实验室
          </div>
          <button className="notebook-button" onClick={() => setPanel('notebook')}>
            <NotebookPen size={16} />
            <span>实验记录</span>
          </button>
          <button
            className="icon-button header-help"
            onClick={() => setPanel('help')}
            aria-label="操作帮助"
          >
            <HelpCircle size={19} />
          </button>
          <button className="new-experiment" onClick={() => setPanel('lessons')}>
            <Plus size={16} />
            新实验
          </button>
        </div>
      </header>
      <main className="workspace">
        <Library onReagent={openReagent} onHelp={() => setPanel('help')} />
        <div className="center-workspace">
          <Bench onReagent={openReagent} onTransfer={() => setPanel('transfer')} />
          <Timeline />
          <div className="workspace-footer">
            <span>
              <Leaf size={12} />
              每一次探索，都是理解世界的一小步。
            </span>
            <span>
              CHEMLAB <i /> 交互式化学实验室
            </span>
          </div>
        </div>
        <Analysis />
      </main>
      <Toast />
      {reagent && (
        <ReagentDialog
          key={reagent.id + (reagent.dropper ? 'drop' : '')}
          id={reagent.id}
          targetId={reagent.target}
          dropper={reagent.dropper}
          onClose={closeReagent}
        />
      )}
      {panel === 'transfer' && <TransferDialog onClose={closePanel} />}
      {panel === 'lessons' && (
        <Modal title="选择一次新的探索" onClose={closePanel} wide>
          <div className="lesson-modal-intro">
            <div>
              <span className="eyebrow">LEARN BY EXPERIMENTING</span>
              <p>从一个问题出发，让反应给你答案。</p>
            </div>
            <span className="badge">
              <FlaskConical size={12} />
              10 个交互实验
            </span>
          </div>
          <div className="lesson-grid">
            {lessons.map((l, i) => (
              <button
                className="lesson-option"
                key={l.id}
                onClick={() => {
                  useLabStore.getState().loadLesson(l.id)
                  closePanel()
                }}
              >
                <div className="lesson-art" style={{ background: l.color + '17', color: l.color }}>
                  <span>{l.icon}</span>
                  <small>EXPERIMENT {String(i + 1).padStart(2, '0')}</small>
                  <span className="lesson-art-orbit" />
                  <span className="lesson-art-orbit second" />
                </div>
                <div className="lesson-option-copy">
                  <span>{l.tag}</span>
                  <h3>{l.title}</h3>
                  <p>{l.subtitle}</p>
                  <ChevronRight size={15} />
                </div>
              </button>
            ))}
          </div>
          <button
            className="free-mode-choice"
            onClick={() => {
              useLabStore.getState().freeLab()
              closePanel()
            }}
          >
            <Sparkles size={18} />
            <div>
              <b>想试试自己的想法？</b>
              <span>进入自由实验，组合试剂与仪器</span>
            </div>
            <ArrowUpRight size={20} />
          </button>
        </Modal>
      )}
      {panel === 'help' && (
        <Modal title="欢迎来到 ChemLab" onClose={closePanel}>
          <div className="help-content">
            <p className="help-lead">这是一个可以操作、观察与回放的数字化学实验台。</p>
            <ol>
              <li>
                <b>选实验。</b>教学模式提供十个实验的引导步骤；自由模式从一个空烧杯开始。
              </li>
              <li>
                <b>布置与混合。</b>
                左侧物品可点击或拖入实验台；点击试剂后设置物态、用量与浓度。先选中容器，再加热、滴加或转移。
              </li>
              <li>
                <b>观察真实状态。</b>
                右侧显示限制反应物、累计生成量、催化剂、温度与反应进度。蓝色沉淀与颜色变化随当前物质量生成。
              </li>
              <li>
                <b>控制时间。</b>播放后可暂停、以 0.25–4×
                运行或拖动时间轴。回到过去后改变条件，会从此处重新演算。
              </li>
              <li>
                <b>深入理解。</b>切换微观模式观察粒子组成；在实验记录中导出当前物质账本与操作日志。
              </li>
            </ol>
            <div className="help-model">
              <InfoBlock />
            </div>
            <div className="keyboard-help">
              <span>
                <kbd>Space</kbd> 播放 / 暂停
              </span>
              <span>
                <kbd>M</kbd> 微观模式
              </span>
              <span>
                <kbd>R</kbd> 重置
              </span>
            </div>
            <a
              className="source-link"
              href="https://github.com/oi789113/chemistry/tree/codex/chemlab-interactive"
              target="_blank"
              rel="noreferrer"
            >
              <GitBranch size={14} />
              查看项目代码与模型说明
              <ArrowUpRight size={14} />
            </a>
          </div>
        </Modal>
      )}
      {panel === 'notebook' && <Notebook onClose={closePanel} />}
    </div>
  )
}
function InfoBlock() {
  return (
    <>
      <b>关于科学模型</b>
      <p>
        全部已支持的方程式经过配平与守恒测试。动力学、色彩和粒子运动是教学近似，不能用于实验室定量预测。物质被收录不代表它的所有反应都已实现；不支持的混合体系会明确提示。
      </p>
      <p>
        pH 仅针对已实现的强酸强碱体系，按 25 ℃
        参考计算；不推测盐类水解、弱酸平衡或危险副反应。不要依据虚拟实验自行进行危险的真实化学操作。
      </p>
    </>
  )
}
function Notebook({ onClose }: { onClose: () => void }) {
  const sim = useLabStore((s) => s.sim)
  return (
    <Modal title="实验记录" onClose={onClose}>
      <div className="notebook-summary">
        <NotebookPen size={25} />
        <div>
          <b>
            {sim.vessels.length} 件仪器 · {sim.events.length} 次操作
          </b>
          <p>模拟时间 {formatTime(sim.time)}，当前状态与物质账本保存在浏览器内存中。</p>
        </div>
      </div>
      <div className="event-list">
        {sim.events.map((event, i) => (
          <div key={i}>
            <span>{formatTime(event.time)}</span>
            <i />
            <p>{event.text}</p>
          </div>
        ))}
      </div>
      <p className="dialog-description">
        下载 JSON
        包含当前快照、单位、生成物、气体去向与操作日志。刷新页面会开始新实验；可先下载保留记录。
      </p>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose}>
          继续实验
        </button>
        <button className="primary-button" onClick={downloadNotebook}>
          <ArrowDownToLine size={16} />
          下载实验记录
        </button>
      </div>
    </Modal>
  )
}
function Toast() {
  const toast = useLabStore((s) => s.toast)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => useLabStore.setState({ toast: null }), 4000)
    return () => clearTimeout(id)
  }, [toast])
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <Check size={16} />
      <span>{toast.text}</span>
      <button onClick={() => useLabStore.setState({ toast: null })} aria-label="关闭提示">
        <X size={15} />
      </button>
    </div>
  )
}
