import { describe, expect, it } from 'vitest'
import { reactions, isBalanced } from './reactions'
import { substances, substanceMap } from './substances'
import { addReagent, amount, blockedReason, createVessel, elementTotals, emptySimulation, getPH, stepSimulation, transfer, gasVolume } from './engine'
import type { Simulation } from './types'

const fixture=()=>{const s=emptySimulation();s.vessels.push(createVessel('beaker','v1',35,45));return s}
const run=(s:Simulation,seconds:number)=>{for(let t=0;t<seconds;t+=0.5)s=stepSimulation(s,0.5);return s}
function conserved(a:Simulation,b:Simulation){
  const x=elementTotals(a),y=elementTotals(b)
  for(const key of new Set([...Object.keys(x),...Object.keys(y)]))expect(y[key]??0,`${key} 守恒`).toBeCloseTo(x[key]??0,7)
}
describe('物质库与反应规则',()=>{
  it('全部方程式元素守恒、质量守恒',()=>{
    for(const r of reactions){
      expect(isBalanced(r),r.id).toBe(true)
      const mass=(terms:typeof r.reactants)=>terms.reduce((sum,t)=>sum+substanceMap[t.id].molarMass*t.coefficient,0)
      expect(mass(r.reactants),r.id).toBeCloseTo(mass(r.products),5)
    }
  })
  it('物质 ID 唯一，含完整资料与有效规则引用',()=>{
    expect(new Set(substances.map(s=>s.id)).size).toBe(substances.length)
    for(const s of substances){expect(s.safety).toBeTruthy();expect(s.conditions).toBeTruthy();expect(s.molarMass).toBeGreaterThan(0);s.reactions.forEach(id=>expect(reactions.some(r=>r.id===id)).toBe(true))}
  })
})
describe('按量计算的反应引擎',()=>{
  it('催化剂加快速率但自身不消耗，氧气理论产量一致',()=>{
    const slow=fixture();addReagent(slow.vessels[0],'H2O2',10,'aq',10)
    const fast=structuredClone(slow);addReagent(fast.vessels[0],'MnO2',1,'s')
    const a=run(slow,10),b=run(fast,10)
    expect(amount(b.vessels[0],'H2O2')).toBeLessThan(amount(a.vessels[0],'H2O2')/2)
    expect(amount(b.vessels[0],'MnO2')).toBe(1)
    const end=run(fast,200)
    expect((end.escaped.O2??0)+amount(end.vessels[0],'O2')).toBeCloseTo(5,3)
    conserved(fast,end)
  })
  it('按限制反应物计算氢氧化铜，不出现负用量',()=>{
    const s=fixture();addReagent(s.vessels[0],'CuSO4',10,'aq',20);addReagent(s.vessels[0],'NaOH',10,'aq',20)
    const end=run(s,120)
    expect(amount(end.vessels[0],'Cu(OH)2','s')).toBeCloseTo(5,3)
    expect(amount(end.vessels[0],'CuSO4','aq')).toBeCloseTo(5,3)
    end.vessels[0].contents.forEach(p=>expect(p.mmol).toBeGreaterThanOrEqual(0));conserved(s,end)
  })
  it('稀释会降低反应速率',()=>{
    const s=fixture();addReagent(s.vessels[0],'H2O2',10,'aq',10);addReagent(s.vessels[0],'MnO2',1,'s')
    const dilute=structuredClone(s);addReagent(dilute.vessels[0],'H2O',5550,'l',100)
    expect(amount(run(s,4).vessels[0],'H2O2')).toBeLessThan(amount(run(dilute,4).vessels[0],'H2O2'))
  })
  it('高锰酸钾必须达到加热阈值',()=>{
    const s=fixture();addReagent(s.vessels[0],'KMnO4',10,'s')
    expect(amount(run(s,10).vessels[0],'O2')).toBe(0)
    s.vessels[0].temperature=240;s.vessels[0].targetTemperature=240
    const end=run(s,120);expect((end.escaped.O2??0)).toBeGreaterThan(4.9);conserved(s,end)
  })
  it('不为未知混合体系或浓硫酸编造反应',()=>{
    const s=fixture();addReagent(s.vessels[0],'H2O2',10,'aq',10);addReagent(s.vessels[0],'HCl',10,'aq',10)
    expect(amount(run(s,5).vessels[0],'O2')).toBe(0)
    const zinc=fixture();addReagent(zinc.vessels[0],'Zn',10,'s');addReagent(zinc.vessels[0],'H2SO4',30,'aq',10)
    expect(blockedReason(zinc.vessels[0],zinc,reactions.find(r=>r.id==='zinc-acid')!)).toContain('浓硫酸')
    expect(run(zinc,10).escaped.H2??0).toBe(0)
  })
  it('集气瓶不超过容量，逸散气体也计入守恒',()=>{
    const s=fixture();addReagent(s.vessels[0],'H2O2',40,'aq',40);addReagent(s.vessels[0],'MnO2',2,'s')
    s.vessels.push(createVessel('gasJar','jar',70,45));s.connections.push({from:'v1',to:'jar'})
    const end=run(s,200)
    expect(gasVolume(end.vessels[1])).toBeCloseTo(250,3);expect(end.escaped.O2).toBeGreaterThan(9);conserved(s,end)
  })
  it('空气中的镁燃烧记录氧气输入，密闭缺氧时不反应',()=>{
    const s=fixture();s.vessels[0].kind='crucible';s.vessels[0].temperature=600;s.vessels[0].targetTemperature=600;addReagent(s.vessels[0],'Mg',10,'s')
    const closed=structuredClone(s);closed.environment='closed'
    expect(amount(run(closed,10).vessels[0],'MgO')).toBe(0)
    const end=run(s,100);expect(amount(end.vessels[0],'MgO')).toBeCloseTo(10,3);expect(end.supplied.O2).toBeCloseTo(5,3);conserved(s,end)
  })
  it('中和按计量完成并放热，强酸强碱 pH 可计算',()=>{
    const s=fixture();addReagent(s.vessels[0],'NaOH',10,'aq',20);expect(getPH(s.vessels[0])).toBeGreaterThan(13)
    addReagent(s.vessels[0],'HCl',10,'aq',20);expect(getPH(s.vessels[0])).toBe(7)
    const end=run(s,120);expect(amount(end.vessels[0],'NaCl')).toBeCloseTo(10,3);expect(run(s,8).vessels[0].temperature).toBeGreaterThan(25);conserved(s,end)
  })
  it('水解未实现的盐溶液不报告虚假的中性 pH',()=>{const s=fixture();addReagent(s.vessels[0],'CuSO4',10,'aq',10);expect(getPH(s.vessels[0])).toBeNull()})
})
describe('物理过程',()=>{
  it('过滤保留固体，溶质与水进入接收容器',()=>{
    const s=fixture();addReagent(s.vessels[0],'NaCl',10,'aq',20);addReagent(s.vessels[0],'SiO2',5,'s');s.vessels.push(createVessel('dish','dish',70,45))
    const before=structuredClone(s);expect(transfer(s,'v1','dish',1,true)).toBeNull()
    expect(amount(s.vessels[0],'SiO2')).toBe(5);expect(amount(s.vessels[1],'SiO2')).toBe(0);expect(amount(s.vessels[1],'NaCl')).toBe(10);conserved(before,s)
  })
  it('搅拌加快溶解；蒸发减少水量并析晶，质量去向可追踪',()=>{
    const s=fixture();s.vessels[0].kind='dish';addReagent(s.vessels[0],'NaCl',65,'s');addReagent(s.vessels[0],'H2O',555,'l',10)
    const stir=structuredClone(s);stir.vessels[0].stirring=true
    expect(amount(run(stir,5).vessels[0],'NaCl','aq')).toBeGreaterThan(amount(run(s,5).vessels[0],'NaCl','aq'))
    const dissolved=run(stir,80);dissolved.vessels[0].heating=true
    const end=run(dissolved,70);expect(end.vessels[0].volumeMl).toBeLessThan(1);expect(amount(end.vessels[0],'NaCl','s')).toBeGreaterThan(50);conserved(s,end)
  })
  it('拒绝超量、负值、无效转移',()=>{const s=fixture();expect(addReagent(s.vessels[0],'H2O2',10,'aq',999)).toContain('容量');expect(addReagent(s.vessels[0],'HCl',-1,'aq',1)).toBeTruthy();expect(s.vessels[0].contents).toHaveLength(0);expect(transfer(s,'v1','v1',1)).toBeTruthy()})
})
