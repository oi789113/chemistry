export type Phase = 's' | 'l' | 'g' | 'aq'
export type Category = 'element' | 'oxide' | 'acid' | 'base' | 'salt' | 'organic' | 'catalyst' | 'indicator'
export interface Substance {
  id: string; name: string; formula: string; category: Category
  phase: Phase; color: string; appearance: string; molarMass: number
  properties: string; conditions: string; safety: string; reactions: string[]
  soluble?: boolean; solutionColor?: string; atoms: Record<string, number>
}
export type InstrumentKind = 'testTube' | 'beaker' | 'flask' | 'roundFlask' | 'gasJar' | 'lamp' | 'dropper' | 'rod' | 'funnel' | 'tube' | 'trough' | 'stand' | 'cylinder' | 'thermometer' | 'dish' | 'crucible' | 'clamp' | 'stopper'
export interface InstrumentDefinition { id: InstrumentKind; name: string; capacity: number; description: string }
export interface Portion { id: string; phase: Phase; mmol: number }
export interface Vessel {
  id: string; kind: InstrumentKind; x: number; y: number
  contents: Portion[]; volumeMl: number; temperature: number
  heating: boolean; stirring: boolean; supported: boolean; stoppered: boolean
  targetTemperature: number; reacted: Record<string, number>; reactionStarted?: Record<string,number>; evaporatedMl: number
}
export interface Connection { from: string; to: string }
export interface ReactionRule {
  id: string; title: string; type: string
  reactants: { id: string; coefficient: number; phase: Phase }[]
  products: { id: string; coefficient: number; phase: Phase }[]
  catalyst?: string; minTemperature?: number; needsIgnition?: boolean
  baseRate: number; equation: string; ionic?: string
  conditions: string; principle: string; observation: string
  spectators: string[]; visual: 'gas' | 'precipitate' | 'displacement' | 'neutralization' | 'burning'
}
export interface ReactionActivity { vesselId: string; reactionId: string; extent: number; rate: number; progress: number }
export interface Simulation {
  time: number; vessels: Vessel[]; connections: Connection[]; environment: 'air' | 'closed'
  activities: ReactionActivity[]; escaped: Record<string, number>; supplied: Record<string, number>
  notices: string[]; events: { time: number; text: string }[]
}
export interface Lesson {
  id: string; title: string; subtitle: string; tag: string; color: string; icon: string
  reactionId?: string; apparatus: { kind: InstrumentKind; x: number; y: number }[]
  initial: { vessel: number; id: string; mmol: number; phase?: Phase; volumeMl?: number }[]
  steps: { text: string; action: string; label: string }[]
  explanation: string
}
