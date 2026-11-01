import { useEffect, useRef } from 'react';
import { useLab } from '../store/lab';
import { amount } from '../chemistry/engine';
import { liquidY, paths } from './Instrument';
import { reactionById } from '../data/reactions';
import type { Vessel } from '../chemistry/types';
// Canvas receives the same vessel, clock, and recorded extents as the analysis panel.
const random=(seed:number)=>{const x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x);};
interface Bubble {born:number;seed:number}
interface Grain {born:number;seed:number;color:string;crystal:boolean;precipitate:boolean}
export function Particles({uid}:{uid:string}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=180*dpr;canvas.height=240*dpr;ctx.scale(dpr,dpr);
    let frame=0,lastCursor=-1,lastLabTime=-1,changedAt=0,bubbles:Bubble[]=[],grains:Grain[]=[];
    function prepare(v:Vessel) {
      const state=useLab.getState();const now=state.lab.time;
      const recent=state.history.slice(Math.max(0,state.cursor-105),state.cursor+1);
      bubbles=[];grains=[];
      for(let k=1;k<recent.length;k++) {
        const next=recent[k],prev=recent[k-1];if(now-next.lab.time>3.6)continue;
        const a=prev.lab.vessels.find(v=>v.uid===uid),b=next.lab.vessels.find(v=>v.uid===uid);if(!a||!b)continue;
        for(const r of Object.values(b.records)) {
          const rule=reactionById[r.id];if(rule.effect!=='gas')continue;
          const gasFactor=rule.products.filter(t=>t.phase==='g').reduce((n,t)=>n+t.coefficient,0)*35000;
          const before=Math.floor((a.records[r.id]?.extent??0)*gasFactor),after=Math.floor(r.extent*gasFactor);
          for(let j=before;j<Math.min(after,before+30);j++)bubbles.push({born:next.lab.time,seed:j+rule.id.length*19});
        }
      }
      for(const m of v.contents.filter(m=>m.phase==='s'&&m.moles>1e-8)) {
        const precipitate=['cuoh2','agcl','baso4','feoh3','mgo'].includes(m.id)||m.id==='caco3'&&Boolean(v.records.limewater);
        const crystal=m.id==='nacl'&&v.crystallized>0;
        if(!precipitate&&!crystal)continue;
        const count=Math.min(125,Math.ceil(m.moles*16000));
        for(let i=0;i<count;i++){
          const threshold=(i+.3)/16000;
          const birth=recent.find(s=>{const vessel=s.lab.vessels.find(v=>v.uid===uid);return vessel&&amount(vessel,m.id,'s')>=threshold;})?.lab.time??now-10;
          grains.push({born:birth,seed:i+17*m.id.length,color:m.id==='cuoh2'?'#438ec9':m.id==='feoh3'?'#a86843':m.id==='mgo'?'#ece8d4':'#e0e4dc',crystal,precipitate});
        }
      }
    }
    const draw=(wall:number)=>{
      const state=useLab.getState(),v=state.lab.vessels.find(v=>v.uid===uid);
      if(!v){frame=requestAnimationFrame(draw);return;}
      if(state.cursor!==lastCursor){if(state.lab.time!==lastLabTime)changedAt=wall;lastLabTime=state.lab.time;lastCursor=state.cursor;prepare(v);}
      const advance=state.running?Math.min(.095,(wall-changedAt)/1000*state.speed):0;
      const time=state.lab.time+advance,y=liquidY(v);
      ctx.clearRect(0,0,180,240);ctx.save();
      const path=paths[v.kind];if(path)ctx.clip(new Path2D(path));
      for(const b of bubbles){const age=time-b.born;if(age<0||age>3.5)continue;const x=60+random(b.seed)*60+Math.sin(age*3+b.seed)*5,by=200-age*(42+random(b.seed+1)*20);if(by<Math.min(y,190)-2)continue;
        const radius=1.8+random(b.seed+2)*3+age*.35;
        ctx.beginPath();ctx.arc(x,by,radius,0,Math.PI*2);ctx.fillStyle='rgba(241,255,255,.30)';ctx.fill();ctx.strokeStyle=`rgba(236,255,255,${.8-age*.13})`;ctx.lineWidth=.9;ctx.stroke();
        ctx.beginPath();ctx.arc(x-1,by-1,radius*.35,Math.PI,Math.PI*1.6);ctx.strokeStyle='#ffffffd9';ctx.stroke();
      }
      for(const g of grains){const age=Math.max(0,time-g.born);let x=42+random(g.seed)*99,gy:number;
        if(g.crystal){gy=202-random(g.seed+3)*10;}else {const start=Math.max(y+15,145)+random(g.seed+4)*30;gy=Math.min(206-random(g.seed+6)*12,start+age*(5+random(g.seed+8)*9));x+=Math.sin(age*.9+g.seed)*Math.max(0,5-age);}
        const size=g.crystal?2+Math.min(3,age*.1):1.3+Math.min(2,age*.2);
        ctx.fillStyle=g.color;ctx.globalAlpha=.55+Math.min(.4,age*.2);ctx.beginPath();
        if(g.crystal){ctx.moveTo(x,gy-size);ctx.lineTo(x+size,gy);ctx.lineTo(x,gy+size);ctx.lineTo(x-size,gy);ctx.closePath();}else ctx.arc(x,gy,size,0,Math.PI*2);
        ctx.fill();ctx.globalAlpha=1;
      }
      if(v.stirred&&state.running&&y<206){ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(90,180+i*8,28+Math.sin(time*2+i)*7,3,0,0,Math.PI*1.6);ctx.stroke();}}
      ctx.restore();frame=requestAnimationFrame(draw);
    };frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[uid]);
  return <canvas ref={ref} className="particle-canvas" aria-hidden="true"/>;
}
