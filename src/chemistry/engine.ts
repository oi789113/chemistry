import { instrumentMap, isContainer } from './instruments'
import { reactions, reactionMap } from './reactions'
import { substanceMap } from './substances'
import type { Phase, ReactionRule, Simulation, Vessel, InstrumentKind } from './types'

const EPS = 1e-8
export const amount = (v: Vessel, id: string, phase?: Phase) => v.contents.filter(p=>p.id===id && (!phase || p.phase===phase)).reduce((s,p)=>s+p.mmol,0)
export function changeAmount(v: Vessel, id: string, phase: Phase, delta: number) {
  const p = v.contents.find(p=>p.id===id && p.phase===phase)
  if (p) p.mmol = Math.max(0,p.mmol+delta)
  else if (delta>EPS) v.contents.push({id,phase,mmol:delta})
  v.contents = v.contents.filter(p=>p.mmol>EPS)
}
export function createVessel(kind: InstrumentKind, id: string, x: number, y: number): Vessel {
  return {id,kind,x,y,contents:[],volumeMl:0,temperature:25,targetTemperature:25,heating:false,stirring:false,supported:false,stoppered:false,reacted:{},evaporatedMl:0}
}
export function emptySimulation(): Simulation {
  return {time:0,vessels:[],connections:[],environment:'air',activities:[],escaped:{},supplied:{},notices:[],events:[]}
}
export function addReagent(v: Vessel, id: string, mmol: number, phase: Phase, volumeMl = 0): string | null {
  if (!isContainer(v.kind)) return '请选择可以盛放试剂的容器。'
  if (!Number.isFinite(mmol) || mmol<=0 || !Number.isFinite(volumeMl) || volumeMl<0) return '用量必须为正数。'
  if (!substanceMap[id]) return '未知物质，未添加。'
  if (v.volumeMl+volumeMl > instrumentMap[v.kind].capacity) return '超过容器容量，请更换更大的容器。'
  changeAmount(v,id,phase,mmol)
  if (id!=='H2O' && (phase==='aq' || volumeMl>0)) changeAmount(v,'H2O','l',volumeMl*55.5)
  v.volumeMl+=volumeMl
  return null
}
export function availableRules(v: Vessel, sim: Simulation): ReactionRule[] {
  return reactions.filter(r=>r.reactants.every(t => amount(v,t.id,t.phase)>EPS || (t.id==='O2' && sim.environment==='air' && r.id==='magnesium')))
}
export function blockedReason(v: Vessel, sim: Simulation, rule: ReactionRule): string | null {
  const allowed = new Set([...rule.reactants.map(t=>t.id),...rule.products.map(t=>t.id),...rule.spectators,...(rule.catalyst?[rule.catalyst]:[])])
  const extra = v.contents.filter(p=>p.mmol>EPS && !allowed.has(p.id))
  if (extra.length) return `暂不支持此混合体系：${extra.map(p=>substanceMap[p.id].name).join('、')}可能引入未建模的反应。`
  if (rule.id==='zinc-acid' && amount(v,'H2SO4','aq') / Math.max(v.volumeMl,0.001)>2.0001) return '暂不支持浓硫酸与锌的反应，请使用 ≤ 2 mol/L 的稀硫酸。'
  if (rule.id==='lime-water' && amount(v,'CO2','g')>amount(v,'Ca(OH)2','aq')+EPS) return '暂不支持过量 CO₂ 的碳酸氢盐平衡，请减少 CO₂。'
  if (rule.id==='soda-acid' && amount(v,'HCl','aq')+EPS < 2*amount(v,'Na2CO3','aq')) return '暂不支持盐酸不足时的分步碳酸盐平衡，请加入足量盐酸。'
  const minTemp = rule.id==='chlorate' && amount(v,'MnO2')<EPS ? 400 : rule.minTemperature
  if (minTemp && v.temperature<minTemp) return `等待${rule.needsIgnition?'点燃':'加热'}：需达到约 ${minTemp} ℃。`
  if (rule.id==='magnesium' && sim.environment==='closed' && amount(v,'O2','g')<EPS) return '密闭环境缺少氧气，无法继续燃烧。'
  return null
}
export function describeSystem(v: Vessel | undefined, sim: Simulation): string {
  if (!v || !isContainer(v.kind)) return '请选择一个反应容器。'
  if (!v.contents.length) return '容器为空。选择左侧试剂，或将试剂拖入容器。'
  const candidates = availableRules(v,sim)
  if (candidates.length) return blockedReason(v,sim,candidates[0]) ?? '反应条件已满足。播放后按用量与浓度推进反应。'
  if (Object.keys(v.reacted).length) return '已反应的物质与生成物保留在容器中，可继续操作。'
  const ids = v.contents.filter(p=>p.id!=='H2O' && substanceMap[p.id].category!=='indicator')
  if (ids.every(p=>p.id==='NaCl' || p.id==='SiO2')) return '物理分离体系：可加水溶解、过滤、蒸发与结晶。'
  if (v.contents.some(p=>substanceMap[p.id].category==='indicator') && getPH(v)!==null) return '指示剂随当前 pH 显色；这是酸碱平衡示意，不是生成新物质。'
  if (ids.length>1) return '暂不支持该试剂组合，未推测化学方程式或生成物。'
  if (ids.length===1 && !substanceMap[ids[0].id].reactions.length) return '已收录此物质资料；相关反应暂不支持。'
  return '尚未形成已支持的反应体系，请补充反应物或调整物态与条件。'
}

