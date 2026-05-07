/**
 * editorValidation.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Validaciones estructurales del Editor EPiC Playground.
 *
 * Responsabilidad ÚNICA (SRP):
 *   Verificar que el EditorState es estructuralmente correcto antes de
 *   generar un MotorInput. No calcula nada, no renderiza nada.
 *
 * Qué valida:
 *   1. IDs únicos de elementos y conjuntos.
 *   2. Valores de verdad Belnap válidos ("V" | "F" | "N" | "B").
 *   3. Conectivos válidos reconocidos por el Motor.
 *   4. Pertenencias que apuntan a conjuntos existentes.
 *   5. Subconjuntos que apuntan a conjuntos existentes.
 *   6. Ausencia de ciclos en jerarquías de subconjuntos.
 *   7. Formato válido de es_resultado_de.
 *   8. max_iteraciones entre 1 y 500.
 *   9. Referencias rotas tras eliminar entidades.
 *  10. Arcos internos con origen/destino válidos (si existen).
 *  11. Conectivos de arcos internos válidos.
 *
 * Qué NO valida:
 *   - Propagaciones lógicas (responsabilidad del Motor).
 *   - Semántica del resultado (responsabilidad del Simulador).
 *   - Consistencia de renderizado (responsabilidad del Visualizador).
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { EditorState } from "../domain/editorState";
import type {
  EditorValidationError,
  ValidationResult,
  BelnapValue,
} from "../domain/editorTypes";
import { KNOWN_CONNECTIVES } from "../domain/editorTypes";

// ─────────────────────────────────────────────
// Constantes de validación
// ─────────────────────────────────────────────

const VALID_BELNAP: ReadonlySet<BelnapValue> = new Set(["V", "F", "N", "B"]);
const MAX_ITERACIONES_LIMIT = { min: 1, max: 500 };

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

function err(
  field: string,
  message: string,
  entityId?: string,
): EditorValidationError {
  return { field, message, severity: "error", entityId };
}

function warn(
  field: string,
  message: string,
  entityId?: string,
): EditorValidationError {
  return { field, message, severity: "warning", entityId };
}

/**
 * Detecta ciclos en la jerarquía de subconjuntos mediante DFS.
 * Retorna true si existe un ciclo a partir del nodo dado.
 */
function hasCycle(
  start: string,
  subconjuntosMap: Record<string, string[]>,
  visited: Set<string> = new Set(),
  path: Set<string> = new Set(),
): boolean {
  if (path.has(start)) return true;
  if (visited.has(start)) return false;

  visited.add(start);
  path.add(start);

  for (const sub of subconjuntosMap[start] ?? []) {
    if (hasCycle(sub, subconjuntosMap, visited, new Set(path))) return true;
  }

  return false;
}

// ─────────────────────────────────────────────
// Validaciones individuales
// ─────────────────────────────────────────────

/** Valida que no haya IDs duplicados en elementos */
function validarIdsElementos(state: EditorState): EditorValidationError[] {
  // Como el estado usa Record<id, Elemento>, los IDs son únicos por construcción.
  // Esta validación es relevante si se recibe un array externo.
  return [];
}

/** Valida que no haya IDs duplicados en conjuntos */
function validarIdsConjuntos(state: EditorState): EditorValidationError[] {
  return [];
}

/** Valida valores de verdad de todos los elementos */
function validarValoresBelnap(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  for (const [id, el] of Object.entries(state.elementos)) {
    if (!VALID_BELNAP.has(el.valor_verdad as BelnapValue)) {
      errores.push(
        err(
          `elementos[${id}].valor_verdad`,
          `Valor "${el.valor_verdad}" no es válido. Use: V, F, N, B.`,
          id,
        ),
      );
    }
  }
  return errores;
}

/** Valida conectivos de todos los conjuntos contra la lista conocida */
function validarConectivos(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  const disponibles = new Set([
    ...KNOWN_CONNECTIVES,
    ...state.conectivosDisponibles,
  ]);

  for (const [id, conj] of Object.entries(state.conjuntos)) {
    if (!disponibles.has(conj.conectivo as any)) {
      errores.push(
        err(
          `conjuntos[${id}].conectivo`,
          `Conectivo "${conj.conectivo}" no reconocido. Disponibles: ${[...disponibles].join(", ")}.`,
          id,
        ),
      );
    }
  }
  return errores;
}

/** Valida que cada elemento pertenezca solo a conjuntos existentes */
function validarPertenencias(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  const conjuntoIds = new Set(Object.keys(state.conjuntos));

  for (const [eid, el] of Object.entries(state.elementos)) {
    el.pertenencia.forEach((cid, idx) => {
      if (!conjuntoIds.has(cid)) {
        errores.push(
          err(
            `elementos[${eid}].pertenencia[${idx}]`,
            `El conjunto "${cid}" no existe en el estado del Editor.`,
            eid,
          ),
        );
      }
    });
  }
  return errores;
}

