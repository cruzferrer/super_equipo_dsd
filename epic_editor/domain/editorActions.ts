/**
 * editorActions.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Acciones puras del Editor EPiC Playground.
 *
 * Este archivo contiene funciones que reciben un EditorState y devuelven
 * un nuevo EditorState modificado.
 *
 * No muta el estado original.
 * No calcula propagaciones.
 * No renderiza.
 * No llama al Motor.
 *
 * Cambio principal del modelo:
 *
 * Antes:
 *   elementos / conjuntos / arcos
 *
 * Ahora:
 *   variables / ocurrencias / pares / arcos
 *
 * Regla central:
 *   Las evidencias viven en la VariableLogica.
 *   Las ocurrencias solo apuntan a una variable mediante variable_id.
 *
 * Por lo tanto, si una bolita se coloca sobre una ocurrencia de "p",
 * realmente se actualiza la variable lógica "p". Todas las ocurrencias
 * con variable_id = "p" quedan sincronizadas automáticamente.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { EditorState, EditorMode } from "./editorState";
import type {
  VariableLogica,
  OcurrenciaVisual,
  ParVisual,
  EditorArc,
  Evidencia,
  BelnapValue,
  MotorConnective,
  MotorOutput,
} from "./editorTypes";
import { evidenciasToBelnap } from "./editorTypes";

// ─────────────────────────────────────────────
// Utilidades internas
// ─────────────────────────────────────────────

/**
 * normalizarEvidencias
 * ─────────────────────────────────────────────
 * Elimina evidencias repetidas y conserva solo las permitidas.
 *
 * Ejemplo:
 *   ["verde", "verde", "roja"] → ["verde", "roja"]
 */
function normalizarEvidencias(evidencias: Evidencia[]): Evidencia[] {
  const resultado: Evidencia[] = [];

  if (evidencias.includes("verde")) {
    resultado.push("verde");
  }

  if (evidencias.includes("roja")) {
    resultado.push("roja");
  }

  return resultado;
}

/**
 * actualizarVariableConEvidencias
 * ─────────────────────────────────────────────
 * Regresa una copia de la variable con evidencias normalizadas y
 * valor_actual sincronizado.
 */
function actualizarVariableConEvidencias(
  variable: VariableLogica,
  evidencias: Evidencia[],
): VariableLogica {
  const evidenciasNormalizadas = normalizarEvidencias(evidencias);

  return {
    ...variable,
    evidencias: evidenciasNormalizadas,
    valor_actual: evidenciasToBelnap(evidenciasNormalizadas),
  };
}

// ─────────────────────────────────────────────
// Acciones de modo / resultado
// ─────────────────────────────────────────────

/**
 * Cambia el modo del Editor.
 */
export function setModo(state: EditorState, modo: EditorMode): EditorState {
  return {
    ...state,
    modo,
  };
}

/**
 * Guarda la última salida recibida del Motor.
 */
export function setMotorOutput(
  state: EditorState,
  motorOutput: MotorOutput | null,
): EditorState {
  return {
    ...state,
    motorOutput,
  };
}

/**
 * Actualiza la lista de conectivos disponibles.
 */
export function setConectivosDisponibles(
  state: EditorState,
  conectivosDisponibles: MotorConnective[],
): EditorState {
  return {
    ...state,
    conectivosDisponibles,
  };
}

/**
 * Actualiza maxIteraciones en el estado.
 *
 * Aunque el nuevo JSON no lo usa directamente en la raíz, lo conservamos
 * como configuración del Editor por si el Motor nuevo decide consumirlo.
 */
export function setMaxIteraciones(
  state: EditorState,
  maxIteraciones: number,
): EditorState {
  return {
    ...state,
    maxIteraciones,
  };
}

// ─────────────────────────────────────────────
// Acciones sobre variables lógicas
// ─────────────────────────────────────────────

/**
 * Crea una variable lógica.
 *
 * Si no se especifica valor/evidencia, inicia sin evidencia:
 *   valor_actual = "N"
 *   evidencias = []
 */
