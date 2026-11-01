import { beforeEach,describe,expect,it } from 'vitest'
import { useLabStore } from './lab'
import { amount,elementTotals,gasVolume,getPH } from '../chemistry/engine'
import { lessons } from '../chemistry/lessons'

const store=()=>useLabStore.getState()
const run=(seconds:number)=>{for(let t=0;t<seconds;t++)store().advance(1)}
beforeEach(()=>store().loadLesson('peroxide'))
describe('真实状态时间轴',()=>{
  it('暂停不推进，回放恢复当时的物质量和催化剂',()=>{
    store().advance(1);expect(store().sim.time).toBe(0)
    store().guide('play');run(5)
    const before=structuredClone(store().sim)
    store().guide('catalyst');run(20)
    const end=structuredClone(store().sim)
    store().seek(3);expect(amount(store().sim.vessels[0],'MnO2')).toBe(0)
    store().togglePlay();run(22)
    expect(store().sim).toEqual(end)
    expect(store().history.some(h=>h.time===before.time)).toBe(true)
  })
  it('慢速回放按时间累计，不强行跳过每个快照',()=>{
    store().guide('play');for(let i=0;i<100;i++)store().advance(.1)
    store().seek(0);store().togglePlay()
    for(let i=0;i<20;i++)store().advance(.025)
    expect(store().sim.time).toBeCloseTo(.5,5)
  })
  it('修改过去的状态后，截断旧未来并继续计算',()=>{
    store().guide('play');run(20);store().seek(5)
    store().add('MnO2',1,'s',0)
    expect(store().history.at(-1)?.time).toBeCloseTo(5,7)
    expect(amount(store().sim.vessels[0],'MnO2')).toBe(1)
    store().togglePlay();run(5);expect(store().sim.time).toBeCloseTo(10,7)
  })
  it('移动仪器不改变物质量；有内容物时禁止直接删除',()=>{
    const totals=elementTotals(store().sim)
    store().move('v0',70,30);expect(store().sim.vessels[0].x).toBe(70);expect(elementTotals(store().sim)).toEqual(totals)
    store().removeEquipment();expect(store().sim.vessels.some(v=>v.id==='v0')).toBe(true)
  })
})
describe('十个教学实验端到端操作模型',()=>{
  it('1. 高锰酸钾：加热达到条件后制氧',()=>{
    store().loadLesson('permanganate');store().guide('connect');store().guide('heat');run(150)
    expect(store().sim.vessels[0].temperature).toBeGreaterThan(200)
    expect(amount(store().sim.vessels[0],'K2MnO4')).toBeCloseTo(3,2)
    expect(gasVolume(store().sim.vessels[1])).toBeGreaterThan(70)
    store().guide('finishHeat');expect(store().sim.connections).toHaveLength(0);expect(store().sim.vessels[0].heating).toBe(false)
  })
  it('2. 过氧化氢：可比较催化前后，催化剂不消耗',()=>{
    store().guide('connect');store().guide('play');run(5);const uncatalyzed=store().sim.activities[0].rate
    store().guide('catalyst');const catalyst=amount(store().sim.vessels[0],'MnO2');run(2)
    expect(store().sim.activities[0].rate).toBeGreaterThan(uncatalyzed*50)
    run(150);expect(amount(store().sim.vessels[0],'MnO2')).toBe(catalyst);expect(gasVolume(store().sim.vessels[1])).toBeGreaterThan(120)
  })
  it('3. 碳酸钙：5 mmol 固体产生约 5 mmol CO₂',()=>{
    store().loadLesson('carbonate');store().guide('connect');store().guide('carbonateAcid');store().guide('play');run(150)
    expect(amount(store().sim.vessels[1],'CO2')).toBeCloseTo(5,2);expect(amount(store().sim.vessels[0],'CaCl2')).toBeCloseTo(5,2)
  })
  it('4. 锌：生成硫酸锌与氢气',()=>{
    store().loadLesson('hydrogen');store().guide('connect');store().guide('zincAcid');store().guide('play');run(350)
    expect(amount(store().sim.vessels[1],'H2')).toBeCloseTo(5,2);expect(amount(store().sim.vessels[0],'ZnSO4')).toBeCloseTo(5,2)
  })
  it('5. 沉淀：Cu(OH)₂ 而不是金属铜',()=>{
    store().loadLesson('precipitation');store().guide('precipitateBase');store().guide('play');run(100)
    expect(amount(store().sim.vessels[0],'Cu(OH)2')).toBeCloseTo(5,2);expect(amount(store().sim.vessels[0],'Cu')).toBe(0)
    store().guide('stir');expect(store().sim.vessels[0].stirring).toBe(true)
  })
  it('6. 置换：产生铜与亚铁盐',()=>{
    store().loadLesson('displacement');store().guide('iron');store().guide('play');run(500)
    expect(amount(store().sim.vessels[0],'Cu')).toBeCloseTo(5,2);expect(amount(store().sim.vessels[0],'FeSO4')).toBeCloseTo(5,2)
  })
  it('7. 中和：净当量为零，早期出现温升',()=>{
    store().loadLesson('neutralization');store().guide('neutralAcid');store().guide('play');run(8)
    expect(getPH(store().sim.vessels[0])).toBeCloseTo(7,5);expect(store().sim.vessels[0].temperature).toBeGreaterThan(25)
    run(100);expect(amount(store().sim.vessels[0],'NaCl')).toBeCloseTo(5,2)
  })
  it('8. 酚酞：滴加酸碱改变 pH，指示剂不被消耗',()=>{
    store().loadLesson('indicator');const start=amount(store().sim.vessels[0],'C20H14O4')
    store().guide('indicatorBase');expect(getPH(store().sim.vessels[0])).toBeGreaterThan(10)
    store().guide('play');run(3);store().guide('indicatorAcid');run(20)
    expect(getPH(store().sim.vessels[0])).toBeCloseTo(7);expect(amount(store().sim.vessels[0],'C20H14O4')).toBe(start)
  })
  it('9. 镁：加热点燃后生成氧化镁，环境供氧有记录',()=>{
    store().loadLesson('magnesium');store().guide('support');store().guide('heat');run(100)
    expect(amount(store().sim.vessels[0],'MgO')).toBeCloseTo(5,2);expect(store().sim.supplied.O2).toBeCloseTo(2.5,2)
  })
  it('10. 过滤蒸发：盐溶解、砂留下，滤液蒸发析晶',()=>{
    store().loadLesson('separation');store().guide('dissolve');run(35)
    expect(amount(store().sim.vessels[0],'NaCl','s')).toBe(0)
    store().guide('filter');expect(amount(store().sim.vessels[0],'SiO2')).toBe(8);expect(amount(store().sim.vessels[1],'NaCl','aq')).toBe(55)
    store().guide('evaporate');run(80);expect(amount(store().sim.vessels[1],'NaCl','s')).toBeCloseTo(55,2);expect(store().sim.vessels[1].volumeMl).toBeLessThan(.01)
  })
  it('所有教学配方可初始化，不超容量且无未知物质',()=>{
    for(const lesson of lessons){store().loadLesson(lesson.id);expect(store().sim.vessels.length).toBeGreaterThan(0);expect(store().sim.vessels.every(v=>v.contents.every(p=>p.mmol>0))).toBe(true)}
  })
})
