import type { Phase, ReactionRule } from './types'
import { substanceMap } from './substances'

const term = (id: string, coefficient = 1, phase: Phase = 'aq') => ({ id, coefficient, phase })
const water = term('H2O',1,'l')
const common = ['H2O','C20H14O4','C14H14N3NaO3S']
export const reactions: ReactionRule[] = [
  {id:'peroxide',title:'过氧化氢分解',type:'分解反应',reactants:[term('H2O2',2)],products:[term('H2O',2,'l'),term('O2',1,'g')],catalyst:'MnO2',baseRate:0.0012,equation:'2H₂O₂ → 2H₂O + O₂↑',conditions:'常温；MnO₂ 催化显著加快',principle:'MnO₂ 提供活化能较低的反应路径，不改变理论氧气产量，反应前后质量与化学性质保持不变。',observation:'黑色催化剂附近持续产生气泡，氧气沿导管进入集气瓶。',spectators:common,visual:'gas'},
  {id:'permanganate',title:'高锰酸钾热分解',type:'分解反应',reactants:[term('KMnO4',2,'s')],products:[term('K2MnO4',1,'s'),term('MnO2',1,'s'),term('O2',1,'g')],minTemperature:200,baseRate:0.075,equation:'2KMnO₄ → K₂MnO₄ + MnO₂ + O₂↑',conditions:'加热至约 200 ℃ 以上',principle:'高锰酸钾受热发生分解，生成锰酸钾、二氧化锰和氧气。温度阈值是教学近似。',observation:'紫黑色固体逐渐转变为绿色与黑色混合物，并有氧气逸出。',spectators:common,visual:'gas'},
  {id:'carbonate-acid',title:'碳酸钙与盐酸',type:'复分解反应',reactants:[term('CaCO3',1,'s'),term('HCl',2)],products:[term('CaCl2'),water,term('CO2',1,'g')],baseRate:0.12,equation:'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',conditions:'稀盐酸、常温',principle:'碳酸盐与酸反应生成盐、水和二氧化碳；本模型以碳酸钙为不溶性固体。',observation:'固体表面生成气泡，固体逐渐减少，溶液保持无色。',spectators:common,visual:'gas'},
  {id:'zinc-acid',title:'锌与稀硫酸',type:'置换反应',reactants:[term('Zn',1,'s'),term('H2SO4')],products:[term('ZnSO4'),term('H2',1,'g')],baseRate:0.06,equation:'Zn + H₂SO₄ → ZnSO₄ + H₂↑',conditions:'稀硫酸、常温（≤ 2 mol/L）',principle:'锌比氢活泼，能从稀硫酸中置换出氢。浓硫酸的氧化性反应不在本模型范围内。',observation:'锌粒表面出现气泡，金属缓慢溶解，生成无色溶液。',spectators:common,visual:'gas'},
  {id:'copper-precipitate',title:'氢氧化铜沉淀',type:'复分解 · 沉淀反应',reactants:[term('CuSO4'),term('NaOH',2)],products:[term('Cu(OH)2',1,'s'),term('Na2SO4')],baseRate:0.48,equation:'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',ionic:'Cu^{2+} + 2OH^{-} \\rightarrow Cu(OH)_2\\downarrow',conditions:'水溶液、常温',principle:'Cu²⁺ 与 OH⁻ 结合形成难溶的氢氧化铜。蓝色来自悬浮沉淀，滤液随铜离子被消耗而变浅。',observation:'蓝色絮状颗粒逐渐出现、聚集并下沉，上层溶液逐渐变浅。',spectators:common,visual:'precipitate'},
  {id:'iron-copper',title:'铁置换铜',type:'置换 · 氧化还原反应',reactants:[term('Fe',1,'s'),term('CuSO4')],products:[term('FeSO4'),term('Cu',1,'s')],baseRate:0.045,equation:'Fe + CuSO₄ → FeSO₄ + Cu',ionic:'Fe + Cu^{2+} \\rightarrow Fe^{2+} + Cu',conditions:'硫酸铜水溶液、常温',principle:'铁失去电子形成 Fe²⁺，Cu²⁺ 得到电子析出金属铜；铁比铜活泼。',observation:'铁表面附着紫红色铜，蓝色溶液逐渐变为浅绿色。',spectators:common,visual:'displacement'},
  {id:'neutralization',title:'盐酸与氢氧化钠',type:'复分解 · 中和反应',reactants:[term('HCl'),term('NaOH')],products:[term('NaCl'),water],baseRate:0.55,equation:'HCl + NaOH → NaCl + H₂O',ionic:'H^{+} + OH^{-} \\rightarrow H_2O',conditions:'水溶液、常温',principle:'H⁺ 与 OH⁻ 生成水，反应放热；可用酚酞观察碱性减弱。温升按理想稀溶液热容估算。',observation:'无明显沉淀或气体；溶液温度升高，酚酞红色逐渐褪去。',spectators:common,visual:'neutralization'},
  {id:'magnesium',title:'镁条燃烧',type:'化合 · 氧化还原反应',reactants:[term('Mg',2,'s'),term('O2',1,'g')],products:[term('MgO',2,'s')],minTemperature:500,needsIgnition:true,baseRate:0.22,equation:'2Mg + O₂ → 2MgO',conditions:'点燃、氧气或空气',principle:'镁与氧气反应生成氧化镁。简化为空气中的主反应，不模拟少量氮化镁等副产物。',observation:'镁条剧烈燃烧，发出耀眼白光，生成白色氧化镁粉末。',spectators:[],visual:'burning'},
  {id:'sulfate-neutralization',title:'硫酸与氢氧化钠',type:'中和反应',reactants:[term('H2SO4'),term('NaOH',2)],products:[term('Na2SO4'),term('H2O',2,'l')],baseRate:0.5,equation:'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',conditions:'稀溶液、常温',principle:'按稀溶液中硫酸完全提供两当量氢离子近似处理，不模拟硫酸氢盐中间平衡。',observation:'无沉淀、无气体，放出热量。',spectators:common,visual:'neutralization'},
  {id:'lime-water',title:'二氧化碳检验',type:'沉淀反应',reactants:[term('CO2',1,'g'),term('Ca(OH)2')],products:[term('CaCO3',1,'s'),water],baseRate:0.3,equation:'CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O',conditions:'二氧化碳不过量',principle:'CO₂ 与石灰水反应生成白色碳酸钙沉淀。过量 CO₂ 形成碳酸氢盐的过程未实现，系统会阻止推测。',observation:'澄清石灰水逐渐变浑浊，白色沉淀下沉。',spectators:common,visual:'precipitate'},
  {id:'silver-chloride',title:'氯化银沉淀',type:'沉淀反应',reactants:[term('AgNO3'),term('NaCl')],products:[term('AgCl',1,'s'),term('NaNO3')],baseRate:0.5,equation:'AgNO₃ + NaCl → AgCl↓ + NaNO₃',conditions:'水溶液、常温',principle:'Ag⁺ 与 Cl⁻ 结合形成难溶的白色氯化银。',observation:'产生白色絮状沉淀。',spectators:common,visual:'precipitate'},
  {id:'barium-sulfate',title:'硫酸钡沉淀',type:'沉淀反应',reactants:[term('BaCl2'),term('H2SO4')],products:[term('BaSO4',1,'s'),term('HCl',2)],baseRate:0.5,equation:'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl',conditions:'稀溶液、常温',principle:'Ba²⁺ 与 SO₄²⁻ 结合生成难溶性硫酸钡。',observation:'生成白色沉淀。',spectators:common,visual:'precipitate'},
  {id:'iron-precipitate',title:'氢氧化铁沉淀',type:'沉淀反应',reactants:[term('FeCl3'),term('NaOH',3)],products:[term('Fe(OH)3',1,'s'),term('NaCl',3)],baseRate:0.45,equation:'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl',conditions:'水溶液、常温',principle:'Fe³⁺ 与 OH⁻ 结合形成氢氧化铁。',observation:'生成红褐色沉淀。',spectators:common,visual:'precipitate'},
  {id:'soda-acid',title:'碳酸钠与盐酸',type:'复分解反应',reactants:[term('Na2CO3'),term('HCl',2)],products:[term('NaCl',2),water,term('CO2',1,'g')],baseRate:0.2,equation:'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',conditions:'盐酸足量；不模拟碳酸氢盐中间过程',principle:'碳酸根与足量氢离子反应生成水和二氧化碳。',observation:'产生大量无色气泡。',spectators:common,visual:'gas'},
  {id:'baking-acid',title:'碳酸氢钠与盐酸',type:'复分解反应',reactants:[term('NaHCO3',1,'s'),term('HCl')],products:[term('NaCl'),water,term('CO2',1,'g')],baseRate:0.18,equation:'NaHCO₃ + HCl → NaCl + H₂O + CO₂↑',conditions:'稀盐酸、常温',principle:'碳酸氢盐与酸反应生成盐、水和二氧化碳。',observation:'白色固体减少，出现无色气泡。',spectators:common,visual:'gas'},
  {id:'copper-oxide-acid',title:'氧化铜与盐酸',type:'复分解反应',reactants:[term('CuO',1,'s'),term('HCl',2)],products:[term('CuCl2'),water],baseRate:0.08,equation:'CuO + 2HCl → CuCl₂ + H₂O',conditions:'稀盐酸；升温加快',principle:'碱性氧化物与酸反应，生成盐和水。',observation:'黑色氧化铜逐渐溶解，溶液出现蓝绿色。',spectators:common,visual:'neutralization'},
  {id:'quicklime',title:'生石灰与水',type:'化合反应',reactants:[term('CaO',1,'s'),water],products:[term('Ca(OH)2',1,'s')],baseRate:0.12,equation:'CaO + H₂O → Ca(OH)₂',conditions:'加入水',principle:'氧化钙与水反应生成氢氧化钙并放热。',observation:'固体疏松，容器温度升高。',spectators:[],visual:'neutralization'},
  {id:'chlorate',title:'氯酸钾分解',type:'分解反应',reactants:[term('KClO3',2,'s')],products:[term('KCl',2,'s'),term('O2',3,'g')],catalyst:'MnO2',minTemperature:250,baseRate:0.04,equation:'2KClO₃ → 2KCl + 3O₂↑',conditions:'MnO₂ 催化并加热；无催化剂阈值约 400 ℃',principle:'催化剂降低分解所需的温度与活化能，理论生成比例保持不变。',observation:'白色固体分解并产生氧气。',spectators:common,visual:'gas'},
]
export const reactionMap = Object.fromEntries(reactions.map(r=>[r.id,r])) as Record<string,ReactionRule>

export function isBalanced(rule: ReactionRule): boolean {
  const counts: Record<string,number> = {}
  for (const [side, sign] of [[rule.reactants,1],[rule.products,-1]] as const) {
    for (const item of side) {
      const substance = substanceMap[item.id]
      if (!substance) return false
      for (const [element,n] of Object.entries(substance.atoms)) counts[element] = (counts[element] ?? 0) + sign * n * item.coefficient
    }
  }
  return Object.values(counts).every(n=>n===0)
}
