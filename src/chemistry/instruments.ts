import type { InstrumentDefinition } from './types'
export const instruments: InstrumentDefinition[] = [
  {id:'testTube',name:'试管',capacity:25,description:'小量反应；可加热、装塞、连接导管。'},
  {id:'beaker',name:'烧杯',capacity:250,description:'混合、溶解、搅拌，或接收滤液。'},
  {id:'flask',name:'锥形瓶',capacity:150,description:'常温气体发生容器；装塞后连接集气瓶。'},
  {id:'roundFlask',name:'圆底烧瓶',capacity:200,description:'液体反应与均匀加热；需铁架台支撑。'},
  {id:'gasJar',name:'集气瓶',capacity:250,description:'与发生容器连接，记录已收集气体及体积。'},
  {id:'lamp',name:'酒精灯',capacity:0,description:'选择反应容器后点击点燃加热；熄灭后自然冷却。'},
  {id:'dropper',name:'滴管',capacity:0,description:'选择溶液，逐滴加入选中容器，每滴 0.05 mL。'},
  {id:'rod',name:'玻璃棒',capacity:0,description:'开启或停止搅拌，加快可溶性固体溶解。'},
  {id:'funnel',name:'漏斗',capacity:0,description:'配合滤纸进行过滤；固体保留于原容器表示滤渣。'},
  {id:'tube',name:'导管',capacity:0,description:'将发生容器与集气瓶连接，输送生成气体。'},
  {id:'trough',name:'水槽',capacity:500,description:'提供排水集气环境；与集气瓶、导管配合。'},
  {id:'stand',name:'铁架台',capacity:0,description:'固定选中容器，支持圆底烧瓶与试管加热。'},
  {id:'cylinder',name:'量筒',capacity:100,description:'按体积量取溶液后定量转移；不用于加热。'},
  {id:'thermometer',name:'温度计',capacity:0,description:'读取选中容器温度，调整恒温条件。'},
  {id:'dish',name:'蒸发皿',capacity:60,description:'加热蒸发水分，观察溶液浓缩与氯化钠结晶。'},
  {id:'crucible',name:'坩埚',capacity:30,description:'盛放固体，在空气中点燃镁条。'},
  {id:'clamp',name:'试管夹',capacity:0,description:'固定选中的试管或坩埚，允许安全加热。'},
  {id:'stopper',name:'橡胶塞',capacity:0,description:'为试管、烧瓶装塞；接导管以导出气体。'},
]
export const instrumentMap = Object.fromEntries(instruments.map(i=>[i.id,i])) as Record<string,InstrumentDefinition>
export const isContainer = (kind: string) => (instrumentMap[kind]?.capacity ?? 0) > 0 && kind !== 'trough'
