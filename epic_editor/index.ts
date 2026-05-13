/**
 * index.ts — Punto de entrada público del módulo Editor EPiC Playground.
 *
 * Este archivo expone únicamente lo que otros componentes necesitan usar
 * del Editor.
 *
 * Nuevo modelo del Editor:
 *   - variables
 *   - ocurrencias
 *   - pares
 *   - arcos
 *
 * El Editor ya no expone ElementoIn / ConjuntoIn como contrato principal,
 * porque el Motor ahora se adaptará al nuevo JSON de salida:
 *
 * {
 *   proyecto,
 *   version,
 *   estado_sistema,
 *   dominio_valores,
 *   dominio_compartido: {
 *     variables,
 *     ocurrencias,
 *     pares,
 *     arcos
 *   }
 * }
 */

// ─────────────────────────────────────────────
// Controlador principal
// ─────────────────────────────────────────────

export { EditorController } from "./controllers/editorController";
export type { ControllerResult } from "./controllers/editorController";

// ─────────────────────────────────────────────
// Tipos principales del nuevo contrato
// ─────────────────────────────────────────────

export type {
  BelnapValue,
  Evidencia,
  MotorConnective,
  EstadoSistema,
  AtributosVisualesBasicos,
  VariableLogica,
  OcurrenciaVisual,
  ParVisual,
  EditorArc,
  DominioCompartido,
  MotorInputV2,
  MotorOutput,
  EditorValidationError,
  ValidationResult,
} from "./domain/editorTypes";

// ─────────────────────────────────────────────
// Constantes y utilidades del dominio
// ─────────────────────────────────────────────

export {
  DOMINIO_VALORES,
  DEFAULT_CONNECTIVE,
  KNOWN_CONNECTIVES,
  evidenciasToBelnap,
} from "./domain/editorTypes";

// ─────────────────────────────────────────────
// Estado del Editor
// ─────────────────────────────────────────────

export type { EditorState, EditorMode } from "./domain/editorState";
export { createInitialState } from "./domain/editorState";

// ─────────────────────────────────────────────
// Cliente del Motor
// ─────────────────────────────────────────────

export {
  MockMotorClient,
  MotorApiClient,
  MotorApiError,
} from "./services/motorApiClient";

export type { IMotorClient } from "./services/motorApiClient";

// ─────────────────────────────────────────────
// Adaptador hacia el Motor
// ─────────────────────────────────────────────

export {
  toMotorInput,
  crearDominioCompartido,
} from "./adapters/editorToMotorInput";

// ─────────────────────────────────────────────
// Validador
// ─────────────────────────────────────────────

export {
  validarEstado,
  esBelnapValido,
  esEvidenciaValida,
  esConectivoValido,
} from "./validators/editorValidation";