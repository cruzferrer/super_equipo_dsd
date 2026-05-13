/**
 * editorController.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Controlador principal del Editor EPiC Playground.
 *
 * Este archivo coordina:
 *   - estado interno del Editor;
 *   - acciones de edición;
 *   - validación del dominio;
 *   - generación del nuevo MotorInputV2;
 *   - comunicación con el Motor.
 *
 * El controlador NO:
 *   - calcula propagaciones;
 *   - renderiza;
 *   - aplica conectivos;
 *   - interpreta semánticamente el resultado final.
 *
 * Nuevo modelo:
 *   variables + ocurrencias + pares + arcos
 *
 * Regla central:
 *   Las evidencias viven en VariableLogica.
 *   Las ocurrencias solo apuntan a variables mediante variable_id.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { createInitialState, type EditorState, type EditorMode } from "../domain/editorState";

import type {
  VariableLogica,
  OcurrenciaVisual,
  ParVisual,
  EditorArc,
  Evidencia,
  BelnapValue,
  MotorConnective,
  MotorInputV2,
  MotorOutput,
  ValidationResult,
  EditorValidationError,
} from "../domain/editorTypes";

import {
  crearVariable,
  editarVariable,
  eliminarVariable,
  agregarEvidenciaAVariable,
  quitarEvidenciaAVariable,
  agregarEvidenciaAOcurrencia,
  quitarEvidenciaAOcurrencia,
  crearOcurrencia,
  editarOcurrencia,
  eliminarOcurrencia,
  moverOcurrencia,
  crearPar,
  editarPar,
  eliminarPar,
  agregarOcurrenciaAPar,
  quitarOcurrenciaDePar,
  moverPar,
  crearArco,
  editarArco,
  eliminarArco,
  setModo,
  setMotorOutput,
  setConectivosDisponibles,
  setMaxIteraciones,
} from "../domain/editorActions";

import { validarEstado } from "../validators/editorValidation";
import { toMotorInput } from "../adapters/editorToMotorInput";
import { MockMotorClient, type IMotorClient } from "../services/motorApiClient";

// ─────────────────────────────────────────────
// Resultado estándar del controlador
// ─────────────────────────────────────────────

/**
 * ControllerResult
 * ─────────────────────────────────────────────
 * Resultado estándar para operaciones que pueden fallar por validación.
 */
export interface ControllerResult<T = EditorState> {
  ok: boolean;
  data?: T;
  errors?: EditorValidationError[];
}

// ─────────────────────────────────────────────
// Controlador principal
// ─────────────────────────────────────────────

export class EditorController {
  private state: EditorState;
  private readonly motorClient: IMotorClient;

  /**
   * Crea una instancia del EditorController.
   *
   * Si no se proporciona cliente del Motor, se usa MockMotorClient.
   * Esto facilita pruebas y desarrollo sin tener el Motor real levantado.
   */
  constructor(options?: {
    initialState?: EditorState;
    motorClient?: IMotorClient;
  }) {
    this.state = options?.initialState ?? createInitialState();
    this.motorClient = options?.motorClient ?? new MockMotorClient();
  }

  // ─────────────────────────────────────────────
  // Lectura de estado
  // ─────────────────────────────────────────────

  /**
   * Devuelve una referencia del estado actual.
   *
   * Si se desea evitar mutaciones externas, se puede cambiar después
   * por una copia profunda.
   */
  getState(): EditorState {
    return this.state;
  }

  /**
   * Reemplaza el estado completo del Editor.
   * Útil para cargar proyectos guardados o restaurar snapshots.
   */
  setState(state: EditorState): void {
    this.state = state;
  }

  /**
   * Reinicia el Editor al estado vacío.
   */
  reset(): EditorState {
    this.state = createInitialState();
    return this.state;
  }

  // ─────────────────────────────────────────────
  // Modo / configuración
  // ─────────────────────────────────────────────