export function crearVariable(
  state: EditorState,
  variable: {
    id: string;
    valor_actual?: BelnapValue;
    evidencias?: Evidencia[];
    alias?: string | null;
  },
): EditorState {
  const evidencias = normalizarEvidencias(variable.evidencias ?? []);
  const valorActual = variable.valor_actual ?? evidenciasToBelnap(evidencias);

  const nuevaVariable: VariableLogica = {
    id: variable.id,
    valor_actual: valorActual,
    evidencias,
    alias: variable.alias ?? null,
  };

  return {
    ...state,
    variables: {
      ...state.variables,
      [nuevaVariable.id]: nuevaVariable,
    },
  };
}

/**
 * Edita parcialmente una variable lógica.
 *
 * Si se actualizan evidencias, el valor_actual se recalcula automáticamente.
 * Si solo se actualiza valor_actual, se respeta ese valor.
 */
export function editarVariable(
  state: EditorState,
  variableId: string,
  cambios: Partial<Omit<VariableLogica, "id">>,
): EditorState {
  const variableActual = state.variables[variableId];

  if (!variableActual) {
    return state;
  }

  let variableActualizada: VariableLogica = {
    ...variableActual,
    ...cambios,
  };

  if (cambios.evidencias) {
    variableActualizada = actualizarVariableConEvidencias(
      variableActualizada,
      cambios.evidencias,
    );
  }

  return {
    ...state,
    variables: {
      ...state.variables,
      [variableId]: variableActualizada,
    },
  };
}

/**
 * Elimina una variable lógica.
 *
 * También elimina:
 *   - ocurrencias que apuntan a esa variable;
 *   - referencias a esas ocurrencias dentro de pares;
 *   - arcos que usen esa variable como origen o destino.
 */
export function eliminarVariable(
  state: EditorState,
  variableId: string,
): EditorState {
  const nuevasVariables = { ...state.variables };
  delete nuevasVariables[variableId];

  const ocurrenciasEliminadas = new Set<string>();

  const nuevasOcurrencias = Object.fromEntries(
    Object.entries(state.ocurrencias).filter(([ocurrenciaId, ocurrencia]) => {
      const conservar = ocurrencia.variable_id !== variableId;

      if (!conservar) {
        ocurrenciasEliminadas.add(ocurrenciaId);
      }

      return conservar;
    }),
  );

  const nuevosPares = Object.fromEntries(
    Object.entries(state.pares).map(([parId, par]) => [
      parId,
      {
        ...par,
        ocurrencias: par.ocurrencias.filter(
          (ocurrenciaId) => !ocurrenciasEliminadas.has(ocurrenciaId),
        ),
      },
    ]),
  );

  const nuevosArcos = Object.fromEntries(
    Object.entries(state.arcos).filter(([, arco]) => {
      const usaVariable =
        arco.origen_variable === variableId || arco.destino_variable === variableId;

      const usaOcurrenciaEliminada =
        ocurrenciasEliminadas.has(arco.origen_ocurrencia) ||
        ocurrenciasEliminadas.has(arco.destino_ocurrencia);

      return !usaVariable && !usaOcurrenciaEliminada;
    }),
  );

  return {
    ...state,
    variables: nuevasVariables,
    ocurrencias: nuevasOcurrencias,
    pares: nuevosPares,
    arcos: nuevosArcos,
  };
}

/**
 * Agrega una evidencia a una variable lógica.
 *
 * Ejemplo:
 *   agregarEvidenciaAVariable(p, "verde")
 *   p.evidencias = ["verde"]
 *   p.valor_actual = "V"
 */
export function agregarEvidenciaAVariable(
  state: EditorState,
  variableId: string,
  evidencia: Evidencia,
): EditorState {
  const variable = state.variables[variableId];

  if (!variable) {
    return state;
  }

  const evidencias = normalizarEvidencias([...variable.evidencias, evidencia]);

  return editarVariable(state, variableId, {
    evidencias,
  });
}

/**
 * Quita una evidencia de una variable lógica.
 */
export function quitarEvidenciaAVariable(
  state: EditorState,
  variableId: string,
  evidencia: Evidencia,
): EditorState {
  const variable = state.variables[variableId];

  if (!variable) {
    return state;
  }

  const evidencias = variable.evidencias.filter((item) => item !== evidencia);

  return editarVariable(state, variableId, {
    evidencias,
  });
}

