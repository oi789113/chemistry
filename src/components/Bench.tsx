import { useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Atom,
  CircleHelp,
  Expand,
  Flame,
  Link2,
  MousePointer2,
  Pipette,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Thermometer,
  Trash2,
  X,
  Filter,
  FlaskConical,
  Move,
  Droplets,
  Wind,
} from 'lucide-react';
import { useLab, selectedVessel, vesselSummary } from '../store/lab';
import type { EquipmentKind } from '../chemistry/types';
import { equipmentByKind, isContainer } from '../data/equipment';
import { experiments } from '../data/experiments';
import { substanceById as db } from '../data/substances';
import { amount, gasVolume, volume } from '../chemistry/engine';
import { Instrument } from '../visuals/Instrument';
import { Particles } from '../visuals/Particles';
import { Microscope } from '../visuals/Microscope';
import { DoseDialog } from './Library';
import { Formula } from './Equation';
export function Bench() {
  const lab = useLab((s) => s.lab),
    selected = useLab((s) => s.selected),
    running = useLab((s) => s.running),
    micro = useLab((s) => s.microscopic),
    action = useLab((s) => s.actionMode),
    source = useLab((s) => s.actionSource);
  const mode = useLab((s) => s.mode),
    experimentId = useLab((s) => s.experimentId),
    dropping = useLab((s) => s.dropping);
  const v = useLab(selectedVessel),
    wrapper = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLDivElement>(null);
  const [dose, setDose] = useState<{ id: string; target?: string } | null>(null),
    [help, setHelp] = useState(false),
    [settings, setSettings] = useState(true),
    [dragOver, setDragOver] = useState(false);
  const exp = experiments.find((e) => e.id === experimentId);
  const containerSelected = v && isContainer(v.kind);
  const onDrop = (e: React.DragEvent, target?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const kind = e.dataTransfer.getData('application/chemlab-equipment') as EquipmentKind;
    const reagent = e.dataTransfer.getData('application/chemlab-reagent');
    const rect = stage.current!.getBoundingClientRect();
    if (kind && equipmentByKind[kind])
      useLab
        .getState()
        .addEquipment(
          kind,
          ((e.clientX - rect.left) / rect.width) * 900 - 90,
          ((e.clientY - rect.top) / rect.height) * 490 - 90,
        );
    if (reagent && db[reagent]) setDose({ id: reagent, target: target ?? selected });
  };
  return (
    <section className="bench-column" ref={wrapper}>
      <div className="bench-heading">
        <div className="bench-title">
          <span className="live-indicator" />
          <h2>实验操作台</h2>
          <span className="subtle-label">WORKBENCH</span>
        </div>
        <div className="bench-heading-actions">
          <button className="icon-button" aria-label="操作帮助" onClick={() => setHelp(!help)}>
            <CircleHelp size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="全屏实验台"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void wrapper.current?.requestFullscreen();
            }}
          >
            <Expand size={17} />
          </button>
        </div>
      </div>
      <div className="bench-panel panel">
        <div className="bench-topbar">
          <div className="view-switch">
            <button
              className={!micro ? 'active' : ''}
              onClick={() => useLab.getState().setMicroscopic(false)}
            >
              <FlaskConical size={15} />
              实验视图
            </button>
            <button
              className={micro ? 'active' : ''}
              onClick={() => useLab.getState().setMicroscopic(true)}
            >
              <Atom size={16} />
              微观视图
            </button>
          </div>
          <span className="ambient">
            <span /> 环境 22 °C · 常压
          </span>
        </div>
        {action && (
          <div className="action-banner">
            <Link2 size={15} />{' '}
            {action === 'connect'
              ? '点击集气瓶，建立气体通路'
              : action === 'filter'
                ? '点击接收容器，滤液将转移、不溶物留在原容器'
                : '点击接收容器，倒入 50% 内容物'}
            <button onClick={() => useLab.getState().setAction(null)}>
              <X size={14} />
              取消
            </button>
          </div>
        )}
        <div
          className={`stage ${dragOver ? 'drag-over' : ''} ${running ? 'simulation-running' : 'simulation-paused'}`}
          ref={stage}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => onDrop(e)}
        >
          <div className="stage-light" />
          <div className="stage-back-grid" />
          <div className="stage-floor" />
          <div className="stage-mark">
            <FlaskConical size={15} /> CHEMLAB <span>VIRTUAL LABORATORY</span>
          </div>
          <div className="bench-status-chip">
            <span className={running ? 'status-pulse' : ''} />
            {running ? '实时模拟中' : '实验已暂停'}
            <span className="status-divider" /> {lab.time.toFixed(1)} s
          </div>
          <svg
            className="connection-layer"
            viewBox="0 0 900 490"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tube-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#aec3c5" />
                <stop offset=".4" stopColor="#eaf5f1" />
                <stop offset="1" stopColor="#93b0b3" />
              </linearGradient>
            </defs>
            {lab.connections.map((c) => {
              const a = lab.vessels.find((v) => v.uid === c.from),
                b = lab.vessels.find((v) => v.uid === c.to);
              if (!a || !b) return null;
              const x1 = a.x + 90,
                y1 = a.y + 14,
                x2 = b.x + 90,
                y2 = b.y + 160,
                bend = Math.min(y1, b.y + 20) - 60;
              const path = `M${x1} ${y1} V${bend + 16} Q${x1} ${bend} ${x1 + 20} ${bend} H${x2 - 20} Q${x2} ${bend} ${x2} ${bend + 20} V${y2}`;
              const flow = a.sealed && Object.values(a.records).some((r) => r.rate > 0) && running;
              return (
                <g key={c.from}>
                  <path d={path} stroke="#76989b" strokeWidth="8" fill="none" opacity=".65" />
                  <path d={path} stroke="url(#tube-gradient)" strokeWidth="5.5" fill="none" />
                  {flow && (
                    <path
                      className="gas-flow"
                      d={path}
                      stroke="#77bfb0"
                      strokeWidth="3"
                      strokeDasharray="2 25"
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                  <rect
                    x={(x1 + x2) / 2 - 40}
                    y={bend - 24}
                    width="80"
                    height="19"
                    rx="8"
                    fill="#edf5ef"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={bend - 11}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#73918a"
                  >
                    {a.sealed ? '气体通路' : '未密封 · 逸出'}
                  </text>
                </g>
              );
            })}
            {lab.visual &&
              lab.time - lab.visual.at < 1.2 &&
              (() => {
                const visual = lab.visual,
                  to = lab.vessels.find((v) => v.uid === visual.to),
                  from = lab.vessels.find((v) => v.uid === visual.from);
                if (!to) return null;
                const tx = to.x + 90,
                  ty = to.y + 75,
                  age = Math.max(0, lab.time - visual.at);
                return (
                  <g className="operation-stream" opacity={1 - age / 1.2}>
                    {from ? (
                      <>
                        <path
                          d={`M${from.x + 140} ${from.y + 80} Q${tx} ${from.y + 50} ${tx} ${ty + 75}`}
                          stroke="#8cc7d5"
                          strokeWidth="5"
                          strokeLinecap="round"
                          fill="none"
                          opacity=".7"
                        />
                        <path
                          className="gas-flow"
                          d={`M${from.x + 140} ${from.y + 80} Q${tx} ${from.y + 50} ${tx} ${ty + 75}`}
                          stroke="#e3fcff"
                          strokeWidth="2"
                          strokeDasharray="3 13"
                          fill="none"
                        />
                      </>
                    ) : (
                      <>
                        <path
                          d={`M${tx - 5} ${ty - 50} L${tx + 5} ${ty - 50} L${tx + 3} ${ty - 5} L${tx} ${ty + 6} L${tx - 3} ${ty - 5}Z`}
                          fill="#d6e8e8"
                          stroke="#8faeb5"
                        />
                        <circle
                          cx={tx}
                          cy={ty + 20 + age * 45}
                          r="4"
                          fill={visual.id ? db[visual.id].color : '#8cc7d5'}
                        />
                      </>
                    )}
                  </g>
                );
              })()}
          </svg>
          {lab.vessels.map((item) => {
            const container = isContainer(item.kind);
            const activeBurner = item.kind === 'burner' && lab.vessels.some((v) => v.heating);
            return (
              <div
                key={item.uid}
                data-testid={`vessel-${item.uid}`}
                data-kind={item.kind}
                className={`instrument-item ${selected === item.uid ? 'selected' : ''} ${source === item.uid ? 'action-source' : ''} ${item.kind === 'stand' ? 'stand-item' : ''}`}
                style={{ left: `${item.x / 9}%`, top: `${item.y / 4.9}%` }}
              >
                {container && <div className="selection-ring" />}
                <button
                  className="instrument-handle"
                  aria-label={`${equipmentByKind[item.kind].name} ${item.uid}`}
                  onClick={() => {
                    if (!container && item.kind === 'burner') {
                      if (containerSelected) useLab.getState().toggleHeat();
                      else useLab.getState().tell('请先选择需要加热的容器');
                      return;
                    }
                    if (!container) {
                      useLab.getState().addEquipment(item.kind);
                      return;
                    }
                    useLab.getState().select(item.uid);
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const rect = stage.current!.getBoundingClientRect(),
                      startX = e.clientX,
                      startY = e.clientY;
                    let moved = false;
                    if (item.secured) {
                      useLab.getState().tell('容器已固定，使用铁架台或试管夹可解除');
                      return;
                    }
                    const node = e.currentTarget;
                    node.setPointerCapture(e.pointerId);
                    const pointerMove = (ev: PointerEvent) => {
                      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) moved = true;
                      if (moved) {
                        const x = Math.max(
                            0,
                            Math.min(720, item.x + ((ev.clientX - startX) / rect.width) * 900),
                          ),
                          y = Math.max(
                            15,
                            Math.min(
                              item.kind === 'burner' ? 250 : 210,
                              item.y + ((ev.clientY - startY) / rect.height) * 490,
                            ),
                          );
                        const el = node.parentElement!;
                        el.style.left = `${x / 9}%`;
                        el.style.top = `${y / 4.9}%`;
                      }
                    };
                    const pointerUp = (ev: PointerEvent) => {
                      node.removeEventListener('pointermove', pointerMove);
                      node.removeEventListener('pointerup', pointerUp);
                      node.removeEventListener('pointercancel', cancel);
                      if (moved) {
                        useLab
                          .getState()
                          .move(
                            item.uid,
                            item.x + ((ev.clientX - startX) / rect.width) * 900,
                            item.y + ((ev.clientY - startY) / rect.height) * 490,
                          );
                        useLab.getState().select(item.uid);
                      }
                    };
                    const cancel = () => {
                      node.removeEventListener('pointermove', pointerMove);
                      node.removeEventListener('pointerup', pointerUp);
                      node.removeEventListener('pointercancel', cancel);
                      node.parentElement!.style.left = `${item.x / 9}%`;
                      node.parentElement!.style.top = `${item.y / 4.9}%`;
                    };
                    node.addEventListener('pointermove', pointerMove);
                    node.addEventListener('pointerup', pointerUp);
                    node.addEventListener('pointercancel', cancel);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, item.uid)}
                >
                  <Instrument
                    kind={item.kind}
                    vessel={item}
                    running={item.kind === 'burner' ? running && activeBurner : running}
                  />
                  {container && <Particles uid={item.uid} />}
                </button>
                {container && (
                  <button
                    className={`instrument-label ${selected === item.uid ? 'active' : ''}`}
                    onClick={() => useLab.getState().select(item.uid)}
                  >
                    <span>
                      {selected === item.uid && <span className="tiny-dot" />}
                      {equipmentByKind[item.kind].name}
                      {item.sealed && <span className="seal-tag">密封</span>}
                      {item.secured && <span className="seal-tag">固定</span>}
                    </span>
                    <small>{vesselSummary(item)}</small>
                  </button>
                )}
                {container && item.kind === 'gas-jar' && (
                  <div className="gas-meter">
                    <span
                      style={{
                        width: `${Math.min(100, (gasVolume(item) / (equipmentByKind[item.kind].capacity ?? 250)) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div className="stage-hint">
            <Move size={13} /> 拖动仪器调整位置 <span>·</span> 点击选择，拖入试剂
          </div>
          {micro && <Microscope />}
        </div>
        <div className="bench-tools">
          <div className="tool-group">
            <button
              className={!action && !dropping ? 'active' : ''}
              title="选择容器"
              onClick={() => {
                useLab.getState().setAction(null);
                useLab.setState({ dropping: false });
              }}
            >
              <MousePointer2 size={17} />
              <span>选择</span>
            </button>
            <button
              className={dropping ? 'active' : ''}
              onClick={() => useLab.getState().addEquipment('dropper')}
            >
              <Pipette size={17} />
              <span>滴加</span>
            </button>
            <button
              className={action === 'pour' ? 'active' : ''}
              onClick={() => useLab.getState().setAction(action === 'pour' ? null : 'pour')}
            >
              <ArrowRightLeft size={17} />
              <span>倒液</span>
            </button>
            <button
              className={action === 'connect' ? 'active' : ''}
              onClick={() => useLab.getState().setAction(action === 'connect' ? null : 'connect')}
            >
              <Link2 size={17} />
              <span>连接</span>
            </button>
            <button
              className={action === 'filter' ? 'active' : ''}
              onClick={() => useLab.getState().setAction(action === 'filter' ? null : 'filter')}
            >
              <Filter size={17} />
              <span>过滤</span>
            </button>
          </div>
          <div className="tool-group">
            <button
              className={v?.heating ? 'warm-active' : ''}
              onClick={() => useLab.getState().toggleHeat()}
            >
              <Flame size={17} />
              <span>加热</span>
            </button>
            <button className={settings ? 'active' : ''} onClick={() => setSettings(!settings)}>
              <SlidersHorizontal size={17} />
              <span>条件</span>
            </button>
          </div>
        </div>
        {help && (
          <div className="help-inline">
            <strong>操作提示</strong>
            <p>
              从左侧拖入仪器或试剂。选中容器后可滴加、搅拌、加热和密封；倒液与过滤先选来源，再点接收容器。连接需要密封的发生容器和集气瓶。暂停时可准备试剂，点击播放后计算反应。
            </p>
          </div>
        )}
      </div>
      {settings && (
        <div className="condition-panel panel">
          <div className="condition-heading">
            <h3>
              <SlidersHorizontal size={15} />
              反应条件
            </h3>
            <span>{containerSelected ? equipmentByKind[v.kind].name : '先选择容器'}</span>
          </div>
          <div className="condition-controls">
            <div className="temperature-control">
              <label htmlFor="temperature">
                <Thermometer size={15} /> 目标温度{' '}
                <strong>
                  {v?.targetTemp ?? 80}
                  <small> °C</small>
                </strong>
              </label>
              <input
                id="temperature"
                aria-label="目标温度"
                type="range"
                min="22"
                max="600"
                step="1"
                value={v?.targetTemp ?? 80}
                disabled={!containerSelected}
                onChange={(e) => useLab.getState().setTemperature(Number(e.target.value))}
              />
              <div className="range-label">
                <span>22 °C</span>
                <span>600 °C</span>
              </div>
            </div>
            <div className="condition-toggles">
              <button
                className={v?.sealed ? 'toggle active' : 'toggle'}
                onClick={() => useLab.getState().toggleSeal()}
              >
                <span className="toggle-track" />
                橡胶塞密封
              </button>
              <button
                className={v?.stirred ? 'toggle active' : 'toggle'}
                onClick={() => useLab.getState().addEquipment('rod')}
              >
                <span className="toggle-track" />
                玻璃棒搅拌
              </button>
              <button
                className={v?.ignited ? 'toggle active ignition' : 'toggle ignition'}
                onClick={() => useLab.getState().ignite()}
              >
                <span className="toggle-track" />
                点燃 / 熄灭
              </button>
            </div>
            <div className="catalyst-control">
              <span>催化剂 · MnO₂</span>
              <div>
                <span className={v && amount(v, 'mno2') ? 'catalyst-present' : 'muted'}>
                  {v && amount(v, 'mno2') ? '已加入 · 保留' : '未加入'}
                </span>
                <button
                  title="加入 0.15 g 二氧化锰"
                  onClick={() =>
                    useLab
                      .getState()
                      .add({ id: 'mno2', amount: 0.15, phase: 's', concentration: 1 })
                  }
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>
              {mode === 'guided' && experimentId === 'peroxide' && (
                <button
                  className="text-button"
                  onClick={() => useLab.getState().loadExperiment('peroxide', true, false)}
                >
                  载入无催化剂对照 <ArrowRightLeft size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {mode === 'guided' && exp && (
        <div className="recipe-panel panel">
          <div className="condition-heading">
            <h3>
              <Droplets size={16} />
              本次实验试剂
            </h3>
            <button
              className="text-button"
              onClick={() => useLab.getState().loadExperiment(exp.id, false)}
            >
              <RotateCcw size={12} />
              清空重做
            </button>
          </div>
          <div className="recipe-chips">
            {exp.doses.map((d, i) => (
              <button
                key={`${d.id}-${i}`}
                title="再次加入该用量（初始试剂已装入）"
                onClick={() =>
                  useLab
                    .getState()
                    .add({ ...d, amount: dropping && d.phase === 'aq' ? 0.5 : d.amount })
                }
              >
                <span style={{ background: db[d.id].color }} />
                <Formula value={db[d.id].formula} />
                <small>
                  {d.amount} {d.phase === 's' ? 'g' : 'mL'}
                </small>
                <Plus size={12} />
              </button>
            ))}
          </div>
          <p>
            {['neutralization', 'indicator'].includes(exp.id)
              ? '已预装碱与酚酞，请点击 HCl 逐滴加入，观察粉红色褪去。'
              : '初始配方已装入。清空重做可逐步加样；上方按钮会继续追加试剂。'}
          </p>
        </div>
      )}
      {v && (
        <div className="bench-meta">
          <span>
            <Wind size={13} /> 气体体积按当前温度、1 atm 计算
          </span>
          <span>
            {volume(v).toFixed(1)} mL 液体{' '}
            <button title="清空容器" onClick={() => useLab.getState().clearVessel()}>
              <Trash2 size={13} />
            </button>
            <button className="text-button" onClick={() => useLab.getState().removeEquipment()}>
              移除仪器
            </button>
          </span>
        </div>
      )}
      {dose && (
        <DoseDialog substance={db[dose.id]} target={dose.target} onClose={() => setDose(null)} />
      )}
    </section>
  );
}
