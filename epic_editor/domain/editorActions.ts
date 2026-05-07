/**
 * editorActions.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Acciones del Editor EPiC Playground.
 *
 * Cada función recibe el estado actual y devuelve un NUEVO estado (inmutabilidad).
 * Ninguna función calcula propagaciones ni renderiza.
 *
 * Patrón: acción pura → estado nuevo.
 * El EditorController (editorController.ts) orquesta las llamadas.
 *
 * Limpieza de referencias:
 *   Al eliminar un elemento o conjunto, las acciones limpian automáticamente
 *   todas las referencias rotas (pertenencia, subconjuntos, arcos).
 *   Esto evita que el adaptador genere un MotorInput con referencias inválidas.
 *
 * Relación con el Motor:
 *   Las acciones modifican el EditorState. El adaptador editorToMotorInput.ts
 *   convierte ese estado en MotorInput cuando el usuario pasa a modo ejecución.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type {
  BelnapValue,
  MotorConnective,
  ElementoIn,
  ConjuntoIn,
  EditorArc,
  AtributosVisualesElemento,
  AtributosVisualesConjunto,
  Posicion,
} from "./editorTypes";
import type { EditorState, EditorMode } from "./editorState";
import { DEFAULT_CONNECTIVE } from "./editorTypes";

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

/** Genera el atributo visual por defecto para un ElementoIn nuevo */
function defaultAtributosElemento(pos?: Partial<Posicion>): AtributosVisualesElemento {
  return {
    posicion: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
    color: null,
  };
}

/** Genera el atributo visual por defecto para un ConjuntoIn nuevo */
function defaultAtributosConjunto(pos?: Partial<Posicion>): AtributosVisualesConjunto {
  return {
    radio: 50,
    forma: "elipse",
    posicion: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
  };
}

// ─────────────────────────────────────────────
// 1. Operaciones sobre Elementos
// ─────────────────────────────────────────────

/**
 * Crea un nuevo ElementoIn en el estado del Editor.
 * El elemento parte con valor_verdad "N" (sin evidencia) por defecto.
 * No valida duplicados aquí; la validación ocurre en editorValidation.ts.
 */
export function crearElemento(
  state: EditorState,
  id: string,
  valor_verdad: BelnapValue = "N",
  pertenencia: string[] = [],
  posicion?: Partial<Posicion>,
): EditorState {
  const nuevo: ElementoIn = {
    id,
    valor_verdad,
    pertenencia: [...pertenencia],
    proviene: [],
    atributos_visuales: defaultAtributosElemento(posicion),
  };
  return {
    ...state,
    elementos: { ...state.elementos, [id]: nuevo },
  };
}

/**
 * Edita campos de un ElementoIn existente.
 * Solo actualiza los campos proporcionados (merge parcial).
 */
export function editarElemento(
  state: EditorState,
  id: string,
  cambios: Partial<Omit<ElementoIn, "id">>,
): EditorState {
  const actual = state.elementos[id];
  if (!actual) return state; // Elemento no encontrado; sin cambio

  const actualizado: ElementoIn = {
    ...actual,
    ...cambios,
    id, // El id nunca cambia
    atributos_visuales: {
      ...actual.atributos_visuales,
      ...(cambios.atributos_visuales ?? {}),
    },
  };
  return {
    ...state,
    elementos: { ...state.elementos, [id]: actualizado },
  };
}

/**
 * Elimina un ElementoIn y limpia todas sus referencias:
 *   - Lo quita de `pertenencia` en otros elementos (proviene).
 *   - Lo quita como origen/destino en arcos internos.
 *
 * El MotorInput generado después no tendrá referencias rotas.
 */
export function eliminarElemento(state: EditorState, id: string): EditorState {
  if (!state.elementos[id]) return state;

  // Quitar elemento
  const { [id]: _removed, ...restoElementos } = state.elementos;

  // Limpiar arcos que referencian este elemento
  const arcosLimpios = Object.fromEntries(
    Object.entries(state.arcos).filter(
      ([, arc]) => arc.origen !== id && arc.destino !== id,
    ),
  );

  return {
    ...state,
    elementos: restoElementos,
    arcos: arcosLimpios,
  };
}

// ─────────────────────────────────────────────
// 2. Operaciones sobre Conjuntos
// ─────────────────────────────────────────────

/**
 * Crea un nuevo ConjuntoIn en el estado del Editor.
 * El conectivo por defecto es "PROPAGATION" según las reglas del proyecto.
 */
