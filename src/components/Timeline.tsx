import { Pause,Play,RotateCcw,SkipBack,SkipForward,Clock3 } from 'lucide-react';
import { useLab } from '../store/lab';
export function Timeline(){
  const running=useLab(s=>s.running),speed=useLab(s=>s.speed),cursor=useLab(s=>s.cursor),history=useLab(s=>s.history),time=useLab(s=>s.lab.time),id=useLab(s=>s.experimentId),mode=useLab(s=>s.mode);
  const duration=history[history.length-1].lab.time;
  const reset=()=>{if(mode==='guided')useLab.getState().loadExperiment(id);else useLab.getState().newFree();};
  return <section className="timeline panel"><div className="playback-buttons"><button className="icon-button" title="回到开始" aria-label="回到开始" onClick={()=>useLab.getState().seek(0)}><SkipBack size={18}/></button><button className="play-button" aria-label={running?'暂停实验':'开始实验'} onClick={()=>useLab.getState().setRunning(!running)}>{running?<Pause size={20} fill="currentColor"/>:<Play size={20} fill="currentColor"/>}</button><button className="icon-button" title="跳至最新" aria-label="跳至最新" onClick={()=>useLab.getState().seek(history.length-1)}><SkipForward size={18}/></button><span className="playback-divider"/><button className="icon-button" title="重置实验" aria-label="重置实验" onClick={reset}><RotateCcw size={17}/></button></div>
    <div className="timeline-slider"><div className="timeline-labels"><span className={cursor===0?'current':''}>反应前</span><span className={cursor>0&&cursor<history.length-1?'current':''}>反应中</span><span className={cursor>0&&cursor===history.length-1?'current':''}>当前状态</span></div><input aria-label="反应时间轴" type="range" min="0" max={Math.max(1,history.length-1)} value={cursor} onChange={e=>useLab.getState().seek(Number(e.target.value))}/><div className="timeline-time"><span><Clock3 size={11}/>{time.toFixed(1)} s / {duration.toFixed(1)} s</span><span>{cursor<history.length-1?'历史回放 · 修改条件将从此刻继续':'状态时间轴 · 可拖动回看'}</span></div></div>
    <div className="speed-control"><span>播放速度</span><div>{[.25,.5,1,2,4].map(s=><button key={s} className={speed===s?'active':''} onClick={()=>useLab.getState().setSpeed(s)}>{s}×</button>)}</div></div>
  </section>;
}
