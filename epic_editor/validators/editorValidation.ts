/**
 * editorValidation.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Validaciones estructurales del Editor EPiC Playground.
 *
 * Este archivo revisa que el estado interno del Editor sea consistente antes
 * de generar el JSON de salida hacia el Motor.
 *
 * Nuevo modelo:
 *   - variables: entidades lógicas reales.
 *   - ocurrencias: apariciones visuales de variables.
 *   - pares: cajas que agrupan ocurrencias.
 *   - arcos: relaciones dirigidas entre ocurrencias/variables.
 *
 * Regla principal:
 *   Varias ocurrencias pueden apuntar a la misma variable mediante variable_id.
 *   Por eso, las evidencias y el valor lógico viven en VariableLogica.
 *
 * Este archivo NO calcula propagaciones.
 * Este archivo NO renderiza.
 * Este archivo NO llama al Motor.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { EditorState } from "../domain/editorState";
import type {
  BelnapValue,
  EditorValidationError,
  Evidencia,
  MotorConnective,
  ValidationResult,
} from "../domain/editorTypes";
import {
  evidenciasToBelnap,
  KNOWN_CONNECTIVES,
} from "../domain/editorTypes";

// ─────────────────────────────────────────────
// Validaciones simples reutilizables
// ─────────────────────────────────────────────

/**
 * Verifica si un valor pertenece al dominio de Belnap.
 */
export function esBelnapValido(valor: string): valor is BelnapValue {
  return ["V", "F", "N", "B"].includes(valor);
}

/**
 * Verifica si una evidencia es válida.
 */
export function esEvidenciaValida(evidencia: string): evidencia is Evidencia {
  return ["verde", "roja"].includes(evidencia);
}

/**
 * Verifica si un conectivo existe dentro de la lista conocida.
 */
export function esConectivoValido(
  conectivo: string,
  conectivosDisponibles: string[] = KNOWN_CONNECTIVES,
): conectivo is MotorConnective {
  return conectivosDisponibles.includes(conectivo);
}

/**
 * Agrega un error al arreglo de errores.
 */
function agregarError(
  errors: EditorValidationError[],
  error: EditorValidationError,
): void {
  errors.push(error);
}

// ─────────────────────────────────────────────
// Validación principal del estado
// ─────────────────────────────────────────────

/**
 * validarEstado
 * ─────────────────────────────────────────────
 * Revisa que el EditorState sea estructuralmente consistente.
 *
 * Valida:
 *   - variables con valores válidos;
 *   - evidencias válidas;
 *   - coherencia entre evidencias y valor_actual;
 *   - ocurrencias que apunten a variables existentes;
 *   - ocurrencias que apunten a pares existentes;
 *   - pares que contengan ocurrencias existentes;
 *   - arcos que apunten a ocurrencias existentes;
 *   - arcos que apunten a variables existentes;
 *   - coincidencia entre ocurrencia y variable declarada en el arco;
 *   - conectivos válidos;
 *   - maxIteraciones en rango razonable.
 */
