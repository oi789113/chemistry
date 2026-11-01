import { create } from 'zustand';
import {
  addDose,
  amount,
  createVessel,
  gasVolume,
  stepLab,
  transfer,
  volume,
} from '../chemistry/engine';
import type { Dose, EquipmentKind, LabState, Vessel } from '../chemistry/types';
import { equipmentByKind, isContainer } from '../data/equipment';
import { experiments } from '../data/experiments';
let nextId = 100;
const uid = () => `item-${nextId++}`;
export interface Notice {
  text: string;
  kind: 'info' | 'success' | 'error';
  key: number;
}
export interface Log {
  time: number;
  text: string;
}
interface Snapshot {
  lab: LabState;
  label?: string;
}
interface LabStore {
  lab: LabState;
  selected: string;
  running: boolean;
  speed: number;
  mode: 'guided' | 'free';
  experimentId: string;
  microscopic: boolean;
  history: Snapshot[];
  cursor: number;
  logs: Log[];
  notice: Notice | null;
  dropping: boolean;
  actionMode: 'connect' | 'pour' | 'filter' | null;
  actionSource: string | null;
  heldSubstance: string | null;
  tools: Record<string, string[]>;
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
  loadExperiment: (id: string, prepared?: boolean, catalyst?: boolean) => void;
  newFree: () => void;
  addEquipment: (kind: EquipmentKind, x?: number, y?: number) => void;
  move: (uid: string, x: number, y: number) => void;
  select: (uid: string) => void;
  add: (dose: Dose, target?: string) => void;
  setTemperature: (temp: number) => void;
  toggleHeat: () => void;
  ignite: () => void;
  toggleSeal: () => void;
  setAction: (mode: 'connect' | 'pour' | 'filter' | null) => void;
  completeAction: (uid: string, fraction?: number) => void;
  seek: (index: number) => void;
  setMicroscopic: (v: boolean) => void;
  setHeld: (id: string | null) => void;
  clearVessel: () => void;
  removeEquipment: () => void;
  tell: (text: string, kind?: Notice['kind']) => void;
  dismiss: () => void;
}
function preset(id: string, prepared = true, catalyst = true) {
  const exp = experiments.find((e) => e.id === id)!;
  let main = createVessel(exp.equipment, 'reactor', exp.collection ? 260 : 310, 135);
  if (prepared)
    for (const dose of exp.doses)
      if (
        (catalyst || dose.id !== 'mno2') &&
        (!['neutralization', 'indicator'].includes(id) || dose.id !== 'hcl')
      )
        main = addDose(main, dose);
  main.targetTemp = exp.temperature ?? 80;
  const vessels: Vessel[] = [main];
  const connections: LabState['connections'] = [];
  if (exp.collection) {
    vessels.push(createVessel('gas-jar', 'collector', 610, 142));
    main.sealed = true;
    connections.push({ from: main.uid, to: 'collector' });
    const stand = createVessel('stand', 'stand', 125, 115);
    vessels.unshift(stand);
  }
  if (exp.temperature) vessels.push(createVessel('burner', 'lamp', main.x, main.y + 95));
  if (id === 'separation') {
    vessels.push(createVessel('dish', 'receiver', 610, 195));
    vessels.push(createVessel('funnel', 'filter', 610, 65));
  }
  return { vessels, connections, time: 0 };
}
const initial = preset('peroxide');
export const useLab = create<LabStore>((set, get) => {
  const tell = (text: string, kind: Notice['kind'] = 'info') =>
    set({ notice: { text, kind, key: Date.now() } });
  const record = (lab: LabState, label?: string, extra: Partial<LabStore> = {}) => {
    const s = get();
    const past = s.history.slice(0, s.cursor + 1);
    const history = [...past, { lab: structuredClone(lab), label }];
    // A 10 minute ring buffer at 10 Hz bounds browser memory.
    if (history.length > 6001) history.shift();
    const logs =
      label || s.cursor < s.history.length - 1
        ? [
            ...past.filter((h) => h.label).map((h) => ({ time: h.lab.time, text: h.label! })),
            ...(label ? [{ time: lab.time, text: label }] : []),
          ].slice(-150)
        : s.logs;
    set({ lab, history, cursor: history.length - 1, logs, ...extra });
  };
  const mutate = (fn: (v: Vessel, lab: LabState) => void, label: string) => {
    const lab = structuredClone(get().lab),
      v = lab.vessels.find((v) => v.uid === get().selected);
    if (!v || !isContainer(v.kind)) {
      tell('请先选择一个反应容器', 'error');
      return;
    }
    fn(v, lab);
    record(lab, label);
  };
  const reset = (lab: LabState, mode: 'guided' | 'free', experimentId: string) =>
    set({
      lab,
      mode,
      experimentId,
      selected: lab.vessels.find((v) => isContainer(v.kind))!.uid,
      running: false,
      history: [{ lab: structuredClone(lab) }],
      cursor: 0,
      logs: [
        {
          time: 0,
          text: mode === 'guided' ? '教学实验已装配，可调节条件后开始' : '自由实验台已就绪',
        },
      ],
      tools: {},
      actionMode: null,
      actionSource: null,
      dropping: false,
      notice: null,
    });
  return {
    lab: initial,
    selected: 'reactor',
    running: false,
    speed: 1,
    mode: 'guided',
    experimentId: 'peroxide',
    microscopic: false,
    history: [{ lab: structuredClone(initial) }],
    cursor: 0,
    logs: [{ time: 0, text: '过氧化氢与 MnO₂ 已装入，导管已连接' }],
    notice: null,
    dropping: false,
    actionMode: null,
    actionSource: null,
    heldSubstance: null,
    tools: {},
    tell,
    dismiss: () => set({ notice: null }),
    setRunning: (running) => set({ running }),
    setSpeed: (speed) => {
      if ([0.25, 0.5, 1, 2, 4].includes(speed)) set({ speed });
    },
    tick: () => {
      const s = get();
      if (!s.running) return;
      if (s.cursor < s.history.length - 1) {
        const cursor = s.cursor + 1;
        set({ cursor, lab: structuredClone(s.history[cursor].lab) });
        return;
      }
      record(stepLab(s.lab, 0.1));
    },
    loadExperiment: (id, prepared = true, catalyst = true) => {
      if (experiments.some((e) => e.id === id)) reset(preset(id, prepared, catalyst), 'guided', id);
    },
    newFree: () =>
      reset(
        { vessels: [createVessel('beaker', 'reactor', 310, 135)], connections: [], time: 0 },
        'free',
        '',
      ),
    setMicroscopic: (microscopic) => set({ microscopic }),
    setHeld: (heldSubstance) => set({ heldSubstance }),
    seek: (index) => {
      const s = get(),
        cursor = Math.max(0, Math.min(s.history.length - 1, Math.round(index)));
      set({ running: false, cursor, lab: structuredClone(s.history[cursor].lab) });
    },
    move: (id, x, y) => {
      const lab = structuredClone(get().lab),
        v = lab.vessels.find((v) => v.uid === id);
      if (v?.secured) {
        tell('容器已固定，请先点击铁架台或试管夹解除固定');
        return;
      }
      if (v) {
        v.x = Math.max(0, Math.min(720, x));
        v.y = Math.max(0, Math.min(v.kind === 'burner' ? 250 : 210, y));
        record(lab);
      }
    },
    select: (id) => {
      const s = get();
      if (s.actionMode && s.actionSource && id !== s.actionSource) {
        s.completeAction(id);
        return;
      }
      set({ selected: id });
    },
    addEquipment: (kind, x, y) => {
      const s = get();
      if (isContainer(kind)) {
        if (s.lab.vessels.filter((v) => isContainer(v.kind)).length >= 8) {
          tell('实验台最多同时放置 8 个容器', 'error');
          return;
        }
        const lab = structuredClone(s.lab),
          id = uid();
        const positions = [70, 450, 640, 270, 10, 530, 180, 360];
        const freeX =
          positions.find(
            (pos) => !lab.vessels.some((v) => isContainer(v.kind) && Math.abs(v.x - pos) < 165),
          ) ?? positions[s.lab.vessels.length % positions.length];
        lab.vessels.push(createVessel(kind, id, x ?? freeX, y ?? 135));
        record(lab, `放置${equipmentByKind[kind].name}`, { selected: id });
        return;
      }
      const v = s.lab.vessels.find((v) => v.uid === s.selected);
      if (!v || !isContainer(v.kind)) {
        tell('先点击反应容器，再使用此工具', 'error');
        return;
      }
      if (kind === 'dropper') {
        set({ dropping: !s.dropping });
        tell(s.dropping ? '已退出滴加模式' : '滴加模式：每次添加 0.5 mL 溶液');
        return;
      }
      if (kind === 'tube') {
        s.setAction('connect');
        return;
      }
      if (kind === 'burner') {
        s.toggleHeat();
      } else if (kind === 'stopper') {
        s.toggleSeal();
        return;
      } else if (kind === 'rod') {
        mutate((v) => {
          v.stirred = !v.stirred;
        }, '切换玻璃棒搅拌');
      } else if (kind === 'stand' || kind === 'clamp') {
        mutate((v) => {
          v.secured = !v.secured;
        }, '切换仪器固定状态');
        tell(v.secured ? '已解除固定' : '容器已固定；再次使用可解除', 'success');
      } else if (kind === 'thermometer') {
        mutate((v) => {
          v.measured = true;
        }, '使用温度计测温');
        tell(`当前${equipmentByKind[v.kind].name}温度 ${v.temperature.toFixed(1)} °C`);
      } else if (kind === 'funnel') {
        tell('漏斗已放置；点击「过滤」再选择接收容器');
      } else tell(`${equipmentByKind[kind].name}已用于选中容器`, 'success');
      const fresh = get(),
        lab = structuredClone(fresh.lab);
      if (!lab.vessels.some((a) => a.kind === kind))
        lab.vessels.push(
          createVessel(
            kind,
            uid(),
            x ?? v.x + (kind === 'burner' ? 0 : 120),
            y ?? (kind === 'burner' ? v.y + 95 : v.y + 20),
          ),
        );
      record(lab, `使用${equipmentByKind[kind].name}`, {
        tools: { ...fresh.tools, [v.uid]: [...new Set([...(fresh.tools[v.uid] ?? []), kind])] },
      });
    },
    add: (dose, target) => {
      const s = get(),
        id = target ?? s.selected,
        lab = structuredClone(s.lab),
        idx = lab.vessels.findIndex((v) => v.uid === id);
      if (idx < 0 || !isContainer(lab.vessels[idx].kind)) {
        tell('请先选择要加入试剂的容器', 'error');
        return;
      }
      try {
        lab.vessels[idx] = addDose(lab.vessels[idx], dose);
        lab.visual = { type: 'dose', to: id, id: dose.id, at: lab.time };
        record(lab, `加入 ${dose.amount} ${dose.phase === 's' ? 'g' : 'mL'} ${dose.id}`);
        set({ selected: id });
        tell('试剂已加入，点击开始观察反应', 'success');
      } catch (error) {
        tell((error as Error).message, 'error');
      }
    },
    setTemperature: (temp) => {
      if (Number.isFinite(temp) && temp >= 22 && temp <= 600)
        mutate((v) => {
          v.targetTemp = temp;
        }, `设定温度 ${temp} °C`);
    },
    toggleHeat: () => {
      mutate((v, lab) => {
        v.heating = !v.heating;
        const lamp = lab.vessels.find((a) => a.kind === 'burner');
        if (v.heating) {
          if (lamp) {
            lamp.x = v.x;
            lamp.y = v.y + 95;
          } else lab.vessels.push(createVessel('burner', uid(), v.x, v.y + 95));
        }
      }, '切换酒精灯加热');
    },
    ignite: () =>
      mutate((v) => {
        v.ignited = !v.ignited;
      }, '切换点燃状态'),
    toggleSeal: () =>
      mutate((v) => {
        v.sealed = !v.sealed;
      }, '切换橡胶塞密封'),
    setAction: (actionMode) => {
      const s = get(),
        v = s.lab.vessels.find((v) => v.uid === s.selected);
      if (!v || !isContainer(v.kind)) {
        tell('请先选择来源容器', 'error');
        return;
      }
      if (actionMode === 'filter' && !s.lab.vessels.some((v) => v.kind === 'funnel')) {
        tell('请先从仪器库添加漏斗（内含滤纸）', 'error');
        return;
      }
      if (actionMode === 'connect' && !v.sealed) {
        tell('请先为来源容器安装橡胶塞', 'error');
        return;
      }
      set({ actionMode, actionSource: actionMode ? s.selected : null });
      if (actionMode)
        tell(
          actionMode === 'connect'
            ? '点击集气瓶以连接导管'
            : `点击接收容器以${actionMode === 'filter' ? '过滤全部溶液' : '倒入一半液体'}`,
        );
    },
    completeAction: (toId, fraction = 0.5) => {
      const s = get();
      if (!s.actionMode || !s.actionSource) return;
      try {
        const to = s.lab.vessels.find((v) => v.uid === toId);
        if (!to || !isContainer(to.kind)) throw new Error('请选择接收容器');
        if (s.actionMode === 'connect') {
          if (to.kind !== 'gas-jar') throw new Error('导管出口请选择集气瓶');
          const lab = structuredClone(s.lab);
          lab.connections = lab.connections.filter((c) => c.from !== s.actionSource);
          lab.connections.push({ from: s.actionSource, to: toId });
          record(lab, '连接导管与集气瓶');
        } else {
          const next = transfer(
            s.lab,
            s.actionSource,
            toId,
            s.actionMode === 'filter' ? 1 : fraction,
            s.actionMode === 'filter',
          );
          next.vessels.find((v) => v.uid === s.actionSource)!.sealed = false;
          next.connections = next.connections.filter((c) => c.from !== s.actionSource);
          next.visual = { type: s.actionMode, from: s.actionSource, to: toId, at: next.time };
          record(
            next,
            s.actionMode === 'filter'
              ? '过滤：滤液转移，不溶物留在原容器'
              : '移开塞子与导管，倾倒转移 50% 内容物',
          );
        }
        set({ actionMode: null, actionSource: null });
        tell('操作完成', 'success');
      } catch (e) {
        tell((e as Error).message, 'error');
      }
    },
    clearVessel: () =>
      mutate((v) => {
        v.contents = [];
        v.records = {};
        v.airUsed = 0;
        v.airOxygen = 0.1;
        v.released = {};
        v.evaporated = 0;
        v.dissolution = 0;
        v.crystallized = 0;
        v.heating = false;
        v.ignited = false;
      }, '清空选中容器'),
    removeEquipment: () => {
      const s = get();
      if (
        s.lab.vessels.filter((v) => isContainer(v.kind)).length === 1 &&
        s.lab.vessels.some((v) => v.uid === s.selected && isContainer(v.kind))
      ) {
        tell('至少保留一个容器', 'error');
        return;
      }
      const lab = structuredClone(s.lab);
      lab.vessels = lab.vessels.filter((v) => v.uid !== s.selected);
      lab.connections = lab.connections.filter((c) => c.from !== s.selected && c.to !== s.selected);
      record(lab, '移除所选仪器', {
        selected: lab.vessels.find((v) => isContainer(v.kind))?.uid ?? lab.vessels[0].uid,
      });
    },
  };
});
/** Animation clock uses fixed simulation steps, regardless of monitor refresh rate. */
export function startClock() {
  let frame = 0,
    last = 0,
    acc = 0;
  const loop = (time: number) => {
    const s = useLab.getState();
    const delta = last ? Math.min((time - last) / 1000, 0.2) : 0;
    last = time;
    if (s.running) {
      acc += delta * s.speed;
      while (acc >= 0.1) {
        useLab.getState().tick();
        acc -= 0.1;
      }
    } else acc = 0;
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(frame);
}
export const selectedVessel = (s: LabStore) => s.lab.vessels.find((v) => v.uid === s.selected);
export function vesselSummary(v: Vessel) {
  return v.kind === 'gas-jar'
    ? `${gasVolume(v).toFixed(1)} mL 气体`
    : `${volume(v).toFixed(1)} mL · ${v.temperature.toFixed(1)} °C`;
}
export function hasCatalyst(v: Vessel | undefined) {
  return v ? amount(v, 'mno2') > 0 : false;
}