  setModo(modo: EditorMode): EditorState {
    this.state = setModo(this.state, modo);
    return this.state;
  }

  setMaxIteraciones(maxIteraciones: number): EditorState {
    this.state = setMaxIteraciones(this.state, maxIteraciones);
    return this.state;
  }

  // ─────────────────────────────────────────────
  // Variables
  // ─────────────────────────────────────────────

  /**
   * Crea una variable lógica.
   *
   * La variable representa el nombre real del sistema: p, q, r, etc.
   */
  crearVariable(variable: {
    id: string;
    valor_actual?: BelnapValue;
    evidencias?: Evidencia[];
    alias?: string | null;
  }): ControllerResult {
    if (this.state.variables[variable.id]) {
      return {
        ok: false,
        errors: [
          {
            field: `variables.${variable.id}`,
            message: `La variable "${variable.id}" ya existe.`,
            severity: "error",
            entityId: variable.id,
          },
        ],
      };
    }

    this.state = crearVariable(this.state, variable);

    return {
      ok: true,
      data: this.state,
    };
  }

  editarVariable(
    variableId: string,
    cambios: Partial<Omit<VariableLogica, "id">>,
  ): ControllerResult {
    if (!this.state.variables[variableId]) {
      return {
        ok: false,
        errors: [
          {
            field: `variables.${variableId}`,
            message: `La variable "${variableId}" no existe.`,
            severity: "error",
            entityId: variableId,
          },
        ],
      };
    }

    this.state = editarVariable(this.state, variableId, cambios);

    return {
      ok: true,
      data: this.state,
    };
  }

  eliminarVariable(variableId: string): ControllerResult {
    if (!this.state.variables[variableId]) {
      return {
        ok: false,
        errors: [
          {
            field: `variables.${variableId}`,
            message: `No se puede eliminar la variable "${variableId}" porque no existe.`,
            severity: "error",
            entityId: variableId,
          },
        ],
      };
    }

    this.state = eliminarVariable(this.state, variableId);

    return {
      ok: true,
      data: this.state,
    };
  }

  agregarEvidenciaAVariable(
    variableId: string,
    evidencia: Evidencia,
  ): ControllerResult {
    if (!this.state.variables[variableId]) {
      return {
        ok: false,
        errors: [
          {
            field: `variables.${variableId}.evidencias`,
            message: `No se puede agregar evidencia porque la variable "${variableId}" no existe.`,
            severity: "error",
            entityId: variableId,
          },
        ],
      };
    }

    this.state = agregarEvidenciaAVariable(this.state, variableId, evidencia);

    return {
      ok: true,
      data: this.state,
    };
  }

  quitarEvidenciaAVariable(
    variableId: string,
    evidencia: Evidencia,
  ): ControllerResult {
    if (!this.state.variables[variableId]) {
      return {
        ok: false,
        errors: [
          {
            field: `variables.${variableId}.evidencias`,
            message: `No se puede quitar evidencia porque la variable "${variableId}" no existe.`,
            severity: "error",
            entityId: variableId,
          },
        ],
      };
    }

    this.state = quitarEvidenciaAVariable(this.state, variableId, evidencia);

    return {
      ok: true,
      data: this.state,
    };
  }

  // ─────────────────────────────────────────────
  // Ocurrencias
  // ─────────────────────────────────────────────