/**
 * Coloca una evidencia sobre una ocurrencia visual.
 *
 * Esta función resuelve la regla del profesor:
 *
 *   Si pongo una bolita sobre una aparición de "p",
 *   realmente se actualiza la variable lógica "p".
 *
 * Como todas las ocurrencias de "p" apuntan a la misma VariableLogica,
 * todas quedan sincronizadas automáticamente.
 */
export function agregarEvidenciaAOcurrencia(
  state: EditorState,
  ocurrenciaId: string,
  evidencia: Evidencia,
): EditorState {
  const ocurrencia = state.ocurrencias[ocurrenciaId];

  if (!ocurrencia) {
    return state;
  }

  return agregarEvidenciaAVariable(state, ocurrencia.variable_id, evidencia);
}

/**
 * Quita una evidencia desde una ocurrencia visual.
 *
 * Igual que agregarEvidenciaAOcurrencia, la modificación real ocurre sobre
 * la variable lógica asociada.
 */
export function quitarEvidenciaAOcurrencia(
  state: EditorState,
  ocurrenciaId: string,
  evidencia: Evidencia,
): EditorState {
  const ocurrencia = state.ocurrencias[ocurrenciaId];

  if (!ocurrencia) {
    return state;
  }

  return quitarEvidenciaAVariable(state, ocurrencia.variable_id, evidencia);
}

// ─────────────────────────────────────────────
// Acciones sobre ocurrencias visuales
// ─────────────────────────────────────────────

/**
 * Crea una ocurrencia visual.
 *
 * La ocurrencia debe apuntar a una variable lógica mediante variable_id.
 * La validación formal de existencia se hace en editorValidation.ts.
 */
export function crearOcurrencia(
  state: EditorState,
  ocurrencia: OcurrenciaVisual,
): EditorState {
  return {
    ...state,
    ocurrencias: {
      ...state.ocurrencias,
      [ocurrencia.id]: ocurrencia,
    },
  };
}

/**
 * Edita parcialmente una ocurrencia visual.
 */
export function editarOcurrencia(
  state: EditorState,
  ocurrenciaId: string,
  cambios: Partial<Omit<OcurrenciaVisual, "id">>,
): EditorState {
  const ocurrenciaActual = state.ocurrencias[ocurrenciaId];

  if (!ocurrenciaActual) {
    return state;
  }

  return {
    ...state,
    ocurrencias: {
      ...state.ocurrencias,
      [ocurrenciaId]: {
        ...ocurrenciaActual,
        ...cambios,
      },
    },
  };
}

/**
 * Elimina una ocurrencia visual.
 *
 * También:
 *   - la quita de cualquier par que la contenga;
 *   - elimina arcos que la usen como origen o destino.
 */
export function eliminarOcurrencia(
  state: EditorState,
  ocurrenciaId: string,
): EditorState {
  const nuevasOcurrencias = { ...state.ocurrencias };
  delete nuevasOcurrencias[ocurrenciaId];

  const nuevosPares = Object.fromEntries(
    Object.entries(state.pares).map(([parId, par]) => [
      parId,
      {
        ...par,
        ocurrencias: par.ocurrencias.filter((id) => id !== ocurrenciaId),
      },
    ]),
  );

  const nuevosArcos = Object.fromEntries(
    Object.entries(state.arcos).filter(([, arco]) => {
      return (
        arco.origen_ocurrencia !== ocurrenciaId &&
        arco.destino_ocurrencia !== ocurrenciaId
      );
    }),
  );

  return {
    ...state,
    ocurrencias: nuevasOcurrencias,
    pares: nuevosPares,
    arcos: nuevosArcos,
  };
}

/**
 * Actualiza la posición visual de una ocurrencia.
 */
export function moverOcurrencia(
  state: EditorState,
  ocurrenciaId: string,
  posicion: { x: number; y: number },
): EditorState {
  const ocurrencia = state.ocurrencias[ocurrenciaId];

  if (!ocurrencia) {
    return state;
  }

  return editarOcurrencia(state, ocurrenciaId, {
    atributos_visuales: {
      ...ocurrencia.atributos_visuales,
      ...posicion,
    },
  });
}

// ─────────────────────────────────────────────
// Acciones sobre pares/cajas
// ─────────────────────────────────────────────

/**
 * Crea un par/caja.
 */