export function crearConjunto(
  state: EditorState,
  id: string,
  conectivo: MotorConnective = DEFAULT_CONNECTIVE,
  posicion?: Partial<Posicion>,
): EditorState {
  const nuevo: ConjuntoIn = {
    id,
    subconjuntos: [],
    es_resultado_de: null,
    conectivo,
    atributos_visuales: defaultAtributosConjunto(posicion),
  };
  return {
    ...state,
    conjuntos: { ...state.conjuntos, [id]: nuevo },
  };
}

/**
 * Edita campos de un ConjuntoIn existente (merge parcial).
 */
export function editarConjunto(
  state: EditorState,
  id: string,
  cambios: Partial<Omit<ConjuntoIn, "id">>,
): EditorState {
  const actual = state.conjuntos[id];
  if (!actual) return state;

  const actualizado: ConjuntoIn = {
    ...actual,
    ...cambios,
    id,
    atributos_visuales: {
      ...actual.atributos_visuales,
      ...(cambios.atributos_visuales ?? {}),
    },
  };
  return {
    ...state,
    conjuntos: { ...state.conjuntos, [id]: actualizado },
  };
}

/**
 * Elimina un ConjuntoIn y limpia todas sus referencias:
 *   - Lo quita de `pertenencia` en todos los elementos.
 *   - Lo quita de `subconjuntos` en otros conjuntos.
 *   - Revisa si algún conjunto lo tenía como `es_resultado_de` (limpia si aplica).
 */
export function eliminarConjunto(state: EditorState, id: string): EditorState {
  if (!state.conjuntos[id]) return state;

  // Quitar conjunto
  const { [id]: _removed, ...restoConjuntos } = state.conjuntos;

  // Limpiar pertenencia en elementos
  const elementosLimpios = Object.fromEntries(
    Object.entries(state.elementos).map(([eid, el]) => [
      eid,
      { ...el, pertenencia: el.pertenencia.filter((cid) => cid !== id) },
    ]),
  );

  // Limpiar subconjuntos en otros conjuntos
  const conjuntosLimpios = Object.fromEntries(
    Object.entries(restoConjuntos).map(([cid, conj]) => [
      cid,
      { ...conj, subconjuntos: conj.subconjuntos.filter((sid) => sid !== id) },
    ]),
  );

  return {
    ...state,
    elementos: elementosLimpios,
    conjuntos: conjuntosLimpios,
  };
}

// ─────────────────────────────────────────────
// 3. Operaciones sobre Arcos (entidad interna)
// ─────────────────────────────────────────────

/**
 * Registra un arco dirigido como entidad interna del Editor.
 *
 * IMPORTANTE: Este arco NO se envía directamente al Motor.
 * El adaptador editorToMotorInput.ts es el responsable de traducirlo.
 * Si el equipo decide no usar arcos, esta función puede quedar sin llamadas
 * sin afectar la compatibilidad con el Motor.
 */
export function registrarArco(
  state: EditorState,
  arco: EditorArc,
): EditorState {
  return {
    ...state,
    arcos: { ...state.arcos, [arco.id]: arco },
  };
}

/**
 * Elimina un arco interno por ID.
 */
export function eliminarArco(state: EditorState, arcId: string): EditorState {
  const { [arcId]: _removed, ...resto } = state.arcos;
  return { ...state, arcos: resto };
}

// ─────────────────────────────────────────────
// 4. Relaciones de pertenencia y subconjuntos
// ─────────────────────────────────────────────

/**
 * Asigna un elemento a un conjunto (añade conjuntoId a pertenencia del elemento).
 * No valida existencia; la validación es responsabilidad del validador.
 */
export function asignarElementoAConjunto(
  state: EditorState,
  elementoId: string,
  conjuntoId: string,
): EditorState {
  const el = state.elementos[elementoId];
  if (!el || el.pertenencia.includes(conjuntoId)) return state;

  return editarElemento(state, elementoId, {
    pertenencia: [...el.pertenencia, conjuntoId],
  });
}

/**
 * Quita la pertenencia de un elemento a un conjunto.
 */
export function quitarElementoDeConjunto(
  state: EditorState,
  elementoId: string,
  conjuntoId: string,
): EditorState {
  const el = state.elementos[elementoId];
  if (!el) return state;

  return editarElemento(state, elementoId, {
    pertenencia: el.pertenencia.filter((cid) => cid !== conjuntoId),
  });
}

