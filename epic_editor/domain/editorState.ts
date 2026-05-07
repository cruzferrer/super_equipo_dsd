/**
 * editorState.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Estado interno del Editor EPiC Playground.
 *
 * Este módulo define la forma del estado que el Editor mantiene en memoria.
 * No es el MotorInput; es la representación de trabajo del Editor.
 *
 * Responsabilidad:
 *   Mantener la estructura editable de elementos, conjuntos y arcos
 *   internos, junto con el modo actual (edición / ejecución).
 *
 * Lo que este módulo NO hace:
 *   - No calcula propagaciones.
 *   - No renderiza en canvas/SVG/D3.
 *   - No aplica conectivos lógicos.
 *   - No estabiliza el sistema.
 *
 * Relación con el Motor:
 *   El EditorState se convierte en MotorInput mediante el adaptador
 *   editorToMotorInput.ts antes de enviarlo a POST /calcular.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type {
  ElementoIn,
  ConjuntoIn,
  EditorArc,
  MotorOutput,
} from "./editorTypes";

// ─────────────────────────────────────────────
// Modo del Editor
// ─────────────────────────────────────────────

/**
 * El Editor puede estar en dos modos:
 *   "edicion"  → el usuario puede crear/modificar/eliminar entidades.
 *   "ejecucion" → el sistema envió el payload al Motor y espera o ya recibió resultado.
 *
 * La transición entre modos es responsabilidad del EditorController.
 * El Simulador consume el resultado una vez que el Motor ha estabilizado.
 */
export type EditorMode = "edicion" | "ejecucion";

// ─────────────────────────────────────────────
// Estado completo del Editor
// ─────────────────────────────────────────────

/**
 * EditorState — fuente de verdad del módulo Editor.
 *
 * Contiene:
 *   - elementos: nodos/proposiciones que el usuario ha creado.
 *   - conjuntos: agrupaciones/contextos de propagación.
 *   - arcos: relaciones dirigidas internas (opcionales; no se envían al Motor directamente).
 *   - modo: estado operacional actual del Editor.
 *   - motorOutput: última respuesta del Motor (null si no se ha ejecutado).
 *   - conectivosDisponibles: lista cargada desde GET /conectivos.
 *   - maxIteraciones: configuración que se pasa al Motor.
 */
export interface EditorState {
  elementos: Record<string, ElementoIn>;   // Indexado por id para O(1)
  conjuntos: Record<string, ConjuntoIn>;   // Indexado por id para O(1)
  /**
   * Arcos dirigidos internos.
   * Son opcionales: si el equipo decide no usarlos, este campo
   * puede vaciarse sin afectar la compatibilidad con el Motor.
   * El adaptador editorToMotorInput.ts es el único que los lee
   * para traducirlos a ConjuntoIn si es necesario.
   */
  arcos: Record<string, EditorArc>;
  modo: EditorMode;
  motorOutput: MotorOutput | null;
  conectivosDisponibles: string[];
  maxIteraciones: number;
}

// ─────────────────────────────────────────────
// Estado inicial
// ─────────────────────────────────────────────

/**
 * Estado inicial vacío del Editor.
 * Se usa al instanciar el módulo por primera vez.
 */
export function createInitialState(): EditorState {
  return {
    elementos: {},
    conjuntos: {},
    arcos: {},
    modo: "edicion",
    motorOutput: null,
    // Fallback estático; se sobreescribe al cargar desde GET /conectivos
    conectivosDisponibles: [
      "AND", "OR", "IMPLIES", "BICONDITIONAL",
      "PROPAGATION", "CONTRAPOSITIONAL", "KJOIN",
    ],
    maxIteraciones: 100,
  };
}