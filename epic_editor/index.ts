export { EditorController } from "./controllers/editorController";
export type { ControllerResult } from "./controllers/editorController";

export type {
  BelnapValue,
  MotorConnective,
  EditorMode,
  PlaygroundSnapshot,
  LogicVariable,
  LogicSet,
  LogicRelation,
  VisualInstance,
  ExecutionTrace,
  ExecutionAction,
  ValidationResult,
  EditorValidationError,
} from "./domain/editorTypes";

export { createInitialState } from "./domain/editorState";
export type { EditorState } from "./domain/editorState";

export {
  MotorApiClient,
  MockMotorClient,
  MotorApiError,
} from "./services/motorApiClient";
export type { IMotorClient } from "./services/motorApiClient";

export { validarSnapshot } from "./validators/editorValidation";
