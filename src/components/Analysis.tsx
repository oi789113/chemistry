import { useState } from 'react'
import { Activity,ChevronDown,FlaskConical,Info,SlidersHorizontal,Thermometer,Zap } from 'lucide-react'
import { useLabStore } from '../store/lab'
import { amount,getPH,mainRule,gasVolume,blockedReason } from '../chemistry/engine'
import { lessonMap } from '../chemistry/lessons'
import { reactionMap } from '../chemistry/reactions'
import { substanceMap,phaseNames } from '../chemistry/substances'
import { displayFormula } from '../chemistry/formula'
import { Equation } from './Equation'

export function Analysis(){
  const sim=useLabStore(s=>s.sim),selectedId=useLabStore(s=>s.selectedId),lessonId=useLabStore(s=>s.lessonId),mode=useLabStore(s=>s.mode)
  const [tab,setTab]=useState<'analysis'|'inventory'>('analysis'),[ionic,setIonic]=useState(false)
  const v=sim.vessels.find(v=>v.id===selectedId),actual=mainRule(v,sim),rule=actual??(mode==='guided'?reactionMap[lessonMap[lessonId].reactionId??'']:undefined)
  const extent=rule&&v?(v.reacted[rule.id]??0):0
  const active=sim.activities.find(a=>a.vesselId===selectedId&&a.reactionId===rule?.id)
  const remaining=rule&&v?Math.min(...rule.reactants.filter(t=>!(t.id==='O2'&&sim.environment==='air')).map(t=>amount(v,t.id,t.phase)/t.coefficient)):0
  const progress=active?.progress??(extent>0?extent/(extent+Math.max(0,remaining)):0)
  const ph=v?getPH(v):null
  const currentRate=active?.rate??0
  const condition=rule&&v&&actual?blockedReason(v,sim,rule):null
  const catalyst=rule?.catalyst&&v?amount(v,rule.catalyst,'s'):0
  return <aside className="analysis"><div className="panel-title"><div><span className="eyebrow">UNDERSTAND THE CHANGE</span><h2>实时反应分析</h2></div><Activity size={19} strokeWidth={1.5}/></div><div className="analysis-tabs"><button className={tab==='analysis'?'active':''} onClick={()=>setTab('analysis')}>反应分析</button><button className={tab==='inventory'?'active':''} onClick={()=>setTab('inventory')}>物质变化</button></div>
    <div className="analysis-scroll">
    {tab==='analysis'?<>
      <div className="analysis-section"><div className="section-caption"><span>化学方程式</span><span className="small-badge">{rule?(actual?'已配平':'实验目标'):'物理 / 指示变化'}</span></div>
        <div className="equation-card"><Equation rule={rule} ionic={ionic}/>{rule?.ionic&&<button className="ionic-toggle" onClick={()=>setIonic(!ionic)}>{ionic?'分子方程式':'查看离子方程式'} <ChevronDown size={11}/></button>}{!actual&&rule&&<small>补齐反应物与条件后开始计算</small>}{!rule&&<small>物理分离与指示剂显色不列净化学方程式</small>}</div>
        {rule&&<div className="reaction-type"><FlaskConical size={12}/>{rule.type}</div>}
      </div>
      <div className="analysis-section substance-analysis"><div className="section-caption"><span>当前反应物</span><small>mmol</small></div>{rule?rule.reactants.map(t=><div className="substance-line" key={t.id}><i style={{background:substanceMap[t.id].color}}/><span>{substanceMap[t.id].name}<small>{displayFormula(t.id)}</small></span><b>{v?amount(v,t.id,t.phase).toFixed(2):'0.00'}</b>{t.id==='O2'&&sim.environment==='air'&&<em>空气</em>}</div>):<p className="empty-copy">{mode==='guided'&&lessonId==='indicator'?'水、指示剂与少量酸碱，按 pH 显色。':'选择试剂，构建反应体系。'}</p>}
        <div className="section-caption product-caption"><span>累计生成物</span><small>mmol</small></div>{extent>0&&rule?rule.products.map(t=><div className="substance-line" key={t.id}><i style={{background:substanceMap[t.id].color}}/><span>{substanceMap[t.id].name}<small>{displayFormula(t.id)}{t.phase==='g'?' ↑':t.phase==='s'&&rule.visual==='precipitate'?' ↓':''}</small></span><b className="product-amount">{(extent*t.coefficient).toFixed(2)}</b></div>):<div className="waiting-products"><span>○</span>等待反应发生</div>}
      </div>
      <div className="analysis-section conditions"><div className="section-caption"><span><SlidersHorizontal size={13}/>反应条件</span><Info size={12}/></div>
        <div className="temperature-row"><span><Thermometer size={15}/>当前温度</span><b>{v?.temperature.toFixed(1)??'—'}<small> ℃</small></b></div>
        <label className="temperature-label">恒温环境 <span>{v?.targetTemperature??25} ℃</span><input type="range" min="20" max="650" step="1" value={v?.targetTemperature??25} aria-label="恒温环境温度" disabled={!v} onChange={e=>{const n=Number(e.target.value);useLabStore.getState().mutate(s=>{const v=s.vessels.find(v=>v.id===selectedId);if(v){v.targetTemperature=n;v.temperature=n}},'调整恒温环境至 '+n+' ℃')}}/></label><div className="range-labels"><span>20 ℃</span><span>650 ℃</span></div>
        <div className="condition-row"><span>加热条件</span><b className={v?.heating?'warm-text':''}>{v?.heating?'酒精灯加热中':'未加热'}</b></div>
        <div className="condition-row"><span>反应环境</span><b>{sim.environment==='air'?'开放 · 空气':'密闭环境'}</b></div>
        <div className="condition-row"><span>催化剂</span><b>{catalyst&&rule?.catalyst?<><i className="catalyst-dot"/>{displayFormula(rule.catalyst)} <small>{(catalyst*substanceMap[rule.catalyst].molarMass/1000).toFixed(3)} g</small></>:rule?.catalyst?'未添加':'无需'}</b></div>
        {rule?.catalyst&&!catalyst&&<button className="add-catalyst" onClick={()=>{if(v)useLabStore.getState().add(rule.catalyst!,100/substanceMap[rule.catalyst!].molarMass,'s',0)}}><Zap size={12}/>加入 0.1 g {displayFormula(rule.catalyst)}<span>＋</span></button>}
        {condition&&<p className="condition-notice">{condition}</p>}
      </div>
      <div className="analysis-section"><div className="section-caption"><span>反应进度</span><b className="green-text">{Math.min(100,progress*100).toFixed(0)}<small> %</small></b></div><div className="progress-track"><i style={{width:Math.min(100,progress*100)+'%'}}/></div><div className="progress-meta"><span>{extent>0?(progress>.999?'反应完成':'反应进行中'):'等待开始'}</span><span>{currentRate.toFixed(3)} mmol/s</span></div>
        <div className="metric-grid"><div><span>pH <small>25 ℃ 参考</small></span><b>{ph!==null?ph.toFixed(1):'—'}</b><div className="ph-bar">{ph!==null&&<i style={{left:ph/14*100+'%'}}/>}</div></div><div><span>已收集气体</span><b>{sim.vessels.filter(v=>v.kind==='gasJar').reduce((sum,v)=>sum+gasVolume(v),0).toFixed(1)}<small> mL</small></b><div className="gas-meter"><i style={{width:Math.min(100,sim.vessels.filter(v=>v.kind==='gasJar').reduce((s,v)=>s+gasVolume(v),0)/2.5)+'%'}}/></div></div></div>
      </div>
      <div className="observation-card"><div><span className="live-dot"/><b>实验现象</b></div><p>{extent>0?rule?.observation:mode==='guided'&&lessonId==='indicator'?'无色酚酞溶液随 pH 升高变为粉红色；滴加酸后褪色。':v?.evaporatedMl?'水分蒸发，液面降低；达到饱和后，白色氯化钠晶体逐渐析出。':'反应尚未发生。添加试剂或调整条件，观察实验台上的变化。'}</p></div>
      <details className="principle-card" open><summary><Info size={13}/>反应原理<ChevronDown size={13}/></summary><p>{rule?.principle??(mode==='guided'?lessonMap[lessonId].explanation:'引擎只对已实现且条件满足的规则进行计算。未支持的组合会明确提示。')}</p></details>
    </>:<Inventory/>}
    <div className="model-note"><Info size={12}/><span>教学模拟 · 定量守恒<br/>速率与粒子运动使用教学近似</span></div>
    </div>
  </aside>
}
function Inventory(){
  const sim=useLabStore(s=>s.sim),history=useLabStore(s=>s.history),selectedId=useLabStore(s=>s.selectedId)
  const v=sim.vessels.find(v=>v.id===selectedId),initial=history[0].vessels.find(v=>v.id===selectedId)
  return <div className="inventory-view"><div className="section-caption"><span>当前容器的物质账本</span><small>mmol</small></div><p className="empty-copy">用量包括溶剂。生成量、现存量和逸散量分别记录。</p><div className="inventory-table"><div className="inventory-head"><span>物质 / 物态</span><span>反应前</span><span>当前</span></div>{v?.contents.map(p=><div key={p.id+p.phase}><span><b>{displayFormula(p.id)}</b><small>{phaseNames[p.phase]}</small></span><span>{initial?amount(initial,p.id,p.phase).toFixed(2):'0.00'}</span><span>{p.mmol.toFixed(2)}</span></div>)}</div><div className="analysis-section"><div className="section-caption">逸散至环境</div>{Object.entries(sim.escaped).filter(([,n])=>n>.0001).map(([id,n])=><div className="condition-row" key={id}><span>{displayFormula(id)}</span><b>{n.toFixed(3)} mmol</b></div>)}</div><div className="analysis-section"><div className="section-caption">从环境输入</div>{Object.entries(sim.supplied).filter(([,n])=>n>.0001).map(([id,n])=><div className="condition-row" key={id}><span>{displayFormula(id)}</span><b>{n.toFixed(3)} mmol</b></div>)}{!Object.keys(sim.supplied).length&&<p className="empty-copy">尚无环境物质输入</p>}</div><p className="empty-copy">反应前为当前实验准备时的快照。后续添加与转移操作可在实验记录中查看。</p></div>
}
