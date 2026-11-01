import { useEffect,useId,useRef,type ReactNode } from 'react'
import { X } from 'lucide-react'
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}){
  const ref=useRef<HTMLDivElement>(null),titleId=useId()
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const el=ref.current!;el.focus();const old=document.body.style.overflow;document.body.style.overflow='hidden'
    const handler=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){onClose();return}
      if(e.key!=='Tab')return
      const items=Array.from(el.querySelectorAll<HTMLElement>('button,input,select,a[href],textarea,[tabindex="0"]')).filter(x=>!x.hasAttribute('disabled'))
      const first=items[0],last=items.at(-1)
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===el)){e.preventDefault();last?.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    }
    el.addEventListener('keydown',handler);return()=>{document.body.style.overflow=old;el.removeEventListener('keydown',handler);previous?.focus()}
  },[onClose])
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className={'modal'+(wide?' modal-wide':'')} ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><div className="modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭对话框"><X size={20}/></button></div>{children}</div></div>
}
