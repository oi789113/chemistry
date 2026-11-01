import type { Equipment, EquipmentKind } from '../chemistry/types';
export const equipment: Equipment[] = [
  {kind:'beaker',name:'烧杯',capacity:250,description:'盛装、混合溶液，可倒液、加热。'},
  {kind:'test-tube',name:'试管',capacity:50,description:'少量试剂反应，加热时可用试管夹固定。'},
  {kind:'flask',name:'锥形瓶',capacity:250,description:'气体发生容器，装橡胶塞后连接导管集气。'},
  {kind:'round-flask',name:'圆底烧瓶',capacity:250,description:'均匀受热的反应容器。'},
  {kind:'gas-jar',name:'集气瓶',capacity:250,description:'连接导管后收集气体；显示理想气体体积。'},
  {kind:'burner',name:'酒精灯',description:'选中反应容器后点按酒精灯工具开启/停止加热。'},
  {kind:'dropper',name:'滴管',description:'开启滴加，选定试剂后每次加入 0.5 mL。'},
  {kind:'rod',name:'玻璃棒',description:'搅拌所选容器，加快固体溶解。'},
  {kind:'funnel',name:'漏斗',description:'配合滤纸过滤；选择来源和接收容器执行分离。'},
  {kind:'tube',name:'导管',description:'选择发生容器后再选择集气瓶，建立气体通路。'},
  {kind:'trough',name:'水槽',capacity:1000,description:'盛水容器；可作为操作台上的液体接收器。'},
  {kind:'stand',name:'铁架台',description:'固定选中容器，配合加热操作。'},
  {kind:'cylinder',name:'量筒',capacity:100,description:'定量量取、转移溶液。'},
  {kind:'thermometer',name:'温度计',description:'测量选中容器的即时温度。'},
  {kind:'dish',name:'蒸发皿',capacity:100,description:'蒸发溶剂，观察饱和、析晶。'},
  {kind:'crucible',name:'坩埚',capacity:50,description:'用于固体高温反应，如镁条燃烧。'},
  {kind:'clamp',name:'试管夹',description:'固定选中试管，方便加热。'},
  {kind:'stopper',name:'橡胶塞',description:'密封选中气体发生容器，配合导管集气。'},
];
export const equipmentByKind = Object.fromEntries(equipment.map(e=>[e.kind,e])) as Record<EquipmentKind,Equipment>;
export const isContainer = (kind: EquipmentKind) => Boolean(equipmentByKind[kind].capacity);
