import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Beaker,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  GraduationCap,
  Leaf,
  NotebookPen,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  TestTubeDiagonal,
  X,
} from 'lucide-react';
import { Library } from './components/Library';
import { Bench } from './components/Bench';
import { Analysis } from './components/Analysis';
import { Timeline } from './components/Timeline';
import { Modal } from './components/Modal';
import { experiments } from './data/experiments';
import { startClock, useLab } from './store/lab';
import { Instrument } from './visuals/Instrument';
import { prettyFormula } from './chemistry/formula';
import { substanceById as db } from './data/substances';
import { amount } from './chemistry/engine';
import './styles.css';
export default function App() {
  const [dialog, setDialog] = useState<'experiments' | 'guide' | 'notes' | 'help' | null>(null),
    [query, setQuery] = useState('');
  const mode = useLab((s) => s.mode),
    id = useLab((s) => s.experimentId),
    notice = useLab((s) => s.notice),
    running = useLab((s) => s.running);
  const exp = experiments.find((e) => e.id === id) ?? experiments[0];
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => startClock(), []);
  useEffect(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (notice) toastTimer.current = setTimeout(() => useLab.getState().dismiss(), 5000);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [notice]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialog(null);
      if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes((e.target as HTMLElement).tagName) &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault();
        useLab.getState().setRunning(!useLab.getState().running);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="ChemLab 首页">
          <span className="brand-mark">
            <FlaskConical size={24} />
          </span>
          <span>
            Chem<span className="brand-lab">Lab</span>
            <small>交互式化学实验室</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <button
            className={!dialog || dialog === 'guide' ? 'active' : ''}
            onClick={() => setDialog(null)}
          >
            <Beaker size={16} />
            实验室
          </button>
          <button
            className={dialog === 'experiments' ? 'active' : ''}
            onClick={() => setDialog('experiments')}
          >
            <GraduationCap size={17} />
            实验课程<span className="nav-count">10</span>
          </button>
          <button className={dialog === 'notes' ? 'active' : ''} onClick={() => setDialog('notes')}>
            <NotebookPen size={16} />
            实验笔记
          </button>
        </nav>
        <div className="header-right">
          <span className="local-badge">
            <span />
            本地实验空间
          </span>
          <button
            className="icon-button help-button"
            aria-label="使用指南"
            onClick={() => setDialog('help')}
          >
            <CircleHelp size={19} />
          </button>
          <span className="avatar">
            C<span />
          </span>
        </div>
      </header>
      <main>
        <div className="workspace-bar">
          <div className="breadcrumbs">
            工作空间 <ChevronRight size={13} />
            <strong>虚拟实验室</strong>
          </div>
          <div className="mode-switch">
            <button
              className={mode === 'guided' ? 'active' : ''}
              onClick={() => {
                if (mode === 'free') setDialog('experiments');
              }}
            >
              <GraduationCap size={14} />
              教学实验
            </button>
            <button
              className={mode === 'free' ? 'active' : ''}
              onClick={() => {
                useLab.getState().newFree();
              }}
            >
              <Sparkles size={14} />
              自由探索
            </button>
          </div>
        </div>
        <section className="experiment-banner">
          <div className="experiment-banner-icon">
            <TestTubeDiagonal size={27} />
            <span className="banner-bubble one" />
            <span className="banner-bubble two" />
          </div>
          <div className="experiment-banner-copy">
            <div className="banner-kicker">
              <span>{mode === 'guided' ? '今日的科学探索' : '让好奇心开始反应'}</span>
              <span className="tag">
                {mode === 'guided' ? exp.difficulty : '自由实验 · 本地模拟'}
              </span>
            </div>
            <h1>
              {mode === 'guided' ? exp.title : '你的实验台，无限的好奇心'}
              <span className="title-period">.</span>
            </h1>
            <p>
              {mode === 'guided'
                ? exp.subtitle
                : '选择试剂与仪器，调节条件，观察每一次真实的物质变化。'}
            </p>
          </div>
          <div className="experiment-banner-actions">
            {mode === 'guided' && (
              <button className="button outline" onClick={() => setDialog('guide')}>
                <BookOpen size={15} />
                实验指导
              </button>
            )}
            <button className="button light" onClick={() => setDialog('experiments')}>
              {mode === 'guided' ? '切换实验' : '选择教学实验'}
              <ChevronDown size={15} />
            </button>
          </div>
          <div className="banner-watermark">
            <FlaskConical size={130} />
          </div>
        </section>
        <div className="lab-layout">
          <Library />
          <div className="center-stack">
            <Bench />
            <Timeline />
          </div>
          <Analysis />
        </div>
        <footer className="site-footer">
          <span>
            <Leaf size={13} />
            在虚拟世界中安全探索，在观察中理解化学。
          </span>
          <span>
            CHEMLAB <span> / </span> 让化学，触手可及 <span className="version">v1.0</span>
          </span>
        </footer>
      </main>
      {notice && (
        <div className={`toast ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          {notice.kind === 'success' ? <CheckCheck size={18} /> : <Beaker size={18} />}
          <span>{notice.text}</span>
          <button onClick={() => useLab.getState().dismiss()} aria-label="关闭提示">
            <X size={15} />
          </button>
        </div>
      )}
      {dialog && (
        <Modal
          onClose={() => setDialog(null)}
          labelledBy="app-dialog-title"
          className={`app-dialog ${dialog === 'experiments' ? 'experiments-dialog' : ''}`}
        >
          <button
            className="icon-button modal-close"
            onClick={() => setDialog(null)}
            aria-label="关闭窗口"
          >
            <X size={20} />
          </button>
          {dialog === 'experiments' && (
            <>
              <div className="eyebrow">EXPLORE THE ELEMENTS</div>
              <h2 id="app-dialog-title">
                每一个实验，都是新的发现<span className="title-period">.</span>
              </h2>
              <p className="dialog-intro">
                10 个交互实验，从微小气泡到明亮的燃烧。初始试剂自动装入，也可清空后一步步操作。
              </p>
              <label className="search-field experiment-search">
                <Search size={16} />
                <input
                  autoFocus
                  placeholder="寻找一个实验…"
                  aria-label="搜索教学实验"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="experiment-grid">
                {experiments
                  .filter((e) => `${e.title}${e.tag}`.toLowerCase().includes(query.toLowerCase()))
                  .map((e, i) => (
                    <button
                      className={`experiment-card ${id === e.id ? 'current' : ''}`}
                      key={e.id}
                      onClick={() => {
                        useLab.getState().loadExperiment(e.id);
                        setDialog(null);
                      }}
                    >
                      <div className={`experiment-card-art art-${i % 4}`}>
                        <Instrument kind={e.equipment} icon />
                        <span>{String(experiments.indexOf(e) + 1).padStart(2, '0')}</span>
                        {id === e.id && (
                          <small>
                            <Check size={12} />
                            当前实验
                          </small>
                        )}
                      </div>
                      <div className="experiment-card-copy">
                        <span>
                          {e.tag} <span>·</span> {e.difficulty}
                        </span>
                        <h3>{e.title}</h3>
                        <p>{e.subtitle}</p>
                        <div>
                          进入实验
                          <ArrowRight size={15} />
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}
          {dialog === 'guide' && (
            <>
              <div className="eyebrow">EXPERIMENT GUIDE</div>
              <h2 id="app-dialog-title">{exp.title}</h2>
              <p className="dialog-intro">{exp.goal}</p>
              <div className="guide-steps">
                {exp.steps.map((step, i) => (
                  <div key={i}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{['准备与加样', '配置与观察', '理解与验证'][i]}</h3>
                      <p>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="guide-tip">
                <Sparkles size={18} />
                <p>{exp.explanation}</p>
              </div>
              <div className="guide-footer">
                <button
                  className="button outline"
                  onClick={() => {
                    useLab.getState().loadExperiment(exp.id, false);
                    setDialog(null);
                  }}
                >
                  <RotateCcw size={15} />
                  空台逐步操作
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    useLab.getState().setRunning(true);
                    setDialog(null);
                  }}
                >
                  <Play size={15} />
                  {running ? '回到实验' : '开始观察'}
                </button>
              </div>
            </>
          )}
          {dialog === 'notes' && <Notes />}
          {dialog === 'help' && (
            <>
              <div className="eyebrow">WELCOME TO CHEMLAB</div>
              <h2 id="app-dialog-title">把好奇心，带到实验台上。</h2>
              <div className="help-steps">
                <div>
                  <span>01</span>
                  <p>
                    <strong>选取与加样</strong>
                    点击左侧试剂设置用量，也可将试剂或仪器拖到台面。点击容器后，所有条件与分析都会跟随该容器。
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <p>
                    <strong>操作与观察</strong>
                    加热需要打开酒精灯；镁燃烧需要点燃。倒液、连接、过滤先选来源，再点接收容器。集气需要橡胶塞和导管。
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <p>
                    <strong>回放与理解</strong>
                    空格暂停/播放；调整速度或拖动时间轴回看。微观模式显示原子重组与离子反应，笔记可导出当前物质账本。
                  </p>
                </div>
              </div>
              <div className="guide-tip">
                <CircleHelp size={18} />
                <p>
                  仅对已实现的反应规则进行计算。速率、pH
                  与热过程采用教学近似，不能用来预测真实实验安全性。当前不模拟密闭加热压力。
                </p>
              </div>
              <button className="button primary wide" onClick={() => setDialog(null)}>
                开始探索
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
function Notes() {
  const lab = useLab((s) => s.lab),
    history = useLab((s) => s.history),
    id = useLab((s) => s.experimentId),
    logs = useLab((s) => s.logs);
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem('chemlab-notes') ?? '';
    } catch {
      return '';
    }
  });
  const first = history[0].lab;
  const ids = [
    ...new Set(
      [...first.vessels, ...lab.vessels].flatMap((v) =>
        v.contents.filter((m) => m.id !== 'h2o' && m.moles > 1e-9).map((m) => m.id),
      ),
    ),
  ];
  const total = (state: typeof lab, id: string) =>
    state.vessels.reduce((n, v) => n + amount(v, id), 0);
  const download = () => {
    const result = {
      schemaVersion: 1,
      experiment: id,
      exportedAt: new Date().toISOString(),
      model: 'ChemLab educational approximation',
      time: lab.time,
      lab,
      initial: first,
      logs: logs.filter((l) => l.time <= lab.time),
      notes,
    };
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemlab-${id || 'free'}-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="eyebrow">OBSERVE & UNDERSTAND</div>
      <h2 id="app-dialog-title">我的实验笔记</h2>
      <p className="dialog-intro">
        记录一个现象，理解一次变化。当前实验时间 {lab.time.toFixed(1)} s。
      </p>
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>物质</th>
              <th>初始 / mmol</th>
              <th>当前 / mmol</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => (
              <tr key={id}>
                <td>
                  {db[id].name}
                  <small>{prettyFormula(db[id].formula)}</small>
                </td>
                <td>{(total(first, id) * 1000).toFixed(3)}</td>
                <td>{(total(lab, id) * 1000).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="notes-label">
        观察与思考
        <textarea
          aria-label="实验笔记"
          placeholder="我观察到… 我想进一步探究…"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            try {
              localStorage.setItem('chemlab-notes', e.target.value);
            } catch {
              useLab.getState().tell('浏览器存储不可用，可导出笔记', 'error');
            }
          }}
        />
      </label>
      <div className="notes-footer">
        <span>
          <Check size={13} />
          笔记保存在此浏览器
        </span>
        <button className="button primary" onClick={download}>
          <ArrowDownToLine size={15} />
          导出实验记录
        </button>
      </div>
    </>
  );
}