export function crearPar(state: EditorState, par: ParVisual): EditorState {
  return {
    ...state,
    pares: {
      ...state.pares,
      [par.id]: par,
    },
  };
}

/**
 * Edita parcialmente un par/caja.
 */
export function editarPar(
  state: EditorState,
  parId: string,
  cambios: Partial<Omit<ParVisual, "id">>,
): EditorState {
  const parActual = state.pares[parId];

  if (!parActual) {
    return state;
  }

  return {
    ...state,
    pares: {
      ...state.pares,
      [parId]: {
        ...parActual,
        ...cambios,
      },
    },
  };
}

/**
 * Elimina un par/caja.
 *
 * También elimina:
 *   - ocurrencias que pertenecen a ese par;
 *   - arcos asociados a esas ocurrencias.
 */
export function eliminarPar(state: EditorState, parId: string): EditorState {
  const par = state.pares[parId];

  if (!par) {
    return state;
  }

  const ocurrenciasDelPar = new Set(par.ocurrencias);

  const nuevosPares = { ...state.pares };
  delete nuevosPares[parId];

  const nuevasOcurrencias = Object.fromEntries(
    Object.entries(state.ocurrencias).filter(
      ([ocurrenciaId]) => !ocurrenciasDelPar.has(ocurrenciaId),
    ),
  );

  const nuevosArcos = Object.fromEntries(
    Object.entries(state.arcos).filter(([, arco]) => {
      return (
        !ocurrenciasDelPar.has(arco.origen_ocurrencia) &&
        !ocurrenciasDelPar.has(arco.destino_ocurrencia)
      );
    }),
  );

  return {
    ...state,
    pares: nuevosPares,
    ocurrencias: nuevasOcurrencias,
    arcos: nuevosArcos,
  };
}

/**
 * Agrega una ocurrencia existente a un par existente.
 */
export function agregarOcurrenciaAPar(
  state: EditorState,
  parId: string,
  ocurrenciaId: string,
): EditorState {
  const par = state.pares[parId];

  if (!par) {
    return state;
  }

  if (par.ocurrencias.includes(ocurrenciaId)) {
    return state;
  }

  return editarPar(state, parId, {
    ocurrencias: [...par.ocurrencias, ocurrenciaId],
  });
}

/**
 * Quita una ocurrencia de un par.
 */
export function quitarOcurrenciaDePar(
  state: EditorState,
  parId: string,
  ocurrenciaId: string,
): EditorState {
  const par = state.pares[parId];

  if (!par) {
    return state;
  }

  return editarPar(state, parId, {
    ocurrencias: par.ocurrencias.filter((id) => id !== ocurrenciaId),
  });
}

/**
 * Actualiza la posición visual de un par.
 */
export function moverPar(
  state: EditorState,
  parId: string,
  posicion: { x: number; y: number },
): EditorState {
  const par = state.pares[parId];

  if (!par) {
    return state;
  }

  return editarPar(state, parId, {
    atributos_visuales: {
      ...par.atributos_visuales,
      ...posicion,
    },
  });
}

// ─────────────────────────────────────────────
// Acciones sobre arcos dirigidos
// ─────────────────────────────────────────────

/**
 * Crea un arco dirigido.
 *
 * La validación de que las ocurrencias y variables existan se hace en
 * editorValidation.ts.
 */
export function crearArco(state: EditorState, arco: EditorArc): EditorState {
  return {
    ...state,
    arcos: {
      ...state.arcos,
      [arco.id]: arco,
    },
  };
}

/**
 * Edita parcialmente un arco.
 */
export function editarArco(
  state: EditorState,
  arcoId: string,
  cambios: Partial<Omit<EditorArc, "id">>,
): EditorState {
  const arcoActual = state.arcos[arcoId];

  if (!arcoActual) {
    return state;
  }

  return {
    ...state,
    arcos: {
      ...state.arcos,
      [arcoId]: {
        ...arcoActual,
        ...cambios,
      },
    },
  };
}

/**
 * Elimina un arco.
 */
export function eliminarArco(state: EditorState, arcoId: string): EditorState {
  const nuevosArcos = { ...state.arcos };
  delete nuevosArcos[arcoId];

  return {
    ...state,
    arcos: nuevosArcos,
  };
}