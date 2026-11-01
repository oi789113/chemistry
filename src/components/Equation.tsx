import katex from 'katex'
import type { ReactionRule } from '../chemistry/types'
import 'katex/dist/katex.min.css'

const texFormula=(f:string)=>'\\mathrm{'+f.replace(/(\d+)/g,'_{$1}')+'}'
export function Equation({rule,ionic=false}:{rule?:ReactionRule;ionic?:boolean}){
  if(!rule)return <div className="equation-empty">等待形成反应体系</div>
  let latex:string
  if(ionic&&rule.ionic)latex=rule.ionic.replace(/([A-Z][a-z]?)/g,'\\mathrm{$1}')
  else{
    const side=(terms:typeof rule.reactants,products=false)=>terms.map(t=>(t.coefficient>1?t.coefficient:'')+texFormula(t.id)+(products&&t.phase==='g'?'\\uparrow':products&&t.phase==='s'&&rule.visual==='precipitate'?'\\downarrow':'')).join(' + ')
    const label=rule.id==='magnesium'?'\\text{点燃}':rule.catalyst?texFormula(rule.catalyst)+(rule.minTemperature?',\\Delta':''):rule.minTemperature?'\\Delta':''
    latex=side(rule.reactants)+' '+(label?'\\xrightarrow{'+label+'}':'\\longrightarrow')+' '+side(rule.products,true)
  }
  return <div className="equation" aria-label={ionic?'离子方程式':rule.equation} dangerouslySetInnerHTML={{__html:katex.renderToString(latex,{throwOnError:false,output:'htmlAndMathml',strict:false})}}/>
}