  /**
   * Crea una ocurrencia visual.
   *
   * Una ocurrencia es una aparición de una variable en un par/caja.
   */
  crearOcurrencia(ocurrencia: OcurrenciaVisual): ControllerResult {
    if (this.state.ocurrencias[ocurrencia.id]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrencia.id}`,
            message: `La ocurrencia "${ocurrencia.id}" ya existe.`,
            severity: "error",
            entityId: ocurrencia.id,
          },
        ],
      };
    }

    if (!this.state.variables[ocurrencia.variable_id]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrencia.id}.variable_id`,
            message: `No se puede crear la ocurrencia porque la variable "${ocurrencia.variable_id}" no existe.`,
            severity: "error",
            entityId: ocurrencia.id,
          },
        ],
      };
    }

    if (!this.state.pares[ocurrencia.par_id]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrencia.id}.par_id`,
            message: `No se puede crear la ocurrencia porque el par "${ocurrencia.par_id}" no existe.`,
            severity: "error",
            entityId: ocurrencia.id,
          },
        ],
      };
    }

    this.state = crearOcurrencia(this.state, ocurrencia);
    this.state = agregarOcurrenciaAPar(
      this.state,
      ocurrencia.par_id,
      ocurrencia.id,
    );

    return {
      ok: true,
      data: this.state,
    };
  }

  editarOcurrencia(
    ocurrenciaId: string,
    cambios: Partial<Omit<OcurrenciaVisual, "id">>,
  ): ControllerResult {
    if (!this.state.ocurrencias[ocurrenciaId]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrenciaId}`,
            message: `La ocurrencia "${ocurrenciaId}" no existe.`,
            severity: "error",
            entityId: ocurrenciaId,
          },
        ],
      };
    }

    this.state = editarOcurrencia(this.state, ocurrenciaId, cambios);

    return {
      ok: true,
      data: this.state,
    };
  }

  eliminarOcurrencia(ocurrenciaId: string): ControllerResult {
    if (!this.state.ocurrencias[ocurrenciaId]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrenciaId}`,
            message: `No se puede eliminar la ocurrencia "${ocurrenciaId}" porque no existe.`,
            severity: "error",
            entityId: ocurrenciaId,
          },
        ],
      };
    }

    this.state = eliminarOcurrencia(this.state, ocurrenciaId);

    return {
      ok: true,
      data: this.state,
    };
  }

  moverOcurrencia(
    ocurrenciaId: string,
    posicion: { x: number; y: number },
  ): ControllerResult {
    if (!this.state.ocurrencias[ocurrenciaId]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrenciaId}.atributos_visuales`,
            message: `No se puede mover la ocurrencia "${ocurrenciaId}" porque no existe.`,
            severity: "error",
            entityId: ocurrenciaId,
          },
        ],
      };
    }

    this.state = moverOcurrencia(this.state, ocurrenciaId, posicion);

    return {
      ok: true,
      data: this.state,
    };
  }

  /**
   * Agrega una evidencia usando una ocurrencia visual.
   *
   * Esta función implementa la regla principal:
   * si el usuario pone una bolita sobre una ocurrencia de p,
   * el cambio se guarda en la variable lógica p.
   */
  agregarEvidenciaAOcurrencia(
    ocurrenciaId: string,
    evidencia: Evidencia,
  ): ControllerResult {
    if (!this.state.ocurrencias[ocurrenciaId]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrenciaId}`,
            message: `No se puede agregar evidencia porque la ocurrencia "${ocurrenciaId}" no existe.`,
            severity: "error",
            entityId: ocurrenciaId,
          },
        ],
      };
    }

    this.state = agregarEvidenciaAOcurrencia(this.state, ocurrenciaId, evidencia);

    return {
      ok: true,
      data: this.state,
    };
  }

  quitarEvidenciaAOcurrencia(
    ocurrenciaId: string,
    evidencia: Evidencia,
  ): ControllerResult {
    if (!this.state.ocurrencias[ocurrenciaId]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrenciaId}`,
            message: `No se puede quitar evidencia porque la ocurrencia "${ocurrenciaId}" no existe.`,
            severity: "error",
            entityId: ocurrenciaId,
          },
        ],
      };
    }

    this.state = quitarEvidenciaAOcurrencia(this.state, ocurrenciaId, evidencia);

    return {
      ok: true,
      data: this.state,
    };
  }

  // ─────────────────────────────────────────────
  // Pares
  // ─────────────────────────────────────────────

  crearPar(par: ParVisual): ControllerResult {
    if (this.state.pares[par.id]) {
      return {
        ok: false,
        errors: [
          {
            field: `pares.${par.id}`,
            message: `El par "${par.id}" ya existe.`,
            severity: "error",
            entityId: par.id,
          },
        ],
      };
    }

    this.state = crearPar(this.state, par);

    return {
      ok: true,
      data: this.state,
    };
  }

  editarPar(
    parId: string,
    cambios: Partial<Omit<ParVisual, "id">>,
  ): ControllerResult {
    if (!this.state.pares[parId]) {
      return {
        ok: false,
        errors: [
          {
            field: `pares.${parId}`,
            message: `El par "${parId}" no existe.`,
            severity: "error",
            entityId: parId,
          },
        ],
      };
    }

    this.state = editarPar(this.state, parId, cambios);

    return {
      ok: true,
      data: this.state,
    };
  }

  eliminarPar(parId: string): ControllerResult {
    if (!this.state.pares[parId]) {
      return {
        ok: false,
        errors: [
          {
            field: `pares.${parId}`,
            message: `No se puede eliminar el par "${parId}" porque no existe.`,
            severity: "error",
            entityId: parId,
          },
        ],
      };
    }

    this.state = eliminarPar(this.state, parId);

    return {
      ok: true,
      data: this.state,
    };
  }

  moverPar(parId: string, posicion: { x: number; y: number }): ControllerResult {
    if (!this.state.pares[parId]) {
      return {
        ok: false,
        errors: [
          {
            field: `pares.${parId}.atributos_visuales`,
            message: `No se puede mover el par "${parId}" porque no existe.`,
            severity: "error",
            entityId: parId,
          },
        ],
      };
    }

    this.state = moverPar(this.state, parId, posicion);

    return {
      ok: true,
      data: this.state,
    };
  }

  agregarOcurrenciaAPar(
    parId: string,
    ocurrenciaId: string,
  ): ControllerResult {
    if (!this.state.pares[parId]) {
      return {
        ok: false,
        errors: [
          {
            field: `pares.${parId}`,
            message: `El par "${parId}" no existe.`,
            severity: "error",
            entityId: parId,
          },
        ],
      };
    }

    if (!this.state.ocurrencias[ocurrenciaId]) {
      return {
        ok: false,
        errors: [
          {
            field: `ocurrencias.${ocurrenciaId}`,
            message: `La ocurrencia "${ocurrenciaId}" no existe.`,
            severity: "error",
            entityId: ocurrenciaId,
          },
        ],
      };
    }

    this.state = agregarOcurrenciaAPar(this.state, parId, ocurrenciaId);

    return {
      ok: true,
      data: this.state,
    };
  }

  quitarOcurrenciaDePar(
    parId: string,
    ocurrenciaId: string,
  ): ControllerResult {
    if (!this.state.pares[parId]) {
      return {
        ok: false,
        errors: [
          {
            field: `pares.${parId}`,
            message: `El par "${parId}" no existe.`,
            severity: "error",
            entityId: parId,
          },
        ],
      };
    }

    this.state = quitarOcurrenciaDePar(this.state, parId, ocurrenciaId);

    return {
      ok: true,
      data: this.state,
    };
  }

  // ─────────────────────────────────────────────
  // Arcos
  // ─────────────────────────────────────────────

  crearArco(arco: EditorArc): ControllerResult {
    if (this.state.arcos[arco.id]) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arco.id}`,
            message: `El arco "${arco.id}" ya existe.`,
            severity: "error",
            entityId: arco.id,
          },
        ],
      };
    }

    const origen = this.state.ocurrencias[arco.origen_ocurrencia];
    const destino = this.state.ocurrencias[arco.destino_ocurrencia];

    if (!origen) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arco.id}.origen_ocurrencia`,
            message: `La ocurrencia origen "${arco.origen_ocurrencia}" no existe.`,
            severity: "error",
            entityId: arco.id,
          },
        ],
      };
    }

    if (!destino) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arco.id}.destino_ocurrencia`,
            message: `La ocurrencia destino "${arco.destino_ocurrencia}" no existe.`,
            severity: "error",
            entityId: arco.id,
          },
        ],
      };
    }

    if (arco.origen_variable !== origen.variable_id) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arco.id}.origen_variable`,
            message: `origen_variable debe coincidir con la variable de ${arco.origen_ocurrencia}.`,
            severity: "error",
            entityId: arco.id,
          },
        ],
      };
    }

    if (arco.destino_variable !== destino.variable_id) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arco.id}.destino_variable`,
            message: `destino_variable debe coincidir con la variable de ${arco.destino_ocurrencia}.`,
            severity: "error",
            entityId: arco.id,
          },
        ],
      };
    }

    this.state = crearArco(this.state, arco);

    return {
      ok: true,
      data: this.state,
    };
  }

  editarArco(
    arcoId: string,
    cambios: Partial<Omit<EditorArc, "id">>,
  ): ControllerResult {
    if (!this.state.arcos[arcoId]) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arcoId}`,
            message: `El arco "${arcoId}" no existe.`,
            severity: "error",
            entityId: arcoId,
          },
        ],
      };
    }

    this.state = editarArco(this.state, arcoId, cambios);

    return {
      ok: true,
      data: this.state,
    };
  }

  eliminarArco(arcoId: string): ControllerResult {
    if (!this.state.arcos[arcoId]) {
      return {
        ok: false,
        errors: [
          {
            field: `arcos.${arcoId}`,
            message: `No se puede eliminar el arco "${arcoId}" porque no existe.`,
            severity: "error",
            entityId: arcoId,
          },
        ],
      };
    }

    this.state = eliminarArco(this.state, arcoId);

    return {
      ok: true,
      data: this.state,
    };
  }

  // ─────────────────────────────────────────────
  // Validación / salida hacia Motor
  // ─────────────────────────────────────────────

  validar(): ValidationResult {
    return validarEstado(this.state);
  }

  /**
   * Genera el nuevo JSON completo que se enviará al Motor.
   */
  generarMotorInput(): ControllerResult<MotorInputV2> {
    const validation = validarEstado(this.state);

    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      data: toMotorInput(this.state),
    };
  }

  // ─────────────────────────────────────────────
  // Comunicación con Motor
  // ─────────────────────────────────────────────

  async healthMotor(): Promise<boolean> {
    return this.motorClient.health();
  }

  async cargarConectivos(): Promise<ControllerResult> {
    try {
      const conectivos = await this.motorClient.listarConectivos();
      this.state = setConectivosDisponibles(this.state, conectivos);

      return {
        ok: true,
        data: this.state,
      };
    } catch (error) {
      return {
        ok: false,
        errors: [
          {
            field: "conectivosDisponibles",
            message:
              error instanceof Error
                ? error.message
                : "No se pudieron cargar los conectivos.",
            severity: "error",
          },
        ],
      };
    }
  }

  /**
   * Valida, genera MotorInputV2 y lo envía al Motor.
   */
  async ejecutar(): Promise<ControllerResult<MotorOutput>> {
    const validation = validarEstado(this.state);

    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    const previousMode = this.state.modo;

    try {
      this.state = setModo(this.state, "ejecucion");

      const payload = toMotorInput(this.state);
      const output = await this.motorClient.calcular(payload);

      this.state = setMotorOutput(this.state, output);

      return {
        ok: true,
        data: output,
      };
    } catch (error) {
      this.state = setModo(this.state, previousMode);

      return {
        ok: false,
        errors: [
          {
            field: "motor",
            message:
              error instanceof Error
                ? error.message
                : "Error desconocido al ejecutar el Motor.",
            severity: "error",
          },
        ],
      };
    }
  }
}