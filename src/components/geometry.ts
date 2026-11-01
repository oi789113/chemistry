import type { InstrumentKind } from '../chemistry/types'
export interface GlassGeometry { outline:string; inner:string; top:number; bottom:number; mouth:number }
export function geometry(kind: InstrumentKind):GlassGeometry{
  switch(kind){
    case 'testTube':return {outline:'M57 22 L57 166 Q57 196 80 196 Q103 196 103 166 L103 22 Z',inner:'M62 25 L62 166 Q62 190 80 190 Q98 190 98 166 L98 25 Z',top:25,bottom:190,mouth:22}
    case 'flask':return {outline:'M63 28 L63 77 L25 167 Q18 187 39 190 L121 190 Q142 187 135 167 L97 77 L97 28 Z',inner:'M68 32 L68 78 L30 169 Q25 184 41 185 L119 185 Q135 184 130 169 L92 78 L92 32 Z',top:36,bottom:185,mouth:28}
    case 'roundFlask':return {outline:'M64 26 L64 79 A55 55 0 1 0 96 79 L96 26 Z',inner:'M69 31 L69 84 A50 50 0 1 0 91 84 L91 31 Z',top:32,bottom:186,mouth:26}
    case 'gasJar':return {outline:'M60 31 L60 49 L40 49 L38 181 Q38 190 50 190 L110 190 Q122 190 122 181 L120 49 L100 49 L100 31 Z',inner:'M65 36 L65 54 L45 54 L43 181 Q43 185 50 185 L110 185 Q117 185 117 181 L115 54 L95 54 L95 36 Z',top:54,bottom:185,mouth:31}
    case 'cylinder':return {outline:'M62 26 L62 172 L46 184 L46 191 L114 191 L114 184 L98 172 L98 26 Z',inner:'M67 30 L67 172 L93 172 L93 30 Z',top:32,bottom:172,mouth:26}
    case 'dish':return {outline:'M16 124 Q80 148 144 124 L126 165 Q80 190 34 165 Z',inner:'M22 129 Q80 148 138 129 L121 161 Q80 182 39 161 Z',top:128,bottom:174,mouth:124}
    case 'crucible':return {outline:'M34 92 Q80 104 126 92 L113 167 Q80 184 47 167 Z',inner:'M41 99 Q80 110 119 99 L107 163 Q80 176 53 163 Z',top:100,bottom:174,mouth:92}
    default:return {outline:'M33 49 L29 43 L43 43 L43 41 L125 41 L125 178 Q125 192 110 192 L48 192 Q33 192 33 178 Z',inner:'M39 49 L39 177 Q39 186 49 186 L109 186 Q119 186 119 177 L119 49 Z',top:49,bottom:186,mouth:43}
  }
}
