import { useEffect, useRef } from 'react'
import { amount, gasVolume, getPH } from '../chemistry/engine'
import { instrumentMap } from '../chemistry/instruments'
import { reactionMap } from '../chemistry/reactions'
import { substanceMap } from '../chemistry/substances'
import type { Simulation, Vessel } from '../chemistry/types'
import { geometry } from './geometry'

const seed=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)}
const mix=(a:number[],b:number[],t:number)=>a.map((n,i)=>Math.round(n+(b[i]-n)*Math.max(0,Math.min(1,t))))
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
export function liquidColor(v:Vessel):number[]{
  let color=[160,207,220]
  const colored=v.contents.filter(p=>p.phase==='aq'&&substanceMap[p.id].solutionColor)
  for(const p of colored)color=mix(color,rgb(substanceMap[p.id].solutionColor!),Math.min(0.95,p.mmol/Math.max(v.volumeMl,1)*5))
  const ph=getPH(v)
  if(ph!==null&&amount(v,'C20H14O4')>0)color=mix(color,[218,74,153],(ph-8.2)/1.8)
  if(ph!==null&&amount(v,'C14H14N3NaO3S')>0)color=mix([219,83,75],[230,190,65],(ph-3.1)/1.3)
  return color
}
export function ReactionCanvas({vessel:v,sim}:{vessel:Vessel;sim:Simulation}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=160*dpr;canvas.height=210*dpr
    const c=canvas.getContext('2d');if(!c)return
    c.scale(dpr,dpr)
    const g=geometry(v.kind);const path=new Path2D(g.inner)
    c.save();c.clip(path)
    const time=sim.time,cap=instrumentMap[v.kind].capacity
    const fill=Math.min(.88,Math.sqrt(Math.max(0,v.volumeMl)/cap)*.92)
    const waterLevel=g.bottom-(g.bottom-g.top)*fill
    const color=liquidColor(v)
    if(v.volumeMl>0.005){
      const gradient=c.createLinearGradient(0,waterLevel,0,g.bottom)
      gradient.addColorStop(0,'rgba('+color.join(',')+',.49)');gradient.addColorStop(1,'rgba('+mix(color,[72,124,143],.23).join(',')+',.82)')
      c.fillStyle=gradient;c.beginPath();c.moveTo(0,g.bottom);c.lineTo(0,waterLevel)
      for(let x=0;x<=160;x+=2)c.lineTo(x,waterLevel+Math.sin(x*.075+time*2)*(v.stirring?2.8:0.65))
      c.lineTo(160,g.bottom);c.closePath();c.fill()
      c.strokeStyle='rgba('+mix(color,[60,123,149],.4).join(',')+',.75)';c.lineWidth=1.1
      c.beginPath();for(let x=0;x<=160;x+=2){const y=waterLevel+Math.sin(x*.075+time*2)*(v.stirring?2.8:.65);if(x===0)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke()
      c.fillStyle='#ffffff44';c.beginPath();c.ellipse(79,waterLevel+2,44,3,0,0,Math.PI*2);c.fill()
    }
    const active=sim.activities.filter(a=>a.vesselId===v.id)
    const gasRate=active.filter(a=>reactionMap[a.reactionId].visual==='gas').reduce((n,a)=>n+a.rate,0)
    const retainedGas=v.contents.filter(p=>p.phase==='g').reduce((n,p)=>n+p.mmol,0)
    const bubbleCount=Math.min(65,Math.floor((gasRate*65+retainedGas*9)*(v.kind==='gasJar'?0:1)))
    const bubbleTop=v.volumeMl>0.01?waterLevel:g.top+20
    for(let i=0;i<bubbleCount;i++){
      const cycle=2.2+seed(i+3)*2.5
      const phase=((time/cycle+seed(i*5))%1)
      const x=55+seed(i+51)*49+Math.sin(time*2.4+i)*3
      const y=g.bottom-9-phase*(g.bottom-bubbleTop-5)
      const r=(1.1+seed(i+98)*2.4)*(0.65+phase*.5)
      c.strokeStyle='rgba(255,255,255,'+(0.4+phase*.4)+')';c.fillStyle='#eaffff27';c.lineWidth=.8
      c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#ffffffb0';c.beginPath();c.arc(x-r*.25,y-r*.3,r*.2,0,Math.PI*2);c.fill()
    }
    for(const p of v.contents.filter(p=>p.phase==='s')){
      const product=Object.keys(v.reacted).some(id=>reactionMap[id]?.products.some(t=>t.id===p.id))
      const precipitate=['Cu(OH)2','AgCl','BaSO4','Fe(OH)3','CaCO3'].includes(p.id)&&product
      const count=Math.min(160,Math.max(4,Math.round(p.mmol*(precipitate?23:p.id==='MnO2'?18:12))))
      for(let i=0;i<count;i++){
        const a=seed(i+205+p.id.length),b=seed(i*2+52),d=seed(i+70)
        let x=39+a*83,y=g.bottom-5-b*14
        let size=(precipitate?1.2:1.8)+d*(precipitate?2.5:3)
        if(precipitate){
          const local=time-(v.reactionStarted?.[Object.keys(v.reacted).find(id=>reactionMap[id]?.products.some(t=>t.id===p.id))??'']??0)
          const settling=Math.max(0,Math.min(1,(local-a*12)/18))
          y=(waterLevel+7+b*(g.bottom-waterLevel-18))*(1-settling)+(g.bottom-5-b*8)*settling
          x+=Math.sin(time*.7+i)*(1-settling)*3
          if(v.stirring){y=waterLevel+5+((b+time*.04)%1)*(g.bottom-waterLevel-12);x+=Math.sin(time+i)*9}
          size*=.7+settling*.5
        }
        c.fillStyle=substanceMap[p.id].color;c.globalAlpha=precipitate?.72:.85
        if(p.id==='NaCl'||p.id==='KMnO4'){
          c.save();c.translate(x,y);c.rotate(d*1.3);c.fillRect(-size/2,-size/2,size*1.3,size);c.strokeStyle='#fff7';c.lineWidth=.5;c.strokeRect(-size/2,-size/2,size*1.3,size);c.restore()
        }else{c.beginPath();c.ellipse(x,y,size,size*.65,d,0,Math.PI*2);c.fill();c.fillStyle='#ffffff38';c.beginPath();c.arc(x-.5,y-.8,size*.35,0,Math.PI*2);c.fill()}
      }
    }
    c.globalAlpha=1
    if(v.kind==='gasJar'){
      const fill=Math.min(1,gasVolume(v)/cap)
      const y=g.bottom-fill*(g.bottom-g.top)
      const gradient=c.createLinearGradient(0,y,0,g.bottom);gradient.addColorStop(0,'#79bba52a');gradient.addColorStop(1,'#90ccb760');c.fillStyle=gradient;c.fillRect(30,y,100,g.bottom-y)
      if(fill>.01){c.strokeStyle='#75ad97aa';c.setLineDash([3,3]);c.beginPath();c.moveTo(34,y);c.lineTo(125,y);c.stroke();c.setLineDash([])}
      for(let i=0;i<Math.floor(fill*23);i++){c.fillStyle='#69a78a70';c.beginPath();c.arc(48+seed(i)*65,58+((seed(i+2)+time*.025)%1)*119,1.4,0,Math.PI*2);c.fill()}
    }
    c.restore()
    const burning=active.some(a=>reactionMap[a.reactionId].visual==='burning'&&a.rate>.002)
    if(burning){
      const flare=.85+Math.sin(time*37)*.15;const glow=c.createRadialGradient(80,126,2,80,126,62)
      glow.addColorStop(0,'rgba(255,255,255,'+flare+')');glow.addColorStop(.27,'#fffde0bb');glow.addColorStop(1,'#e8f9ff00');c.fillStyle=glow;c.fillRect(13,59,134,134)
      for(let i=0;i<12;i++){const angle=seed(i)*Math.PI*2,r=10+((time*30+seed(i)*45)%45);c.strokeStyle='#fffbe7aa';c.lineWidth=1;c.beginPath();c.moveTo(80+Math.cos(angle)*r,126+Math.sin(angle)*r);c.lineTo(80+Math.cos(angle)*(r+7),126+Math.sin(angle)*(r+7));c.stroke()}
    }
    if(v.heating&&v.temperature>65){
      c.strokeStyle='#98b4ae44';c.lineWidth=1
      for(let i=0;i<3;i++){c.beginPath();for(let j=0;j<26;j++){const x=65+i*16+Math.sin(j*.3-time*2+i)*3,y=g.mouth-j*1.4;if(!j)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke()}
    }
  },[v,sim])
  return <canvas ref={ref} className="reaction-canvas" aria-label="与物质量和时间同步的液体、气泡、沉淀动画"/>
}
