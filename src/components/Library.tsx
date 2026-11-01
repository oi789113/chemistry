import { useMemo,useState } from 'react';
import { Search, ChevronDown, SlidersHorizontal, Plus, X, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { categories,substances } from '../data/substances';
import { equipment } from '../data/equipment';
import type { Phase,Substance } from '../chemistry/types';
import { Instrument } from '../visuals/Instrument';
import { Formula } from './Equation';
import { useLab } from '../store/lab';
import { reactions } from '../data/reactions';
const phaseName:Record<Phase,string>={s:'固体',l:'液体',g:'气体',aq:'溶液'};
export function ReagentIcon({s}:{s:Substance}) {return <div className="reagent-icon" style={{'--reagent':s.color} as React.CSSProperties}><svg viewBox="0 0 48 56" aria-hidden="true"><defs><linearGradient id={`bottle-${s.id}`} x1="0" x2="1"><stop stopColor="#d0e0df" stopOpacity=".6"/><stop offset=".3" stopColor="white"/><stop offset="1" stopColor="#bdd6d4" stopOpacity=".8"/></linearGradient></defs><rect x="15" y="3" width="18" height="8" rx="2" fill="#627b78"/><path d="M17 11 V16 Q9 19 9 25 V47 Q9 51 14 51 H34 Q39 51 39 47 V25 Q39 19 31 16 V11Z" fill={`url(#bottle-${s.id})`} stroke="#adbfbd"/><path d="M11 29 H37 V46 Q37 49 33 49 H15 Q11 49 11 46Z" fill={s.color} opacity=".75"/>{s.phase==='s'&&[0,1,2,3,4].map(i=><path key={i} d={`M${14+i*4} ${46-i%2*2}l2 -4l3 4Z`} fill="white" opacity=".4"/>)}<rect x="13" y="28" width="22" height="12" rx="1" fill="#fcfcf3" opacity=".88"/><text x="24" y="36.5" textAnchor="middle" fontSize="6" fill="#5e7572" fontWeight="600">{s.formula.length<9?s.formula:'CHEM'}</text><path d="M13 24 V44" stroke="white" strokeWidth="2" opacity=".65"/></svg></div>;}
export function Library(){
  const [tab,setTab]=useState<'reagents'|'equipment'>('reagents'),[category,setCategory]=useState('全部试剂'),[query,setQuery]=useState(''),[selected,setSelected]=useState<Substance|null>(null);
  const dropping=useLab(s=>s.dropping),addEquipment=useLab(s=>s.addEquipment);
  const filtered=useMemo(()=>substances.filter(s=>(category==='全部试剂'||s.category===category||(category==='酸'&&s.id==='acetic')||(category==='氧化物'&&s.id==='mno2'))&&`${s.name}${s.formula}`.toLowerCase().includes(query.toLowerCase().replace(/[₀-₉]/g,n=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(n))))),[category,query]);
  return <aside className="library panel"><div className="panel-heading"><h2>实验物品库</h2><span className="count-badge">{substances.length+equipment.length}</span></div>
    <div className="segmented"><button className={tab==='reagents'?'active':''} onClick={()=>setTab('reagents')}>化学试剂</button><button className={tab==='equipment'?'active':''} onClick={()=>setTab('equipment')}>实验仪器</button></div>
    <label className="search-field"><Search size={16}/><input aria-label="搜索物质或仪器" placeholder="搜索名称或化学式…" value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌕</kbd></label>
    {tab==='reagents'&&<label className="category-select"><SlidersHorizontal size={14}/><select aria-label="试剂分类" value={category} onChange={e=>setCategory(e.target.value)}>{['全部试剂',...categories].map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={14}/></label>}
    <div className="library-scroll">
      <div className="library-subheading"><span>{tab==='reagents'?category:'精细实验仪器'}</span><span>{tab==='reagents'?filtered.length:equipment.filter(e=>e.name.includes(query)).length} 件</span></div>
      <div className={tab==='reagents'?'reagent-list':'equipment-grid'}>
        {tab==='reagents'?filtered.map(s=><button className="reagent-card" key={s.id} draggable onDragStart={e=>{e.dataTransfer.setData('application/chemlab-reagent',s.id);e.dataTransfer.effectAllowed='copy';useLab.getState().setHeld(s.id);}} onDragEnd={()=>useLab.getState().setHeld(null)} onClick={()=>setSelected(s)} title={`查看 ${s.name}，设置用量后添加`}>
          <ReagentIcon s={s}/><span className="reagent-info"><strong>{s.name}</strong><span><Formula value={s.formula}/><small>{phaseName[s.phase]}</small></span></span><Plus size={14} className="add-symbol"/>
        </button>):equipment.filter(e=>e.name.includes(query)).map(item=><button className="equipment-card" key={item.kind} draggable onDragStart={e=>{e.dataTransfer.setData('application/chemlab-equipment',item.kind);e.dataTransfer.effectAllowed='copy';}} onClick={()=>addEquipment(item.kind)} title={item.description}><Instrument kind={item.kind} icon/><span>{item.name}</span><Plus size={12}/></button>)}
      </div>
      {tab==='reagents'&&!filtered.length&&<div className="empty-state">没有匹配的试剂，试试输入化学式。</div>}
    </div>
    <div className="library-footer"><span className="tiny-dot"/>{dropping?'滴管模式 · 每次 0.5 mL':'点击设置用量，或拖入实验容器'}</div>
    {selected&&<DoseDialog substance={selected} onClose={()=>setSelected(null)}/>}
  </aside>;
}
export function DoseDialog({substance:s,onClose,target}:{substance:Substance;onClose:()=>void;target?:string}) {
  const dropping=useLab(st=>st.dropping),lab=useLab(st=>st.lab),selected=useLab(st=>st.selected);
  const v=lab.vessels.find(v=>v.uid===(target??selected));
  const [phase,setPhase]=useState<Phase>(s.phase),[quantity,setQuantity]=useState(dropping&&s.phase==='aq'?.5:s.phase==='s'?.15:s.phase==='g'?25:10),[concentration,setConcentration]=useState(.5);
  const rules=reactions.filter(r=>r.reactants.some(t=>t.id===s.id)||r.products.some(t=>t.id===s.id)||r.catalyst===s.id);
  return <div className="modal-backdrop" onClick={onClose}><section role="dialog" aria-modal="true" aria-labelledby="dose-title" className="dose-dialog" onClick={e=>e.stopPropagation()}>
    <button className="icon-button modal-close" onClick={onClose} aria-label="关闭试剂详情"><X size={20}/></button>
    <div className="dose-heading"><ReagentIcon s={s}/><div><div className="eyebrow">REAGENT / {s.category}</div><h2 id="dose-title">{s.name}</h2><p><Formula value={s.formula}/> <span>· {s.appearance}</span></p></div></div>
    <p className="property-text">{s.properties}</p>
    <div className="dose-fields"><label>添加形态<select aria-label="添加形态" value={phase} onChange={e=>{const p=e.target.value as Phase;setPhase(p);setQuantity(p==='s'?.15:dropping?.5:10);}}><option value={s.phase}>{phaseName[s.phase]}</option>{s.phase==='s'&&['nacl','cuso4','kmno4'].includes(s.id)&&<option value="aq">配制溶液</option>}{s.phase==='aq'&&s.category!=='指示剂'&&<option value="s">固体试剂</option>}</select></label>
      <label>加入量（{phase==='s'?'g':'mL'}）<input aria-label="加入量" type="number" min="0.001" max="1000" step={phase==='s'?.05:.5} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
      {phase==='aq'&&<label>浓度（mol/L）<input aria-label="溶液浓度" type="number" min="0.001" max="6" step="0.1" value={concentration} onChange={e=>setConcentration(Number(e.target.value))}/></label>}
    </div>
    <div className="dose-destination">加入至 <strong>{v?equipment.find(e=>e.kind===v.kind)?.name:'请先选择容器'}</strong>{dropping&&phase==='aq'&&<span>滴管 · 0.5 mL/次</span>}</div>
    <details><summary>物质档案与支持的反应 <ChevronDown size={14}/></summary><p>{s.conditions}</p><p>摩尔质量：{s.molarMass.toFixed(3)} g/mol</p><p>{rules.length?rules.map(r=>r.name).join('、'):'该物质已收录；相关反应暂未实现，不推断生成物。'}</p></details>
    <div className="safety-note"><ShieldAlert size={16}/><span>{s.safety}</span></div>
    <button className="button primary wide" onClick={()=>{if(!Number.isFinite(quantity)||quantity<=0||quantity>1000||!Number.isFinite(concentration)||concentration<=0||concentration>6){useLab.getState().tell('请填写有效的用量和浓度（0–6 mol/L）','error');return;}useLab.getState().add({id:s.id,phase,amount:dropping&&phase==='aq'?.5:quantity,concentration},target);onClose();}}><Plus size={17}/> {dropping&&phase==='aq'?'滴加 0.5 mL':'加入实验容器'}<ArrowUpRight size={16}/></button>
  </section></div>;
}
