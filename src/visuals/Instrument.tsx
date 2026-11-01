import { useId } from 'react';
import type { EquipmentKind, Vessel } from '../chemistry/types';
import { amount, gasVolume, solutionColor, volume } from '../chemistry/engine';
import { equipmentByKind } from '../data/equipment';
export const paths: Partial<Record<EquipmentKind,string>> = {
  flask:'M68 22 L68 83 Q68 92 59 108 L23 183 Q13 210 38 214 L143 214 Q167 210 157 183 L121 108 Q112 92 112 83 L112 22 Z',
  'test-tube':'M58 22 L58 182 Q58 217 90 217 Q122 217 122 182 L122 22 Z',
  beaker:'M28 54 L34 199 Q34 214 48 214 L139 214 Q152 214 152 200 L152 54 Z',
  'round-flask':'M73 22 L73 81 Q19 98 24 158 Q30 214 90 214 Q151 214 156 158 Q161 98 107 81 L107 22 Z',
  'gas-jar':'M52 37 L52 55 L40 60 L40 203 Q40 214 53 214 L130 214 Q143 214 143 203 L143 60 L131 55 L131 37 Z',
  cylinder:'M68 24 L68 201 L55 211 L55 217 L126 217 L126 211 L112 201 L112 24 Z',
  dish:'M20 147 Q24 205 90 213 Q152 208 161 147 Z',
  crucible:'M40 113 L56 204 Q90 219 125 204 L142 113 Z',
  trough:'M10 106 L24 199 Q88 220 157 199 L171 106 Z',
};
export function liquidY(v:Vessel) {
  const fraction=Math.min(1,volume(v)/(equipmentByKind[v.kind].capacity??250));
  return v.kind==='dish'?204-fraction*52:v.kind==='crucible'?204-fraction*79:v.kind==='trough'?202-fraction*83:207-Math.sqrt(fraction)*145;
}
export function Instrument({kind,vessel,icon=false,running=false}:{kind:EquipmentKind;vessel?:Vessel;icon?:boolean;running?:boolean}) {
  const ident=useId().replace(/:/g,''); const id=(s:string)=>`${ident}-${s}`;
  const path=paths[kind]; const fill= vessel?volume(vessel):0;
  const y=vessel?liquidY(vessel):142; const color=vessel?solutionColor(vessel):'#7bc4cb';
  const sample=icon && path; const flame=kind==='burner'&&running;
  const solid=vessel?.contents.filter(m=>m.phase==='s'&&m.moles>1e-8)??[];
  const hasGas=vessel&&kind==='gas-jar'&&gasVolume(vessel)>0;
  return <svg className={`instrument-svg ${flame?'is-burning':''}`} viewBox="0 0 180 240" aria-hidden="true">
    <defs>
      <linearGradient id={id('glass')} x1="0" x2="1"><stop offset="0" stopColor="#9ec7cf" stopOpacity=".34"/><stop offset=".13" stopColor="white" stopOpacity=".75"/><stop offset=".3" stopColor="#d8eff0" stopOpacity=".12"/><stop offset=".68" stopColor="white" stopOpacity=".12"/><stop offset=".9" stopColor="#a9cbd3" stopOpacity=".42"/><stop offset="1" stopColor="#82b1bc" stopOpacity=".6"/></linearGradient>
      <linearGradient id={id('liquid')} x1="0" y1="0" x2=".8" y2="1"><stop stopColor={color} stopOpacity=".42"/><stop offset=".5" stopColor={color} stopOpacity=".7"/><stop offset="1" stopColor={color} stopOpacity=".95"/></linearGradient>
      <linearGradient id={id('metal')}><stop stopColor="#7c939b"/><stop offset=".25" stopColor="#e1e9e9"/><stop offset=".55" stopColor="#a1b1b4"/><stop offset="1" stopColor="#657b81"/></linearGradient>
      <radialGradient id={id('fire')} cx="50%" cy="80%" r="80%"><stop stopColor="#edfafb"/><stop offset=".25" stopColor="#52c8f0"/><stop offset=".6" stopColor="#ffbf54"/><stop offset="1" stopColor="#ff7038" stopOpacity=".1"/></radialGradient>
      {path&&<clipPath id={id('inside')}><path d={path}/></clipPath>}
      <filter id={id('blur')}><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    {!icon&&<ellipse cx="91" cy="221" rx={kind==='test-tube'?40:74} ry="8" fill="#3c6763" opacity=".09" filter={`url(#${id('blur')})`}/>}
    {path?<>
      <path d={path} fill={`url(#${id('glass')})`} stroke="#8daeb6" strokeWidth="1.6"/>
      <g clipPath={`url(#${id('inside')})`}>
        {(fill>.01||sample)&&<><rect x="0" y={sample?145:y} width="180" height="240" fill={`url(#${id('liquid')})`}/><ellipse cx="90" cy={sample?145:y} rx="90" ry="5" fill={color} opacity=".55"/><path d={`M0 ${y+2} Q90 ${y+9} 180 ${y+2}`} stroke="white" opacity=".45" fill="none"/></>}
        {hasGas&&<rect x="38" y={214-Math.min(1,gasVolume(vessel)/250)*154} width="107" height="160" fill="#73c9b4" opacity=".25"/>}
        {solid.map((m,i)=><g key={m.id} fill={m.id==='mg'?'#adbcc4':m.id==='cu'?'#c57d57':m.id==='mno2'?'#42484b':m.id==='kmno4'?'#713a79':m.id==='cuoh2'?'#63abdb':m.id==='fe'?'#81949c':'#e2dfcd'} opacity=".92">
          {Array.from({length:Math.min(35,Math.max(3,Math.round(m.moles*1700)))},(_,j)=><path key={j} d={`M${36+(j*31+i*7)%103} ${204-(j*7%18)} l${5+j%4} -${2+j%5} l4 6 l-6 3 Z`}/>)}</g>)}
        <path d="M40 69 L44 185 Q44 200 52 201" stroke="white" strokeWidth="5" opacity=".6" fill="none" strokeLinecap="round"/>
        <path d="M146 72 L146 187" stroke="white" strokeWidth="2" opacity=".5"/>
      </g>
      <path d={path} stroke="#96b9c2" strokeWidth="1.2" opacity=".65" fill="none"/>
      {['beaker','cylinder','test-tube'].includes(kind)&&<g stroke="#76949d" strokeWidth="1" opacity=".65">{Array.from({length:kind==='cylinder'?10:5},(_,i)=><g key={i}><path d={`M${kind==='cylinder'?93:kind==='test-tube'?101:128} ${85+i*20} h${i%2===0?14:8}`}/>{!icon&&kind==='beaker'&&i%2===0&&<text x="123" y={88+i*20} textAnchor="end" stroke="none" fill="#77949d" fontSize="7">{200-i*25}</text>}</g>)}</g>}
      {['flask','round-flask','test-tube','cylinder'].includes(kind)&&<ellipse cx="90" cy="23" rx={kind==='test-tube'?33:kind==='cylinder'?24:kind==='flask'?24:19} ry="4" fill="#e2f0f0" fillOpacity=".55" stroke="#9dbac1" strokeWidth="1.5"/>}
      {kind==='beaker'&&<path d="M27 54 Q27 49 40 50 H151 L161 45" stroke="#95b6bd" fill="none" strokeWidth="3" strokeLinecap="round"/>}
      {kind==='gas-jar'&&<ellipse cx="91" cy="37" rx="41" ry="5" fill="#e9f4f1" fillOpacity=".65" stroke="#a6bfc2" strokeWidth="2"/>}
      {kind==='dish'&&<ellipse cx="90" cy="147" rx="71" ry="10" fill="#dce9e7" fillOpacity=".5" stroke="#91adb4" strokeWidth="2"/>}
      {vessel?.sealed&&<><path d="M65 15 L70 36 L111 36 L116 15Z" fill="#596569"/><ellipse cx="90" cy="15" rx="26" ry="5" fill="#7c888a"/><path d="M94 15 V4" stroke="#bbc9cc" strokeWidth="7"/></>}
      {!icon&&<text x="90" y={kind==='dish'?187:kind==='crucible'?154:kind==='gas-jar'?110:kind==='flask'?149:110} textAnchor="middle" fontSize="9" fontWeight="600" fill="#64858a" opacity=".65">{kind==='flask'?'CHEMLAB':kind==='beaker'?'250 mL':kind==='gas-jar'?'GAS':kind==='dish'?'PORCELAIN':''}</text>}
    </>:<>
      {kind==='burner'&&<>
        <ellipse cx="90" cy="207" rx="46" ry="10" fill="#839ca3" opacity=".4"/>
        <path d="M60 153 Q48 172 52 199 Q90 224 129 199 Q132 172 120 153 Z" fill={`url(#${id('glass')})`} stroke="#8eaeb4" strokeWidth="2"/>
        <path d="M54 182 Q90 192 126 182 L127 198 Q90 217 53 198 Z" fill="#b9dbe3" opacity=".7"/>
        <ellipse cx="90" cy="153" rx="30" ry="7" fill="#9aa6a5"/><path d="M82 149 L84 127 H97 L99 149" fill={`url(#${id('metal')})`}/><path d="M90 130 V120" stroke="#6c6558" strokeWidth="5"/>
        {flame&&<g className="flame"><path d="M90 120 Q63 104 82 71 Q83 93 95 56 Q122 101 90 120" fill={`url(#${id('fire')})`}/><path d="M90 120 Q78 112 91 90 Q105 113 90 120" fill="#66c6f2" opacity=".8"/></g>}
      </>}
      {kind==='stand'&&<><path d="M16 218 L129 218 L151 207 L42 207 Z" fill="#a0b1b2"/><rect x="48" y="17" width="8" height="193" rx="3" fill={`url(#${id('metal')})`}/><path d="M52 77 H151" stroke="#9eaeb2" strokeWidth="6"/><path d="M131 73 L139 90 L160 90" stroke="#627c84" strokeWidth="5" fill="none"/><circle cx="53" cy="76" r="8" fill="#627b82"/><circle cx="53" cy="76" r="3" fill="#bfcfcf"/></>}
      {kind==='dropper'&&<g transform="rotate(20 90 120)"><rect x="78" y="35" width="24" height="49" rx="10" fill="#476a6d"/><path d="M82 81 L82 161 L89 183 L94 161 L97 81" fill={`url(#${id('glass')})`} stroke="#8fadb5" strokeWidth="2"/><path d="M85 128 V160 L90 173 L94 159 V128" fill="#74bfc9" opacity=".8"/><path className={running?'droplet':''} d="M90 195 Q77 212 90 216 Q103 212 90 195" fill="#76bdcc"/></g>}
      {kind==='rod'&&<g transform="rotate(23 90 120)"><rect x="86" y="27" width="9" height="188" rx="4.5" fill={`url(#${id('glass')})`} stroke="#98b9c0"/><path d="M89 33 V205" stroke="white" strokeWidth="2" opacity=".8"/></g>}
      {kind==='funnel'&&<><path d="M22 61 L81 126 L84 205 L97 205 L100 126 L159 61 Z" fill={`url(#${id('glass')})`} stroke="#96b4ba" strokeWidth="2"/><path d="M35 65 L90 116 L146 65" fill="#f8f5e9" opacity=".8"/><ellipse cx="90" cy="61" rx="69" ry="10" fill="#dfeded" fillOpacity=".45" stroke="#99b6ba" strokeWidth="2"/></>}
      {kind==='tube'&&<><path d="M34 191 V67 Q34 39 62 39 H122 Q147 39 147 67 V175" stroke="#8caab1" strokeWidth="11" fill="none" strokeLinecap="round"/><path d="M34 191 V67 Q34 39 62 39 H122 Q147 39 147 67 V175" stroke="#e7f3f0" strokeWidth="6" fill="none" strokeLinecap="round"/></>}
      {kind==='thermometer'&&<><rect x="79" y="27" width="22" height="156" rx="11" fill={`url(#${id('glass')})`} stroke="#9cbac0"/><circle cx="90" cy="190" r="19" fill="#dcebef" stroke="#9ab3ba"/><circle cx="90" cy="190" r="11" fill="#e37e70"/><path d="M90 185 V87" stroke="#df7a70" strokeWidth="6" strokeLinecap="round"/>{Array.from({length:10},(_,i)=><path key={i} d={`M94 ${49+i*12} h5`} stroke="#7d9da6" strokeWidth="1"/>)}</>}
      {kind==='clamp'&&<><path d="M42 191 L115 66 L144 80 L79 207" fill="#d3b98d" stroke="#9c805b" strokeWidth="2"/><path d="M83 139 L141 72 M101 113 L124 125" stroke="#6c7a79" strokeWidth="4"/><path d="M112 64 L124 45 L153 62 L143 82" fill="none" stroke="#a18a68" strokeWidth="7"/></>}
      {kind==='stopper'&&<><path d="M45 88 L59 156 Q90 169 123 156 L136 88" fill="#68787a"/><ellipse cx="90" cy="88" rx="46" ry="12" fill="#8a9798"/><ellipse cx="91" cy="87" rx="6" ry="3" fill="#344e55"/></>}
    </>}
    {vessel?.heating&&kind!=='burner'&&<ellipse cx="90" cy="216" rx="53" ry="7" fill="#efad6b" opacity=".25" className={running?'heat-glow':''}/>}
    {vessel&&amount(vessel,'mg')>1e-9&&vessel.ignited&&vessel.records.magnesium?.rate>0&&<g className={running?'magnesium-glow':''}><circle cx="90" cy="193" r="22" fill="#fffdf1" opacity=".9"/><circle cx="90" cy="193" r="32" fill="#fff8d7" opacity=".4" filter={`url(#${id('blur')})`}/></g>}
  </svg>;
}
