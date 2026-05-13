export type BelnapValue = "V" | "F" | "N" | "B";

export type MotorConnective = string;

export type EditorMode = "edicion" | "ejecucion";

export interface PlaygroundMeta {
  schema_version: string;
  editor_mode: EditorMode;
  belnap_domain: BelnapValue[];
  max_iterations: number;
}

export interface LogicVariable {
  id: string;
  truth_value: BelnapValue;
  memberships: string[];
}

export interface LogicSet {
  id: string;
  connective: MotorConnective;
  subsets: string[];
  result_alias: string | null;
}

export interface LogicRelation {
  id: string;
  from_variable: string;
  to_variable: string;
  connective: MotorConnective;
}

export interface LogicGraph {
  variables: LogicVariable[];
  sets: LogicSet[];
  relations: LogicRelation[];
}

export interface VisualInstance {
  id: string;
  variable_id: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

export interface VisualSet {
  x: number;
  y: number;
  radius: number;
  shape: string;
  [key: string]: unknown;
}

export interface VisualRelation {
  color: string;
  thickness: number;
  [key: string]: unknown;
}

export interface VisualLayer {
  instances: Record<string, VisualInstance>;
  sets: Record<string, VisualSet>;
  relations: Record<string, VisualRelation>;
}

export interface ExecutionAction {
  step: number;
  action_type: string;
  target_id: string;
  result_value: string;
  description: string;
}

export interface ExecutionTrace {
  iterations: number;
  stabilized: boolean;
  actions: ExecutionAction[];
  final_logic: LogicGraph;
}

export interface PlaygroundSnapshot {
  meta: PlaygroundMeta;
  logic: LogicGraph;
  visual: VisualLayer;
  execution_trace?: ExecutionTrace;
}

export interface EditorValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  entityId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: EditorValidationError[];
}