/** Valida que cada conjunto referencie subconjuntos existentes */
function validarSubconjuntos(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  const conjuntoIds = new Set(Object.keys(state.conjuntos));

  for (const [cid, conj] of Object.entries(state.conjuntos)) {
    conj.subconjuntos.forEach((sid, idx) => {
      if (!conjuntoIds.has(sid)) {
        errores.push(
          err(
            `conjuntos[${cid}].subconjuntos[${idx}]`,
            `El subconjunto "${sid}" no existe en el estado del Editor.`,
            cid,
          ),
        );
      }
    });
  }
  return errores;
}

/** Detecta ciclos en la jerarquía de subconjuntos */
function validarCiclosSubconjuntos(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  const subMap = Object.fromEntries(
    Object.entries(state.conjuntos).map(([id, c]) => [id, c.subconjuntos]),
  );

  for (const id of Object.keys(state.conjuntos)) {
    if (hasCycle(id, subMap)) {
      errores.push(
        err(
          `conjuntos[${id}].subconjuntos`,
          `Ciclo detectado en la jerarquía de subconjuntos a partir de "${id}".`,
          id,
        ),
      );
    }
  }
  return errores;
}

/** Valida formato de es_resultado_de (debe ser string no vacío o null) */
function validarEsResultadoDe(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  for (const [id, conj] of Object.entries(state.conjuntos)) {
    if (conj.es_resultado_de !== null && conj.es_resultado_de.trim() === "") {
      errores.push(
        err(
          `conjuntos[${id}].es_resultado_de`,
          `"es_resultado_de" no puede ser una cadena vacía. Use null si no aplica.`,
          id,
        ),
      );
    }
  }
  return errores;
}

/** Valida que maxIteraciones esté en el rango permitido */
function validarMaxIteraciones(state: EditorState): EditorValidationError[] {
  const { min, max } = MAX_ITERACIONES_LIMIT;
  if (state.maxIteraciones < min || state.maxIteraciones > max) {
    return [
      err(
        "maxIteraciones",
        `max_iteraciones debe estar entre ${min} y ${max}. Actual: ${state.maxIteraciones}.`,
      ),
    ];
  }
  return [];
}

/** Valida arcos internos (si existen): origen, destino y conectivo */
function validarArcosInternos(state: EditorState): EditorValidationError[] {
  const errores: EditorValidationError[] = [];
  const elementoIds = new Set(Object.keys(state.elementos));
  const disponibles = new Set([
    ...KNOWN_CONNECTIVES,
    ...state.conectivosDisponibles,
  ]);

  for (const [aid, arc] of Object.entries(state.arcos)) {
    if (!elementoIds.has(arc.origen)) {
      errores.push(
        err(
          `arcos[${aid}].origen`,
          `El elemento origen "${arc.origen}" no existe.`,
          aid,
        ),
      );
    }
    if (!elementoIds.has(arc.destino)) {
      errores.push(
        err(
          `arcos[${aid}].destino`,
          `El elemento destino "${arc.destino}" no existe.`,
          aid,
        ),
      );
    }
    if (!disponibles.has(arc.conectivo as any)) {
      errores.push(
        err(
          `arcos[${aid}].conectivo`,
          `Conectivo "${arc.conectivo}" del arco no reconocido.`,
          aid,
        ),
      );
    }
  }
  return errores;
}

// ─────────────────────────────────────────────
// Función principal de validación
// ─────────────────────────────────────────────

/**
 * Ejecuta todas las validaciones sobre el EditorState.
 * Retorna ValidationResult con la lista de errores.
 *
 * Debe llamarse ANTES de:
 *   - generar MotorInput (adaptador)
 *   - enviar al Motor (cliente API)
 *   - cambiar a modo "ejecucion"
 */
export function validarEstado(state: EditorState): ValidationResult {
  const errores: EditorValidationError[] = [
    ...validarIdsElementos(state),
    ...validarIdsConjuntos(state),
    ...validarValoresBelnap(state),
    ...validarConectivos(state),
    ...validarPertenencias(state),
    ...validarSubconjuntos(state),
    ...validarCiclosSubconjuntos(state),
    ...validarEsResultadoDe(state),
    ...validarMaxIteraciones(state),
    ...validarArcosInternos(state),
  ];

  return {
    valid: errores.filter((e) => e.severity === "error").length === 0,
    errors: errores,
  };
}

/**
 * Valida un único valor de verdad Belnap.
 * Útil para validación inline al editar un elemento.
 */
export function esBelnapValido(valor: string): valor is BelnapValue {
  return VALID_BELNAP.has(valor as BelnapValue);
}

/**
 * Valida un conectivo contra la lista disponible.
 * Útil para validación inline al asignar conectivo a un conjunto.
 */
export function esConectivoValido(
  conectivo: string,
  disponibles: string[],
): boolean {
  const todos = new Set([...KNOWN_CONNECTIVES, ...disponibles]);
  return todos.has(conectivo);
}