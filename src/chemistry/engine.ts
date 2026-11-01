import type { Dose, EquipmentKind, LabState, Material, Phase, Reaction, Vessel } from './types';
import { equipmentByKind } from '../data/equipment';
import { substanceById as db } from '../data/substances';
import { reactions } from '../data/reactions';
import { atoms } from './formula';
export const EPS = 1e-10;
export const WATER_MOLAR_VOLUME = 18.015; // mL/mol, density approximated as 1 g/mL
export function createVessel(kind: EquipmentKind, uid: string, x = 270, y = 230): Vessel {
  return {uid,kind,x,y,contents:[],temperature:22,targetTemp:80,heating:false,ignited:false,stirred:false,sealed:false,records:{},airOxygen:0.1,airUsed:0,released:{},evaporated:0,dissolution:0,crystallized:0};
}
export function amount(v: Vessel, id: string, phase?: Phase) { return v.contents.filter(m=>m.id===id && (!phase || m.phase===phase)).reduce((s,m)=>s+m.moles,0); }
export function change(v: Vessel, id: string, phase: Phase, delta: number) {
  const m = v.contents.find(m=>m.id===id && m.phase===phase);
  if (m) m.moles = Math.max(0,m.moles+delta);
  else if (delta>EPS) v.contents.push({id,phase,moles:delta});
}
export function volume(v: Vessel) { return amount(v,'h2o','l')*WATER_MOLAR_VOLUME + amount(v,'ethanol','l')*58.4; }
export function gasVolume(v: Vessel) { return v.contents.filter(m=>m.phase==='g').reduce((s,m)=>s+m.moles,0)*82.057*(v.temperature+273.15); }
export function doseMoles(dose: Dose) { return dose.phase === 'aq' ? dose.amount*dose.concentration/1000 : dose.phase==='g' ? dose.amount/(82.057*295.15) : dose.phase==='l' ? dose.amount/(dose.id==='ethanol'?58.4:WATER_MOLAR_VOLUME) : dose.amount/db[dose.id].molarMass; }
export function addDose(vessel: Vessel, dose: Dose): Vessel {
  if (!db[dose.id] || dose.amount<=0 || !Number.isFinite(dose.amount) || dose.concentration<=0 || !Number.isFinite(dose.concentration)) throw new Error('用量与浓度必须为正数');
  const v = structuredClone(vessel);
  const capacity=equipmentByKind[v.kind].capacity ?? 250;
  if ((dose.phase==='aq'||dose.phase==='l') && volume(v)+dose.amount>capacity+EPS) throw new Error(`超过容器 ${capacity} mL 容量，请减小用量`);
  change(v,dose.id,dose.phase,doseMoles(dose));
  if (dose.phase==='aq') change(v,'h2o','l',dose.amount/WATER_MOLAR_VOLUME);
  return v;
}
export function available(v: Vessel, r: Reaction) {
  return r.reactants.every(t=>amount(v,t.id,t.phase)>EPS || (t.air && !v.sealed && v.airOxygen>EPS));
}
export function conditionReason(v: Vessel, r: Reaction): string | null {
  if (!available(v,r)) return '等待足量反应物';
  if (r.minTemp && v.temperature<r.minTemp) return `需加热至 ${r.minTemp} °C 以上`;
  if (r.ignition && !v.ignited) return '需要点燃（点击点燃按钮）';
  return null;
}
export function reactionCapacity(v: Vessel, r: Reaction) {
  return Math.min(...r.reactants.map(t=>(amount(v,t.id,t.phase)+(t.air&&!v.sealed?v.airOxygen:0))/t.coefficient));
}
/** Fixed-step educational kinetics. Extent is bounded by every reactant; catalyst is never consumed. */
function react(v: Vessel, dt: number) {
  for (const record of Object.values(v.records)) record.rate=0;
  for (const r of reactions) {
    if (conditionReason(v,r)) continue;
    const remaining=reactionCapacity(v,r);
    const volL=Math.max(volume(v)/1000,0.001);
    const aq=r.reactants.filter(t=>t.phase==='aq');
    const concentration=aq.length?Math.max(.03,Math.min(3,Math.min(...aq.map(t=>amount(v,t.id,t.phase)/volL))/.5)):1;
    const thermal=Math.min(5,Math.pow(1.6,(v.temperature-(r.minTemp??22))/25));
    const catalysis=r.catalyst && amount(v,r.catalyst,'s')>EPS ? 65 : 1;
    const extent=Math.min(remaining,r.rate*concentration*thermal*catalysis*dt);
    if (extent<EPS) continue;
    for (const t of r.reactants) {
      const take=extent*t.coefficient;
      const local=Math.min(take,amount(v,t.id,t.phase));
      change(v,t.id,t.phase,-local);
      if (take-local>EPS && t.air) { v.airOxygen-=take-local; v.airUsed+=take-local; }
    }
    for (const t of r.products) change(v,t.id,t.phase,extent*t.coefficient);
    const record=v.records[r.id]??{id:r.id,extent:0,rate:0,capacity:remaining};
    record.capacity=Math.max(record.capacity,record.extent+remaining);
    record.extent+=extent; record.rate=extent/dt;
    v.records[r.id]=record;
    if (r.heat) v.temperature+=r.heat*extent/(Math.max(volume(v),10)*4.18);
  }
}
export function saltSolubility(temperature: number) { return 6.1 + Math.max(0,temperature-20)*0.0015; } // mol/L, NaCl teaching approximation
function physical(v: Vessel, dt: number) {
  const vol=volume(v), aq=amount(v,'nacl','aq'), solid=amount(v,'nacl','s');
  const max=saltSolubility(v.temperature)*vol/1000;
  if (vol>0.01 && aq<max && solid>EPS) {
    const dn=Math.min(solid,max-aq,dt*(v.stirred?.006:.0015));
    change(v,'nacl','s',-dn); change(v,'nacl','aq',dn); v.dissolution+=dn;
  } else if (aq>max+EPS) {
    const dn=Math.min(aq-max,dt*.002);
    change(v,'nacl','aq',-dn); change(v,'nacl','s',dn); v.crystallized+=dn;
  }
  if (v.heating && !v.sealed && v.temperature>=98 && amount(v,'h2o','l')>EPS) {
    // Time-compressed classroom evaporation. Water goes to the environment ledger.
    const n=Math.min(amount(v,'h2o','l'),dt*(v.kind==='dish'?.8:.25)/WATER_MOLAR_VOLUME);
    change(v,'h2o','l',-n); v.evaporated+=n; v.released.h2o=(v.released.h2o??0)+n;
  }
}
export function stepLab(input: LabState, dt: number): LabState {
  if (dt<=0 || dt>.25 || !Number.isFinite(dt)) throw new Error('Use a fixed time step in (0, 0.25]');
  const lab=structuredClone(input); lab.time+=dt;
  for (const v of lab.vessels) {
    let target=v.heating?v.targetTemp:22;
    if (volume(v)>.1) target=Math.min(100,target);
    v.temperature+=(target-v.temperature)*(1-Math.exp(-dt*.16));
    react(v,dt); physical(v,dt);
  }
  for (const v of lab.vessels) {
    const connection=lab.connections.find(c=>c.from===v.uid);
    const receiver=connection?lab.vessels.find(a=>a.uid===connection.to):undefined;
    // Collected gases remain in a jar; unsealed sources vent. Sealed without a tube retains gas.
    if (v.kind==='gas-jar' || (v.sealed&&!receiver)) continue;
    for (const m of v.contents.filter(m=>m.phase==='g')) {
      const dn=m.moles*(1-Math.exp(-dt*(receiver&&v.sealed?2.5:1.2)));
      if (receiver && v.sealed) {
        const room=Math.max(0,(equipmentByKind[receiver.kind].capacity??250)-gasVolume(receiver))/(82.057*(receiver.temperature+273.15));
        const captured=Math.min(room,dn);
        change(receiver,m.id,'g',captured);
        v.released[m.id]=(v.released[m.id]??0)+dn-captured;
      } else v.released[m.id]=(v.released[m.id]??0)+dn;
      m.moles=Math.max(0,m.moles-dn);
    }
  }
  return lab;
}
export function transfer(input: LabState, fromId: string, toId: string, fraction: number, filter = false): LabState {
  if (fromId===toId || fraction<=0 || fraction>1) throw new Error('请选择不同容器与有效转移比例');
  const lab=structuredClone(input), from=lab.vessels.find(v=>v.uid===fromId), to=lab.vessels.find(v=>v.uid===toId);
  if (!from||!to) throw new Error('容器不存在');
  const receivingVolume=volume(to)+volume(from)*fraction;
  if (receivingVolume>(equipmentByKind[to.kind].capacity??250)+EPS) throw new Error('接收容器容量不足');
  const transferred: Material[]=from.contents.filter(m=>m.phase!=='g'&&(!filter||m.phase!=='s')).map(m=>({...m,moles:m.moles*fraction}));
  const oldVolume=volume(to), movedVolume=volume(from)*fraction;
  if (oldVolume+movedVolume>0) to.temperature=(oldVolume*to.temperature+movedVolume*from.temperature)/(oldVolume+movedVolume);
  for (const m of transferred) { change(from,m.id,m.phase,-m.moles); change(to,m.id,m.phase,m.moles); }
  return lab;
}
/** Element inventory, including emitted gases, evaporated water and atmospheric O2 consumed. */
export function elementLedger(lab: LabState) {
  const ledger: Record<string,number>={};
  for (const v of lab.vessels) {
    const entries=[...v.contents,...Object.entries(v.released).map(([id,moles])=>({id,moles}))];
    for (const m of entries) for (const [element,n] of Object.entries(atoms(db[m.id].formula))) ledger[element]=(ledger[element]??0)+n*m.moles;
    ledger.O=(ledger.O??0)-2*v.airUsed;
  }
  return ledger;
}
export function pH(v: Vessel) {
  const litres=Math.max(.0001,volume(v)/1000);
  const acid=amount(v,'hcl','aq')+2*amount(v,'h2so4','aq')+amount(v,'hno3','aq');
  const base=amount(v,'naoh','aq')+amount(v,'koh','aq')+2*amount(v,'caoh2','aq')+2*amount(v,'baoh2','aq');
  const excess=(acid-base)/litres, weak=amount(v,'acetic','aq')/litres;
  let hydrogen: number;
  if (excess>1e-9) hydrogen=excess;
  else if (excess < -1e-9) hydrogen=1e-14/-excess;
  else if (weak>1e-9) hydrogen=(-1.8e-5+Math.sqrt(1.8e-5**2+4*1.8e-5*weak))/2;
  else hydrogen=1e-7;
  return Math.max(0,Math.min(14,-Math.log10(hydrogen)));
}
const mix=(a:string,b:string,f:number)=>{const x=a.match(/\w\w/g)!.map(n=>parseInt(n,16)), y=b.match(/\w\w/g)!.map(n=>parseInt(n,16));return '#'+x.map((n,i)=>Math.round(n+(y[i]-n)*Math.max(0,Math.min(1,f))).toString(16).padStart(2,'0')).join('');};
export function solutionColor(v: Vessel) {
  let color='#b9dfeb'; const litres=Math.max(.001,volume(v)/1000);
  for (const id of ['cuso4','feso4','fecl3','kmno4']) if (amount(v,id,'aq')>EPS) color=mix(color,db[id].color,Math.min(1,amount(v,id,'aq')/litres*3));
  if (amount(v,'phenolphthalein','aq')>EPS) color=mix(color,'#e54f9c',(pH(v)-8.2)/1.8);
  if (amount(v,'litmus','aq')>EPS) { const ph=pH(v); color=ph<7?mix('#9a75be','#e36576',(7-ph)/3):mix('#9a75be','#5085cd',(ph-7)/3); }
  return color;
}
export function matches(v: Vessel) { return reactions.filter(r=>available(v,r) || Boolean(v.records[r.id])); }
export function activeRate(v: Vessel, effect?: Reaction['effect']) { return reactions.filter(r=>!effect||r.effect===effect).reduce((n,r)=>n+(v.records[r.id]?.rate??0),0); }
export function progress(v: Vessel) { const records=Object.values(v.records); return records.length?Math.min(1,records.reduce((n,r)=>n+r.extent,0)/Math.max(EPS,records.reduce((n,r)=>n+r.capacity,0))):0; }
export function statusMessage(v: Vessel) {
  const candidates=matches(v), ongoing=candidates.find(r=>available(v,r));
  if (ongoing) return conditionReason(v,ongoing) ?? (ongoing.catalyst&&!amount(v,ongoing.catalyst)?'缓慢反应中；加入 MnO₂ 可显著加速':'反应进行中');
  if (candidates.length) return '反应物已耗尽，反应完成；可继续添加试剂';
  if (amount(v,'phenolphthalein')||amount(v,'litmus')) return '指示剂依据当前溶液 pH 显色（教学近似）';
  if (amount(v,'nacl')) return '物理过程：NaCl 溶解 / 蒸发 / 结晶；不发生化学反应';
  if (v.contents.filter(m=>m.id!=='h2o'&&m.moles>EPS).length>1) return '此组合暂未支持反应计算，不推断生成物';
  return v.contents.length?'等待加入匹配试剂与反应条件':'从左侧添加试剂，开始一次探索';
}
