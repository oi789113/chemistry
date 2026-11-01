import { useEffect,useRef } from 'react';
import { ArrowRight, Atom, X } from 'lucide-react';
import { useLab } from '../store/lab';
import { atoms,prettyFormula } from '../chemistry/formula';
import { matches,progress } from '../chemistry/engine';
import { substanceById as db } from '../data/substances';
const elementColor:Record<string,string>={H:'#e2e8ec',O:'#e67c71',Cu:'#bc855c',Na:'#a88aca',Cl:'#73b99a',C:'#657785',Mn:'#a998bd',K:'#b49ac9',Fe:'#a38466',Mg:'#8db6c2',Zn:'#92acb2',S:'#d9bb55',Ca:'#94cba8'};
export function Microscope(){
  const ref=useRef<HTMLCanvasElement>(null);const v=useLab(s=>s.lab.vessels.find(v=>v.uid===s.selected));const set=useLab(s=>s.setMicroscopic);
  const reaction=v?matches(v)[0]:undefined;
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;const c=canvas.getContext('2d');if(!c)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=820*dpr;canvas.height=350*dpr;c.scale(dpr,dpr);
    let frame=0;
    function molecule(id:string,x:number,y:number,scale=1,opacity=1){
      const formula=db[id].formula;const parts=Object.entries(atoms(formula)).flatMap(([a,n])=>Array.from({length:Math.min(n,4)},()=>a)).slice(0,8);
      c!.globalAlpha=opacity;
      const points=parts.map((a,i)=>({a,x:x+(i-(parts.length-1)/2)*19*scale,y:y+Math.sin(i*2.3)*10*scale}));
      c!.strokeStyle='#9eb9bd';c!.lineWidth=3*scale;
      points.forEach((p,i)=>{if(i){c!.beginPath();c!.moveTo(points[i-1].x,points[i-1].y);c!.lineTo(p.x,p.y);c!.stroke();}});
      for(const p of points){const r=(p.a==='H'?9:13)*scale;const gradient=c!.createRadialGradient(p.x-r*.3,p.y-r*.4,0,p.x,p.y,r);gradient.addColorStop(0,'#fff');gradient.addColorStop(.3,elementColor[p.a]??'#92b6c2');gradient.addColorStop(1,elementColor[p.a]??'#92b6c2');c!.fillStyle=gradient;c!.beginPath();c!.arc(p.x,p.y,r,0,Math.PI*2);c!.fill();c!.fillStyle=p.a==='H'?'#617480':'#fff';c!.font=`600 ${11*scale}px sans-serif`;c!.textAlign='center';c!.textBaseline='middle';c!.fillText(p.a,p.x,p.y);}
      c!.globalAlpha=1;c!.fillStyle='#627a7e';c!.font='12px sans-serif';c!.textAlign='center';c!.fillText(prettyFormula(formula),x,y+32*scale);
    }
    const draw=()=>{const s=useLab.getState(),v=s.lab.vessels.find(v=>v.uid===s.selected);const r=v?matches(v)[0]:undefined;const t=s.lab.time;const p=v?progress(v):0;
      c.clearRect(0,0,820,350);c.strokeStyle='#e7eeec';c.setLineDash([4,6]);c.beginPath();c.moveTo(410,20);c.lineTo(410,300);c.stroke();c.setLineDash([]);
      if(r){
        const render=(side:typeof r.reactants,offset:number,product:boolean)=>{let index=0;const total=side.reduce((n,m)=>n+Math.min(3,m.coefficient),0);side.forEach(term=>{for(let j=0;j<Math.min(3,term.coefficient);j++){const i=index++;const x=offset+105+(i%2)*160+Math.sin(t*.9+i)*10,y=80+Math.floor(i/2)*(total>4?75:110)+Math.cos(t*.7+i)*10;molecule(term.id,x,y,.85,product?.2+.8*p:1-.6*p);}});};
        render(r.reactants,0,false);render(r.products,420,true);
        if(r.catalyst&&v&&v.contents.some(m=>m.id===r.catalyst)){c.fillStyle='#ecf3ef';c.fillRect(240,292,340,42);c.fillStyle='#44796d';c.font='12px sans-serif';c.textAlign='center';c.fillText('MnO₂ · 降低活化能 · 反应前后保留',410,314);}
      }else if(v){v.contents.filter(m=>m.moles>1e-8).slice(0,6).forEach((m,i)=>molecule(m.id,140+(i%3)*250,90+Math.floor(i/3)*130));}
      frame=requestAnimationFrame(draw);
    };frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[]);
  return <div className="micro-panel"><div className="micro-header"><span><Atom size={17}/>微观反应视角 <small>粒子与化学键教学示意 · 非比例</small></span><button className="icon-button" onClick={()=>set(false)} aria-label="关闭微观模式"><X size={18}/></button></div>
    <div className="micro-labels"><span>反应物 · 键的重组</span><ArrowRight size={17}/><span>生成物 · 新的结构</span></div>
    <canvas ref={ref} className="micro-canvas" aria-label="动态原子、分子与离子教学示意"/>
    <div className="micro-note">{reaction?.ionic&&<strong>{reaction.ionic}</strong>}<p>{reaction?.micro??'加入支持的反应物后，可以观察配平式量单位与原子重组。'}</p></div>
  </div>;
}