/**
 * Define un subconjunto dentro de un conjunto padre.
 * (añade subId a ConjuntoIn.subconjuntos del padre)
 */
export function definirSubconjunto(
  state: EditorState,
  padreId: string,
  subId: string,
): EditorState {
  const padre = state.conjuntos[padreId];
  if (!padre || padre.subconjuntos.includes(subId)) return state;

  return editarConjunto(state, padreId, {
    subconjuntos: [...padre.subconjuntos, subId],
  });
}

/**
 * Quita un subconjunto de un conjunto padre.
 */
export function quitarSubconjunto(
  state: EditorState,
  padreId: string,
  subId: string,
): EditorState {
  const padre = state.conjuntos[padreId];
  if (!padre) return state;

  return editarConjunto(state, padreId, {
    subconjuntos: padre.subconjuntos.filter((sid) => sid !== subId),
  });
}

// ─────────────────────────────────────────────
// 5. Atributos lógicos y visuales
// ─────────────────────────────────────────────

/**
 * Asigna un valor de verdad Belnap a un elemento.
 * El Editor solo asigna el valor; el Motor lo usa para calcular propagaciones.
 */
export function asignarValorVerdad(
  state: EditorState,
  elementoId: string,
  valor: BelnapValue,
): EditorState {
  return editarElemento(state, elementoId, { valor_verdad: valor });
}

/**
 * Asigna un conectivo a un conjunto.
 * El Editor valida que sea un conectivo conocido, pero no aplica la lógica.
 */
export function asignarConectivo(
  state: EditorState,
  conjuntoId: string,
  conectivo: MotorConnective,
): EditorState {
  return editarConjunto(state, conjuntoId, { conectivo });
}

/**
 * Define el campo es_resultado_de de un conjunto.
 * Representa un cambio de variable o alias lógico (ej: "Z").
 * El Motor genera la acción "cambio_nombre" a partir de este campo;
 * el Editor solo lo registra como dato.
 */
export function definirResultadoDe(
  state: EditorState,
  conjuntoId: string,
  alias: string | null,
): EditorState {
  return editarConjunto(state, conjuntoId, { es_resultado_de: alias });
}

/**
 * Actualiza atributos visuales de un elemento (posición, color, tamaño, alias…).
 * El Editor los gestiona como datos; el Visualizador los usa para renderizar.
 */
export function actualizarAtributosVisualesElemento(
  state: EditorState,
  elementoId: string,
  cambios: Partial<AtributosVisualesElemento>,
): EditorState {
  const el = state.elementos[elementoId];
  if (!el) return state;

  return editarElemento(state, elementoId, {
    atributos_visuales: { ...el.atributos_visuales, ...cambios },
  });
}

/**
 * Actualiza atributos visuales de un conjunto (posición, radio, forma…).
 */
export function actualizarAtributosVisualesConjunto(
  state: EditorState,
  conjuntoId: string,
  cambios: Partial<AtributosVisualesConjunto>,
): EditorState {
  const conj = state.conjuntos[conjuntoId];
  if (!conj) return state;

  return editarConjunto(state, conjuntoId, {
    atributos_visuales: { ...conj.atributos_visuales, ...cambios },
  });
}

// ─────────────────────────────────────────────
// 6. Modo del Editor
// ─────────────────────────────────────────────

/**
 * Cambia el modo del Editor.
 * El paso de "edicion" a "ejecucion" debe ir precedido de validación completa.
 * El controlador es quien orquesta ese flujo.
 */
export function setModo(state: EditorState, modo: EditorMode): EditorState {
  return { ...state, modo };
}

/**
 * Registra la última respuesta del Motor en el estado del Editor.
 * El Editor almacena el resultado para que el Visualizador o el Simulador
 * puedan acceder a él. El Editor no interpreta el resultado semánticamente.
 */
export function setMotorOutput(
  state: EditorState,
  output: import("./editorTypes").MotorOutput | null,
): EditorState {
  return { ...state, motorOutput: output };
}

/**
 * Actualiza la lista de conectivos disponibles (cargada desde GET /conectivos).
 */
export function setConectivosDisponibles(
  state: EditorState,
  conectivos: string[],
): EditorState {
  return { ...state, conectivosDisponibles: conectivos };
}

/**
 * Actualiza el límite de iteraciones para el Motor.
 * Debe estar entre 1 y 500 (validado en editorValidation.ts).
 */
export function setMaxIteraciones(
  state: EditorState,
  max: number,
): EditorState {
  return { ...state, maxIteraciones: max };
}