export function validarEstado(state: EditorState): ValidationResult {
  const errors: EditorValidationError[] = [];

  validarVariables(state, errors);
  validarOcurrencias(state, errors);
  validarPares(state, errors);
  validarArcos(state, errors);
  validarMaxIteraciones(state, errors);

  return {
    valid: errors.filter((error) => error.severity === "error").length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────
// Variables
// ─────────────────────────────────────────────

function validarVariables(
  state: EditorState,
  errors: EditorValidationError[],
): void {
  for (const [variableId, variable] of Object.entries(state.variables)) {
    if (variable.id !== variableId) {
      agregarError(errors, {
        field: `variables.${variableId}.id`,
        message: `La variable está indexada como "${variableId}", pero su id interno es "${variable.id}".`,
        severity: "error",
        entityId: variableId,
      });
    }

    if (!esBelnapValido(variable.valor_actual)) {
      agregarError(errors, {
        field: `variables.${variableId}.valor_actual`,
        message: `El valor "${variable.valor_actual}" no pertenece al dominio V/F/N/B.`,
        severity: "error",
        entityId: variableId,
      });
    }

    for (const evidencia of variable.evidencias) {
      if (!esEvidenciaValida(evidencia)) {
        agregarError(errors, {
          field: `variables.${variableId}.evidencias`,
          message: `La evidencia "${evidencia}" no es válida. Usa "verde" o "roja".`,
          severity: "error",
          entityId: variableId,
        });
      }
    }

    const evidenciasSinDuplicados = new Set(variable.evidencias);

    if (evidenciasSinDuplicados.size !== variable.evidencias.length) {
      agregarError(errors, {
        field: `variables.${variableId}.evidencias`,
        message: `La variable "${variableId}" tiene evidencias repetidas.`,
        severity: "warning",
        entityId: variableId,
      });
    }

    const valorEsperado = evidenciasToBelnap(
      variable.evidencias.filter(esEvidenciaValida),
    );

    if (variable.valor_actual !== valorEsperado) {
      agregarError(errors, {
        field: `variables.${variableId}.valor_actual`,
        message: `El valor_actual "${variable.valor_actual}" no coincide con sus evidencias. Se esperaba "${valorEsperado}".`,
        severity: "error",
        entityId: variableId,
      });
    }
  }
}

// ─────────────────────────────────────────────
// Ocurrencias
// ─────────────────────────────────────────────

function validarOcurrencias(
  state: EditorState,
  errors: EditorValidationError[],
): void {
  for (const [ocurrenciaId, ocurrencia] of Object.entries(state.ocurrencias)) {
    if (ocurrencia.id !== ocurrenciaId) {
      agregarError(errors, {
        field: `ocurrencias.${ocurrenciaId}.id`,
        message: `La ocurrencia está indexada como "${ocurrenciaId}", pero su id interno es "${ocurrencia.id}".`,
        severity: "error",
        entityId: ocurrenciaId,
      });
    }

    if (!state.variables[ocurrencia.variable_id]) {
      agregarError(errors, {
        field: `ocurrencias.${ocurrenciaId}.variable_id`,
        message: `La ocurrencia "${ocurrenciaId}" apunta a la variable inexistente "${ocurrencia.variable_id}".`,
        severity: "error",
        entityId: ocurrenciaId,
      });
    }

    if (!state.pares[ocurrencia.par_id]) {
      agregarError(errors, {
        field: `ocurrencias.${ocurrenciaId}.par_id`,
        message: `La ocurrencia "${ocurrenciaId}" apunta al par inexistente "${ocurrencia.par_id}".`,
        severity: "error",
        entityId: ocurrenciaId,
      });
    }

    if (
      typeof ocurrencia.atributos_visuales.x !== "number" ||
      Number.isNaN(ocurrencia.atributos_visuales.x)
    ) {
      agregarError(errors, {
        field: `ocurrencias.${ocurrenciaId}.atributos_visuales.x`,
        message: `La coordenada x de la ocurrencia "${ocurrenciaId}" debe ser numérica.`,
        severity: "error",
        entityId: ocurrenciaId,
      });
    }

    if (
      typeof ocurrencia.atributos_visuales.y !== "number" ||
      Number.isNaN(ocurrencia.atributos_visuales.y)
    ) {
      agregarError(errors, {
        field: `ocurrencias.${ocurrenciaId}.atributos_visuales.y`,
        message: `La coordenada y de la ocurrencia "${ocurrenciaId}" debe ser numérica.`,
        severity: "error",
        entityId: ocurrenciaId,
      });
    }
  }
}

// ─────────────────────────────────────────────
// Pares
// ─────────────────────────────────────────────

function validarPares(
  state: EditorState,
  errors: EditorValidationError[],
): void {
  for (const [parId, par] of Object.entries(state.pares)) {
    if (par.id !== parId) {
      agregarError(errors, {
        field: `pares.${parId}.id`,
        message: `El par está indexado como "${parId}", pero su id interno es "${par.id}".`,
        severity: "error",
        entityId: parId,
      });
    }

    const ocurrenciasSinDuplicados = new Set(par.ocurrencias);

    if (ocurrenciasSinDuplicados.size !== par.ocurrencias.length) {
      agregarError(errors, {
        field: `pares.${parId}.ocurrencias`,
        message: `El par "${parId}" tiene ocurrencias repetidas.`,
        severity: "warning",
        entityId: parId,
      });
    }

    for (const ocurrenciaId of par.ocurrencias) {
      const ocurrencia = state.ocurrencias[ocurrenciaId];

      if (!ocurrencia) {
        agregarError(errors, {
          field: `pares.${parId}.ocurrencias`,
          message: `El par "${parId}" referencia la ocurrencia inexistente "${ocurrenciaId}".`,
          severity: "error",
          entityId: parId,
        });

        continue;
      }

      if (ocurrencia.par_id !== parId) {
        agregarError(errors, {
          field: `pares.${parId}.ocurrencias`,
          message: `El par "${parId}" contiene "${ocurrenciaId}", pero esa ocurrencia declara pertenecer a "${ocurrencia.par_id}".`,
          severity: "error",
          entityId: parId,
        });
      }
    }

    /**
     * El profesor mencionó "cajas de pares". Por eso avisamos cuando un par
     * no tiene exactamente dos ocurrencias.
     *
     * Se deja como warning, no como error, porque puede que el alcance cambie
     * y se permitan cajas con una o más ocurrencias.
     */
    if (par.ocurrencias.length !== 2) {
      agregarError(errors, {
        field: `pares.${parId}.ocurrencias`,
        message: `El par "${parId}" tiene ${par.ocurrencias.length} ocurrencia(s). Un par normalmente debería tener 2.`,
        severity: "warning",
        entityId: parId,
      });
    }

    if (
      typeof par.atributos_visuales.x !== "number" ||
      Number.isNaN(par.atributos_visuales.x)
    ) {
      agregarError(errors, {
        field: `pares.${parId}.atributos_visuales.x`,
        message: `La coordenada x del par "${parId}" debe ser numérica.`,
        severity: "error",
        entityId: parId,
      });
    }

    if (
      typeof par.atributos_visuales.y !== "number" ||
      Number.isNaN(par.atributos_visuales.y)
    ) {
      agregarError(errors, {
        field: `pares.${parId}.atributos_visuales.y`,
        message: `La coordenada y del par "${parId}" debe ser numérica.`,
        severity: "error",
        entityId: parId,
      });
    }
  }
}

// ─────────────────────────────────────────────
// Arcos
// ─────────────────────────────────────────────

function validarArcos(
  state: EditorState,
  errors: EditorValidationError[],
): void {
  for (const [arcoId, arco] of Object.entries(state.arcos)) {
    if (arco.id !== arcoId) {
      agregarError(errors, {
        field: `arcos.${arcoId}.id`,
        message: `El arco está indexado como "${arcoId}", pero su id interno es "${arco.id}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    const origenOcurrencia = state.ocurrencias[arco.origen_ocurrencia];
    const destinoOcurrencia = state.ocurrencias[arco.destino_ocurrencia];

    if (!origenOcurrencia) {
      agregarError(errors, {
        field: `arcos.${arcoId}.origen_ocurrencia`,
        message: `El arco "${arcoId}" apunta a la ocurrencia origen inexistente "${arco.origen_ocurrencia}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    if (!destinoOcurrencia) {
      agregarError(errors, {
        field: `arcos.${arcoId}.destino_ocurrencia`,
        message: `El arco "${arcoId}" apunta a la ocurrencia destino inexistente "${arco.destino_ocurrencia}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    if (!state.variables[arco.origen_variable]) {
      agregarError(errors, {
        field: `arcos.${arcoId}.origen_variable`,
        message: `El arco "${arcoId}" apunta a la variable origen inexistente "${arco.origen_variable}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    if (!state.variables[arco.destino_variable]) {
      agregarError(errors, {
        field: `arcos.${arcoId}.destino_variable`,
        message: `El arco "${arcoId}" apunta a la variable destino inexistente "${arco.destino_variable}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    if (
      origenOcurrencia &&
      arco.origen_variable !== origenOcurrencia.variable_id
    ) {
      agregarError(errors, {
        field: `arcos.${arcoId}.origen_variable`,
        message: `El arco "${arcoId}" declara origen_variable="${arco.origen_variable}", pero "${arco.origen_ocurrencia}" representa a "${origenOcurrencia.variable_id}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    if (
      destinoOcurrencia &&
      arco.destino_variable !== destinoOcurrencia.variable_id
    ) {
      agregarError(errors, {
        field: `arcos.${arcoId}.destino_variable`,
        message: `El arco "${arcoId}" declara destino_variable="${arco.destino_variable}", pero "${arco.destino_ocurrencia}" representa a "${destinoOcurrencia.variable_id}".`,
        severity: "error",
        entityId: arcoId,
      });
    }

    if (!esConectivoValido(arco.conectivo, state.conectivosDisponibles)) {
      agregarError(errors, {
        field: `arcos.${arcoId}.conectivo`,
        message: `El arco "${arcoId}" usa el conectivo inválido "${arco.conectivo}".`,
        severity: "error",
        entityId: arcoId,
      });
    }
  }
}

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

function validarMaxIteraciones(
  state: EditorState,
  errors: EditorValidationError[],
): void {
  if (
    !Number.isInteger(state.maxIteraciones) ||
    state.maxIteraciones < 1 ||
    state.maxIteraciones > 500
  ) {
    agregarError(errors, {
      field: "maxIteraciones",
      message: "maxIteraciones debe ser un entero entre 1 y 500.",
      severity: "error",
    });
  }
}