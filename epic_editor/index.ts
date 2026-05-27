/*
Creacion de todo el archivo indexs.ts utilizando Gemini, prompt utilizado:
Con el anterior contexto de la conversacion y tomando en cuenta los cambios utilizados por el profesor,
realiza el index.ts, Actualizar las exportaciones quitando lo viejo y exponiendo el nuevo Snapshot.
*/

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
