export type Phase = 's' | 'l' | 'g' | 'aq';
export type Category = '单质' | '氧化物' | '酸' | '碱' | '盐' | '有机物' | '催化剂' | '指示剂';
export interface Substance {
  id: string;
  name: string;
  formula: string;
  category: Category;
  phase: Phase;
  color: string;
  appearance: string;
  properties: string;
  safety: string;
  conditions: string;
  molarMass: number;
}
export type EquipmentKind =
  | 'beaker'
  | 'test-tube'
  | 'flask'
  | 'round-flask'
  | 'gas-jar'
  | 'burner'
  | 'dropper'
  | 'rod'
  | 'funnel'
  | 'tube'
  | 'trough'
  | 'stand'
  | 'cylinder'
  | 'thermometer'
  | 'dish'
  | 'crucible'
  | 'clamp'
  | 'stopper';
export interface Equipment {
  kind: EquipmentKind;
  name: string;
  capacity?: number;
  description: string;
}
export interface Material {
  id: string;
  phase: Phase;
  moles: number;
}
export interface ReactionTerm {
  id: string;
  coefficient: number;
  phase: Phase;
  air?: boolean;
}
export interface Reaction {
  id: string;
  name: string;
  reactants: ReactionTerm[];
  products: ReactionTerm[];
  type: string;
  minTemp?: number;
  ignition?: boolean;
  catalyst?: string;
  rate: number;
  effect: 'gas' | 'precipitate' | 'displacement' | 'neutralization' | 'combustion';
  phenomenon: string;
  principle: string;
  heat?: number;
  micro: string;
  ionic?: string;
}
export interface ReactionRecord {
  id: string;
  extent: number;
  rate: number;
  capacity: number;
}
export interface Vessel {
  uid: string;
  kind: EquipmentKind;
  x: number;
  y: number;
  contents: Material[];
  temperature: number;
  targetTemp: number;
  heating: boolean;
  ignited: boolean;
  stirred: boolean;
  sealed: boolean;
  records: Record<string, ReactionRecord>;
  airOxygen: number;
  airUsed: number;
  released: Record<string, number>;
  evaporated: number;
  dissolution: number;
  crystallized: number;
  secured?: boolean;
  measured?: boolean;
}
export interface Connection {
  from: string;
  to: string;
}
export interface LabState {
  vessels: Vessel[];
  connections: Connection[];
  time: number;
  visual?: { type: 'dose' | 'pour' | 'filter'; from?: string; to: string; id?: string; at: number };
}
export interface Dose {
  id: string;
  amount: number;
  concentration: number;
  phase: Phase;
}
export interface Experiment {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  difficulty: string;
  goal: string;
  steps: string[];
  explanation: string;
  equipment: EquipmentKind;
  doses: Dose[];
  reactionId?: string;
  temperature?: number;
  collection?: boolean;
}
