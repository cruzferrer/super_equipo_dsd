/**
 * index.ts — Punto de entrada público del módulo Editor EPiC Playground.
 *
 * Solo expone lo que otros componentes necesitan conocer.
 * Los detalles internos (acciones, adaptador, validador) NO forman parte
 * de la API pública del Editor hacia el resto del sistema.
 *
 * Uso externo esperado:
 *   import { EditorController, MockMotorClient } from "@epic/editor";
 *   const editor = new EditorController();
 */

// Controlador principal (punto de entrada operacional)
export { EditorController } from "./controllers/editorController";
export type { ControllerResult } from "./controllers/editorController";

// Tipos del contrato del Motor (compartidos con otros componentes)
export type {
  BelnapValue,
  MotorConnective,
  ElementoIn,
  ConjuntoIn,
  MotorInput,
  MotorOutput,
  Accion,
  EditorArc,
  EditorValidationError,
  ValidationResult,
  Posicion,
} from "./domain/editorTypes";

// Estado del Editor (para integración con stores/React)
export type { EditorState, EditorMode } from "./domain/editorState";
export { createInitialState } from "./domain/editorState";

// Cliente Mock (para pruebas de integración de otros componentes)
export { MockMotorClient, MotorApiClient, MotorApiError } from "./services/motorApiClient";
export type { IMotorClient } from "./services/motorApiClient";

// Adaptador (para uso directo si otro componente necesita el payload sin enviar)
export { toMotorInput } from "./adapters/editorToMotorInput";

// Validador (para validación independiente)
export { validarEstado, esBelnapValido, esConectivoValido } from "./validators/editorValidation";