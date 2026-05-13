/**
 * editorState.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Estado interno del Editor EPiC Playground.
 *
 * Este módulo define la forma del estado editable que el Editor mantiene
 * en memoria.
 *
 * Cambio principal del modelo:
 *
 *   Antes:
 *     - elementos
 *     - conjuntos
 *     - arcos
 *
 *   Ahora:
 *     - variables
 *     - ocurrencias
 *     - pares
 *     - arcos
 *
 * Motivo:
 *   El profesor pidió que una misma variable pueda aparecer varias veces
 *   en diferentes cajas/pares y que todas las apariciones con el mismo
 *   nombre compartan las mismas bolitas/evidencias.
 *
 * Por eso el estado separa:
 *
 *   VariableLogica:
 *     La variable real, por ejemplo "p".
 *
 *   OcurrenciaVisual:
 *     Una aparición visual de esa variable, por ejemplo "occ_1".
 *
 *   ParVisual:
 *     Una caja/par donde aparecen ocurrencias.
 *
 *   EditorArc:
 *     Una relación dirigida entre ocurrencias y variables.
 *
 * Este módulo NO calcula propagaciones.
 * Este módulo NO renderiza en canvas/SVG/D3.
 * Este módulo NO interpreta el resultado final del Motor.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type {
  VariableLogica,
  OcurrenciaVisual,
  ParVisual,
  EditorArc,
  MotorOutput,
  MotorConnective,
} from "./editorTypes";

// ─────────────────────────────────────────────
// Modo del Editor
// ─────────────────────────────────────────────

/**
 * El Editor puede estar en dos modos:
 *
 *   "edicion":
 *     El usuario puede crear, modificar o eliminar entidades.
 *
 *   "ejecucion":
 *     El dominio ya fue enviado, o está listo para enviarse, al Motor.
 *
 * El Editor coordina el paso entre edición y ejecución, pero no calcula.
 */
export type EditorMode = "edicion" | "ejecucion";

// ─────────────────────────────────────────────
// Estado completo del Editor
// ─────────────────────────────────────────────

/**
 * EditorState
 * ─────────────────────────────────────────────
 * Fuente de verdad del módulo Editor.
 *
 * Contiene el estado editable antes de generar el JSON final para el Motor.
 *
 * variables:
 *   Diccionario de variables lógicas reales.
 *   Ejemplo:
 *     variables["p"] = variable lógica p.
 *
 * ocurrencias:
 *   Diccionario de apariciones visuales.
 *   Ejemplo:
 *     ocurrencias["occ_1"] representa a la variable "p".
 *
 * pares:
 *   Diccionario de cajas/pares.
 *   Ejemplo:
 *     pares["par_1"] contiene ["occ_1", "occ_2"].
 *
 * arcos:
 *   Diccionario de relaciones dirigidas.
 *   Ejemplo:
 *     arcos["a1"] conecta occ_1 → occ_2.
 *
 * modo:
 *   Estado operativo del Editor.
 *
 * motorOutput:
 *   Última respuesta del Motor.
 *
 * conectivosDisponibles:
 *   Lista de conectivos que puede usar el Editor.
 *
 * maxIteraciones:
 *   Se conserva como configuración útil, aunque el nuevo contrato del Editor
 *   ya no lo coloca en la raíz del JSON. Si el Motor nuevo lo necesita, se
 *   puede agregar después en una sección de configuración.
 */
export interface EditorState {
  variables: Record<string, VariableLogica>;
  ocurrencias: Record<string, OcurrenciaVisual>;
  pares: Record<string, ParVisual>;
  arcos: Record<string, EditorArc>;

  modo: EditorMode;
  motorOutput: MotorOutput | null;

  conectivosDisponibles: MotorConnective[];

  /**
   * Configuración opcional conservada para compatibilidad conceptual.
   * Si el equipo del Motor decide usarla, se puede incluir después en
   * MotorInputV2.configuracion.
   */
  maxIteraciones: number;
}

// ─────────────────────────────────────────────
// Estado inicial
// ─────────────────────────────────────────────

/**
 * createInitialState
 * ─────────────────────────────────────────────
 * Crea el estado inicial vacío del Editor.
 *
 * Al inicio no hay variables, ocurrencias, pares ni arcos.
 * El Editor inicia en modo "edicion".
 */
export function createInitialState(): EditorState {
  return {
    variables: {},
    ocurrencias: {},
    pares: {},
    arcos: {},

    modo: "edicion",
    motorOutput: null,

    conectivosDisponibles: [
      "AND",
      "OR",
      "IMPLIES",
      "BICONDITIONAL",
      "PROPAGATION",
      "CONTRAPOSITIONAL",
      "KJOIN",
    ],

    maxIteraciones: 100,
  };
}