// All amounts are mmol. Kinetics are deliberately slowed, educational approximations.
function integrate(sim: Simulation, dt: number) {
  const activities: Simulation['activities'] = []
  const notices = new Set<string>()
  for (const v of sim.vessels) {
    if (!isContainer(v.kind)) continue
    const thermalTarget = v.heating ? (amount(v,'H2O','l')>0.5 ? 100 : v.kind==='crucible'?650:300) : v.targetTemperature
    v.temperature += Math.sign(thermalTarget-v.temperature) * Math.min(Math.abs(thermalTarget-v.temperature),dt*(v.heating?13:Math.max(0.1,Math.abs(v.temperature-thermalTarget)*0.025)))
    const candidates = availableRules(v,sim)
    for (const rule of candidates) {
      const blocked = blockedReason(v,sim,rule)
      if (blocked) { notices.add(blocked); continue }
      const limited = Math.min(...rule.reactants.map(t=>(t.id==='O2' && sim.environment==='air' && rule.id==='magnesium')?Infinity:amount(v,t.id,t.phase)/t.coefficient))
      if (!Number.isFinite(limited) || limited<EPS) continue
      const catalystFactor = rule.catalyst && amount(v,rule.catalyst)>EPS ? (rule.id==='peroxide'?120:2) : 1
      const tempFactor = Math.min(4,Math.max(0.1,Math.exp((v.temperature-(rule.minTemperature??25))/65)))
      const aqReactants = rule.reactants.filter(t=>t.phase==='aq')
      const concentrationFactor = aqReactants.length ? Math.min(2,Math.max(0.03,Math.sqrt(Math.min(...aqReactants.map(t=>(amount(v,t.id,'aq')+(v.reacted[rule.id]??0)*t.coefficient)/Math.max(v.volumeMl,0.1)))))) : 1
      const extent = Math.min(limited,limited*(1-Math.exp(-rule.baseRate*catalystFactor*tempFactor*concentrationFactor*dt)))
      // Finish the final <0.1% rather than leaving an endless numerical tail.
      const dx = limited<0.002 ? limited : extent
      for (const t of rule.reactants) {
        let used = dx*t.coefficient
        if (t.id==='O2' && rule.id==='magnesium' && sim.environment==='air') {
          const fromVessel = Math.min(used,amount(v,'O2','g'))
          sim.supplied.O2=(sim.supplied.O2??0)+used-fromVessel
          used=fromVessel
        }
        changeAmount(v,t.id,t.phase,-used)
      }
      for (const t of rule.products) changeAmount(v,t.id,t.phase,dx*t.coefficient)
      if (rule.visual==='neutralization' && rule.id!=='copper-oxide-acid') {
        const heat = dx*(rule.id==='quicklime'?64:57) // J/mmol
        v.temperature += heat/(Math.max(5,v.volumeMl)*4.18)
      }
      v.reacted[rule.id]=(v.reacted[rule.id]??0)+dx
      const total=v.reacted[rule.id]+Math.max(0,limited-dx)
      activities.push({vesselId:v.id,reactionId:rule.id,extent:v.reacted[rule.id],rate:dx/dt,progress:v.reacted[rule.id]/Math.max(total,EPS)})
    }
    // Dissolution / crystallization: NaCl saturation is 0.36 g per mL water at 25 C,
    // temperature dependence 0.00015 g/(mL*C), deliberately modest for NaCl.
    const waterMl=amount(v,'H2O','l')/55.5
    if (waterMl>EPS) {
      for (const p of [...v.contents]) {
        if (p.phase!=='s' || !substanceMap[p.id].soluble || ['MnO2','Ca(OH)2'].includes(p.id)) continue
        const maxDissolved = p.id==='NaCl' ? waterMl*(0.36+0.00015*(v.temperature-25))/substanceMap.NaCl.molarMass*1000 : Infinity
        const dx=Math.min(p.mmol,Math.max(0,maxDissolved-amount(v,p.id,'aq')),(v.stirring?1.8:0.55)*dt)
        if(dx>0){changeAmount(v,p.id,'s',-dx);changeAmount(v,p.id,'aq',dx)}
      }
    }
    if(v.heating && waterMl>0 && v.temperature>65){
      const evaporated=Math.min(waterMl,dt*Math.max(0,(v.temperature-65)/35)*0.35)
      changeAmount(v,'H2O','l',-evaporated*55.5)
      sim.escaped.H2O=(sim.escaped.H2O??0)+evaporated*55.5
      v.volumeMl=Math.max(0,v.volumeMl-evaporated);v.evaporatedMl+=evaporated
    }
    const saltCapacity=amount(v,'H2O','l')/55.5*(0.36+0.00015*(v.temperature-25))/substanceMap.NaCl.molarMass*1000
    const crystallized=Math.min(Math.max(0,amount(v,'NaCl','aq')-saltCapacity),dt*3)
    if(crystallized>EPS){changeAmount(v,'NaCl','aq',-crystallized);changeAmount(v,'NaCl','s',crystallized)}
    // Gas transfer conserves every mmol: vessel -> collector or escaped ledger.
    const link=sim.connections.find(c=>c.from===v.id)
    const receiver=sim.vessels.find(x=>x.id===link?.to)
    if (v.kind!=='gasJar') for(const p of [...v.contents].filter(p=>p.phase==='g')){
      if (p.id==='O2' && amount(v,'Mg','s')>EPS) continue
      // Keep deliberately added CO2 for limewater until it can react.
      if (p.id==='CO2' && amount(v,'Ca(OH)2','aq')>EPS) continue
      const moved=p.mmol*(1-Math.exp(-dt*2))
      changeAmount(v,p.id,'g',-moved)
      if(receiver){
        const existing=receiver.contents.filter(x=>x.phase==='g').reduce((s,x)=>s+x.mmol,0)
        const capacity=instrumentMap[receiver.kind].capacity / gasMolarVolume(receiver.temperature)
        const captured=Math.min(moved,Math.max(0,capacity-existing))
        changeAmount(receiver,p.id,'g',captured)
        sim.escaped[p.id]=(sim.escaped[p.id]??0)+moved-captured
      } else if(!v.stoppered || sim.environment==='air') sim.escaped[p.id]=(sim.escaped[p.id]??0)+moved
      else changeAmount(v,p.id,'g',moved)
    }
  }
  sim.activities=activities
  sim.notices=[...notices]
  sim.time+=dt
}
export function stepSimulation(original: Simulation, dt: number): Simulation {
  const sim=structuredClone(original)
  let remaining=Math.min(Math.max(0,dt),2)
  while(remaining>1e-8){const step=Math.min(remaining,0.05);integrate(sim,step);remaining-=step}
  return sim
}
/** Ideal gas volume in mL / mmol at 1 atm. */
export const gasMolarVolume=(temperature:number)=>0.082057*(temperature+273.15)
export const gasVolume=(v:Vessel)=>v.contents.filter(p=>p.phase==='g').reduce((n,p)=>n+p.mmol,0)*gasMolarVolume(v.temperature)

