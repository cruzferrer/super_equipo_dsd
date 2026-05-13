/**
 * editorToMotorInput.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Adaptador del Editor hacia el nuevo contrato de entrada del Motor.
 *
 * Este archivo convierte el EditorState interno en el JSON completo que
 * recibirá el Motor.
 *
 * Importante:
 *   Aunque el archivo conserva el nombre "editorToMotorInput.ts", ya no
 *   genera el contrato viejo:
 *
 *     {
 *       elementos: [],
 *       conjuntos: [],
 *       max_iteraciones: 100
 *     }
 *
 *   Ahora genera MotorInputV2:
 *
 *     {
 *       proyecto: "EPIC Playground PoC",
 *       version: "2.0",
 *       estado_sistema: "edicion" | "ejecucion",
 *       dominio_valores: ["V", "F", "N", "B"],
 *       dominio_compartido: {
 *         variables: [],
 *         ocurrencias: [],
 *         pares: [],
 *         arcos: []
 *       }
 *     }
 *
 * Responsabilidad:
 *   - Ordenar y empaquetar el estado interno del Editor.
 *   - No calcular propagaciones.
 *   - No interpretar resultados.
 *   - No renderizar.
 *
 * Regla central del nuevo modelo:
 *   Las variables guardan el valor lógico y las evidencias.
 *   Las ocurrencias solo indican dónde aparece visualmente cada variable.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { EditorState } from "../domain/editorState";
import type {
  DominioCompartido,
  MotorInputV2,
  VariableLogica,
  OcurrenciaVisual,
  ParVisual,
  EditorArc,
} from "../domain/editorTypes";
import { DOMINIO_VALORES } from "../domain/editorTypes";

/**
 * ordenarPorId
 * ─────────────────────────────────────────────
 * Convierte un Record indexado por id en un arreglo ordenado por id.
 *
 * Esto hace que la salida JSON sea estable y predecible.
 * Ayuda en pruebas, depuración y comparación de cambios.
 */
function ordenarPorId<T extends { id: string }>(record: Record<string, T>): T[] {
  return Object.values(record).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * crearDominioCompartido
 * ─────────────────────────────────────────────
 * Extrae del EditorState las entidades que forman el dominio compartido.
 *
 * No transforma valores lógicos.
 * No recalcula evidencias.
 * No valida.
 *
 * La validación debe hacerse antes con editorValidation.ts.
 */
export function crearDominioCompartido(state: EditorState): DominioCompartido {
  const variables: VariableLogica[] = ordenarPorId(state.variables);
  const ocurrencias: OcurrenciaVisual[] = ordenarPorId(state.ocurrencias);
  const pares: ParVisual[] = ordenarPorId(state.pares);
  const arcos: EditorArc[] = ordenarPorId(state.arcos);

  return {
    variables,
    ocurrencias,
    pares,
    arcos,
  };
}

/**
 * toMotorInput
 * ─────────────────────────────────────────────
 * Genera el nuevo JSON completo de salida del Editor hacia el Motor.
 *
 * Se conserva el nombre `toMotorInput` porque conceptualmente sigue siendo
 * la entrada que recibirá el Motor, aunque el contrato cambió a V2.
 */
export function toMotorInput(state: EditorState): MotorInputV2 {
  return {
    proyecto: "EPIC Playground PoC",
    version: "2.0",
    estado_sistema: state.modo,
    dominio_valores: DOMINIO_VALORES,
    dominio_compartido: crearDominioCompartido(state),
  };
}