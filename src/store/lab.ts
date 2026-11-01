import { create } from 'zustand'
import { addReagent, amount, createVessel, emptySimulation, stepSimulation, transfer } from '../chemistry/engine'
import { createLesson, lessonMap } from '../chemistry/lessons'
import { instrumentMap, isContainer } from '../chemistry/instruments'
import { substanceMap } from '../chemistry/substances'
import type { InstrumentKind, Phase, Simulation } from '../chemistry/types'

interface LabStore {
  sim: Simulation; history: Simulation[]; cursor: number; playbackTime:number; playing: boolean; speed: number
  mode: 'guided' | 'free'; lessonId: string; selectedId: string; micro: boolean
  completed: string[]; toast: {id:number;text:string} | null
  loadLesson: (id:string)=>void; freeLab:()=>void; select:(id:string)=>void
  togglePlay:()=>void; setSpeed:(n:number)=>void; advance:(dt:number)=>void; seek:(time:number)=>void
  reset:()=>void; toggleMicro:()=>void; notify:(text:string)=>void
  mutate:(fn:(sim:Simulation)=>string|void, event?:string)=>boolean
  addEquipment:(kind:InstrumentKind,x?:number,y?:number)=>void; removeEquipment:()=>void
  add:(id:string,mmol:number,phase:Phase,volumeMl:number,target?:string)=>void
  move:(id:string,x:number,y:number)=>void
  heat:()=>void; stir:()=>void; connect:(targetId?:string)=>void
  pour:(to:string,fraction:number,filter?:boolean)=>void; guide:(action:string)=>void
}
const initial=createLesson('peroxide')
let uid=20
export const useLabStore=create<LabStore>((set,get)=>({
  sim:initial,history:[initial],cursor:0,playbackTime:0,playing:false,speed:1,mode:'guided',lessonId:'peroxide',selectedId:'v0',micro:false,completed:[],toast:null,
  notify:text=>set({toast:{id:Date.now(),text}}),
  select:selectedId=>set({selectedId}),
  togglePlay:()=>set(s=>({playing:!s.playing,playbackTime:s.sim.time})),setSpeed:speed=>set({speed}),toggleMicro:()=>set(s=>({micro:!s.micro})),
  loadLesson:id=>{const sim=createLesson(id);set({sim,history:[sim],cursor:0,playbackTime:0,playing:false,lessonId:id,mode:'guided',selectedId:'v0',micro:false,completed:[],toast:null})},
  freeLab:()=>{const sim=emptySimulation();sim.vessels.push(createVessel('beaker','v0',40,51));sim.events.push({time:0,text:'自由实验：已放置烧杯'});set({sim,history:[sim],cursor:0,playbackTime:0,playing:false,mode:'free',selectedId:'v0',micro:false,completed:[],toast:null})},
  reset:()=>{if(get().mode==='guided')get().loadLesson(get().lessonId);else get().freeLab()},
  advance:dt=>{
    const s=get();if(!s.playing)return
    if(s.cursor<s.history.length-1){
      const target=s.playbackTime+dt;let cursor=s.cursor
      while(cursor<s.history.length-1&&s.history[cursor+1].time<=target+1e-6)cursor++
      set({cursor,sim:s.history[cursor],playbackTime:target});return
    }
    if(s.sim.time>=600){set({playing:false});get().notify('已达到单次 10 分钟模拟上限，可回放或重置。');return}
    const sim=stepSimulation(s.sim,dt);const history=[...s.history,sim]
    set({sim,history,cursor:history.length-1,playbackTime:sim.time})
  },
  seek:time=>{const s=get();let lo=0,hi=s.history.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(s.history[mid].time<=time)lo=mid;else hi=mid-1}set({cursor:lo,sim:s.history[lo],playbackTime:s.history[lo].time,playing:false})},
  mutate:(fn,event)=>{
    const s=get();const sim=structuredClone(s.sim);const error=fn(sim)
    if(error){get().notify(error);return false}
    if(event)sim.events=[...sim.events,{time:sim.time,text:event}].slice(-200)
    // A changed past starts a new branch. Playing alone replays the recorded states.
    const history=[...s.history.slice(0,s.cursor+1),sim]
    set({sim,history,cursor:history.length-1,playbackTime:sim.time});return true
  },
  addEquipment:(kind,x=50,y=50)=>{
    const id='v'+uid++
    if(get().sim.vessels.length>=24){get().notify('实验台最多放置 24 件仪器，请先移除不需要的仪器。');return}
    get().mutate(sim=>{sim.vessels.push(createVessel(kind,id,x,y))},'放置'+instrumentMap[kind].name)
    if(isContainer(kind))set({selectedId:id})
  },
  removeEquipment:()=>{
    const s=get();const v=s.sim.vessels.find(v=>v.id===s.selectedId)
    if(!v)return
    if(v.contents.length){get().notify('容器中仍有物质。请先转移试剂，或使用重置清空实验。');return}
    get().mutate(sim=>{sim.vessels=sim.vessels.filter(v=>v.id!==s.selectedId);sim.connections=sim.connections.filter(c=>c.from!==s.selectedId&&c.to!==s.selectedId)},'移除空仪器')
    set({selectedId:get().sim.vessels.find(v=>isContainer(v.kind))?.id??''})
  },
  add:(id,mmol,phase,volumeMl,target)=>{
    const s=get();const targetId=target??s.selectedId
    const ok=get().mutate(sim=>{
      const v=sim.vessels.find(v=>v.id===targetId);if(!v)return '请先选择实验台上的反应容器。'
      return addReagent(v,id,mmol,phase,volumeMl)??undefined
    },'加入'+substanceMap[id].name+' '+mmol.toFixed(3)+' mmol')
    if(ok){set({selectedId:targetId});get().notify('已加入'+substanceMap[id].name)}
  },
  move:(id,x,y)=>{get().mutate(sim=>{const v=sim.vessels.find(v=>v.id===id);if(v){v.x=Math.max(10,Math.min(90,x));v.y=Math.max(16,Math.min(84,y))}})},
  heat:()=>{
    const s=get();get().mutate(sim=>{
      const v=sim.vessels.find(v=>v.id===s.selectedId)
      if(!v||!isContainer(v.kind))return '请先选择可加热的容器。'
      if(!sim.vessels.some(v=>v.kind==='lamp'))return '请先从仪器库放置酒精灯。'
      if(['gasJar','cylinder','trough'].includes(v.kind))return '此仪器不适合直接加热，请转移至烧杯、试管或蒸发皿。'
      if(v.stoppered&&!sim.connections.some(c=>c.from===v.id))return '密闭且没有导气通路，不能直接加热。'
      if(['testTube','roundFlask','crucible'].includes(v.kind)&&!v.supported)return '请先用铁架台或试管夹固定容器。'
      v.heating=!v.heating
    },'切换加热状态')
  },
  stir:()=>{const s=get();get().mutate(sim=>{
    const v=sim.vessels.find(v=>v.id===s.selectedId);if(!v||!isContainer(v.kind))return '请选择容器。'
    if(!sim.vessels.some(v=>v.kind==='rod'))return '请先放置玻璃棒。'
    v.stirring=!v.stirring
  },'切换玻璃棒搅拌')},
  connect:targetId=>{const s=get();get().mutate(sim=>{
    const from=sim.vessels.find(v=>v.id===s.selectedId)
    const target=targetId?sim.vessels.find(v=>v.id===targetId):sim.vessels.find(v=>v.kind==='gasJar'&&v.id!==s.selectedId)
    if(!from||!isContainer(from.kind)||from.kind==='gasJar')return '请先选择发生容器，再连接集气瓶。'
    if(!target||target.kind!=='gasJar')return '请先放置一个集气瓶。'
    if(!sim.vessels.some(v=>v.kind==='tube'))return '请先放置导管。'
    const exists=sim.connections.some(c=>c.from===from.id)
    sim.connections=sim.connections.filter(c=>c.from!==from.id)
    from.stoppered=!exists;from.supported=true
    if(!exists)sim.connections.push({from:from.id,to:target.id})
  },'切换导管连接')},
  pour:(to,fraction,filter=false)=>{const s=get();const ok=get().mutate(sim=>{
    if(filter&&!sim.vessels.some(v=>v.kind==='funnel'))return '请先放置漏斗（内置滤纸）。'
    return transfer(sim,s.selectedId,to,fraction,filter)??undefined
  },filter?'过滤分离：不溶性固体留作滤渣':'转移容器内容物');if(ok){set({selectedId:to});get().notify(filter?'滤液已转移；滤渣留在原容器。':'已完成定量倾倒。')}},
  guide:action=>{
    const s=get();if(s.completed.includes(action)&&!['play','micro','measure'].includes(action)){get().notify('此步骤已完成；可在试剂库继续自由添加。');return}
    const vessel=s.sim.vessels[0];if(!vessel)return
    let success=true
    const reagent=(id:string,n:number,volume=0,phase?:Phase)=>{success=get().mutate(sim=>addReagent(sim.vessels[0],id,n,phase??substanceMap[id].phase,volume)??undefined,'教学操作：加入'+substanceMap[id].name)}
    switch(action){
      case 'connect':set({selectedId:vessel.id});get().connect();break
      case 'play':set({playing:true});break
      case 'catalyst':reagent('MnO2',100/substanceMap.MnO2.molarMass);break
      case 'carbonateAcid':reagent('HCl',10,20);break
      case 'zincAcid':reagent('H2SO4',5,20);break
      case 'precipitateBase':reagent('NaOH',10,20);break
      case 'iron':reagent('Fe',5);break
      case 'neutralAcid':reagent('HCl',5,20);break
      case 'indicatorBase':reagent('NaOH',0.005,0.05);break
      case 'indicatorAcid':reagent('HCl',0.005,0.05);break
      case 'support':get().mutate(sim=>{sim.vessels[0].supported=true},'使用夹具固定容器');break
      case 'heat':set({selectedId:vessel.id});if(!vessel.heating)get().heat();set({playing:true});break
      case 'finishHeat':get().mutate(sim=>{sim.connections=[];sim.vessels.forEach(v=>{v.heating=false;v.stoppered=false})},'先断管后熄灯');break
      case 'micro':set({micro:true});break
      case 'stir':set({selectedId:vessel.id});get().stir();break
      case 'measure':get().notify('当前温度 '+vessel.temperature.toFixed(1)+' ℃；详见右侧条件与分析。');break
      case 'dissolve':reagent('H2O',555,10,'l');get().mutate(sim=>{sim.vessels[0].stirring=true},'用玻璃棒搅拌');set({playing:true});break
      case 'filter':{
        if(amount(vessel,'NaCl','s')>0.05){get().notify('盐尚未完全溶解，请先播放至白色盐晶体溶解（砂粒保留）。');return}
        set({selectedId:vessel.id});get().pour(s.sim.vessels[1].id,1,true);break
      }
      case 'evaporate':{
        const dish=get().sim.vessels.find(v=>v.kind==='dish')
        if(!dish||dish.volumeMl<0.1){get().notify('请先过滤，将滤液转入蒸发皿。');return}
        set({selectedId:dish.id});if(!dish.heating)get().heat();set({playing:true});break
      }
    }
    if(success)set(s=>({completed:[...new Set([...s.completed,action])]}))
  },
}))

export function downloadNotebook(){
  const s=useLabStore.getState()
  const blob=new Blob([JSON.stringify({format:'chemlab-notebook',version:1,lesson:s.mode==='guided'?lessonMap[s.lessonId].title:'自由实验',units:{amount:'mmol',volume:'mL',temperature:'C',time:'s'},snapshot:s.sim},null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ChemLab-实验记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