export function getPH(v: Vessel): number | null {
  const known=['H2O','HCl','H2SO4','HNO3','NaOH','KOH','Ca(OH)2','Ba(OH)2','NaCl','Na2SO4','KCl','C20H14O4','C14H14N3NaO3S']
  if(v.contents.some(p=>p.phase==='aq' && !known.includes(p.id))) return null
  if(v.volumeMl<EPS) return null
  const acid=amount(v,'HCl','aq')+amount(v,'HNO3','aq')+2*amount(v,'H2SO4','aq')
  const base=amount(v,'NaOH','aq')+amount(v,'KOH','aq')+2*amount(v,'Ca(OH)2','aq')+2*amount(v,'Ba(OH)2','aq')
  const net=(acid-base)/v.volumeMl
  if(Math.abs(net)<1e-10) return 7
  // Solve [H+]-[OH-]=net and Kw=10^-14 at the 25 C teaching reference.
  const h=net>0 ? (net+Math.sqrt(net*net+4e-14))/2 : 2e-14/(Math.sqrt(net*net+4e-14)-net)
  return Math.max(0,Math.min(14,-Math.log10(h)))
}
export function elementTotals(sim:Simulation):Record<string,number>{
  const totals:Record<string,number>={}
  const add=(id:string,n:number)=>{for(const [el,num]of Object.entries(substanceMap[id].atoms))totals[el]=(totals[el]??0)+num*n}
  sim.vessels.forEach(v=>v.contents.forEach(p=>add(p.id,p.mmol)))
  Object.entries(sim.escaped).forEach(([id,n])=>add(id,n))
  Object.entries(sim.supplied).forEach(([id,n])=>add(id,-n))
  return totals
}
export function transfer(sim:Simulation, fromId:string, toId:string, fraction:number, filter=false):string|null{
  const from=sim.vessels.find(v=>v.id===fromId), to=sim.vessels.find(v=>v.id===toId)
  if(!from||!to||from===to||!isContainer(to.kind))return '请选择两个不同的容器。'
  if(!Number.isFinite(fraction)||fraction<=0||fraction>1)return '转移比例应在 0 到 100% 之间。'
  if(from.volumeMl*fraction+to.volumeMl>instrumentMap[to.kind].capacity)return '接收容器容量不足。'
  const oldVolume=to.volumeMl
  for(const p of [...from.contents]){
    if(p.phase==='g'||(filter&&p.phase==='s'))continue
    const n=p.mmol*fraction;changeAmount(from,p.id,p.phase,-n);changeAmount(to,p.id,p.phase,n)
  }
  to.volumeMl+=from.volumeMl*fraction
  if(to.volumeMl>0)to.temperature=(to.temperature*oldVolume+from.temperature*(to.volumeMl-oldVolume))/to.volumeMl
  from.volumeMl*=1-fraction
  return null
}
export function mainRule(v: Vessel | undefined, sim:Simulation): ReactionRule | undefined {
  if(!v)return
  const active=sim.activities.find(a=>a.vesselId===v.id)
  return active ? reactionMap[active.reactionId] : availableRules(v,sim)[0] ?? reactionMap[Object.keys(v.reacted).at(-1)??'']
}
