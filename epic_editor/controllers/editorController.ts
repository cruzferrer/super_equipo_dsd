/**
 * editorController.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Controlador del Editor EPiC Playground.
 *
 * Responsabilidad:
 *   Orquestar las acciones del Editor. Coordina el estado, la validación,
 *   el adaptador y el cliente del Motor.
 *
 * Lo que el controlador NO hace (SRP):
 *   - No calcula propagaciones (Motor).
 *   - No renderiza (Visualizador).
 *   - No interpreta el resultado semánticamente (Simulador).
 *   - No implementa lógica de Belnap.
 *   - No duplica matrices de conectivos.
 *
 * Principio DIP:
 *   El controlador depende de IMotorClient, no de MotorApiClient.
 *   En producción se inyecta MotorApiClient; en pruebas, MockMotorClient.
 *
 * Principio OCP:
 *   Para agregar una nueva operación de edición, se añade un método sin
 *   tocar los existentes. Para cambiar la estrategia de arcos, solo cambia
 *   editorToMotorInput.ts.
 *
 * Estado:
 *   El controlador mantiene un EditorState interno. Expone métodos para
 *   leerlo y suscribirse a cambios (patrón observable mínimo).
 *   En una integración con React, el estado se levantaría a un store
 *   (Zustand, Redux, Context) y el controlador sería un servicio stateless.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type {
  BelnapValue,
  MotorConnective,
  EditorArc,
  AtributosVisualesElemento,
  AtributosVisualesConjunto,
  MotorInput,
  ValidationResult,
  Posicion,
} from "../domain/editorTypes";
import { createInitialState } from "../domain/editorState";
import type { EditorState, EditorMode } from "../domain/editorState";
import * as actions from "../domain/editorActions";
import { validarEstado } from "../validators/editorValidation";
import { toMotorInput } from "../adapters/editorToMotorInput";
import type { IMotorClient } from "../services/motorApiClient";
import { MotorApiClient } from "../services/motorApiClient";

// ─────────────────────────────────────────────
// Tipos de resultado del controlador
// ─────────────────────────────────────────────

export type ControllerResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; errors: ValidationResult["errors"] };

// ─────────────────────────────────────────────
// Clase EditorController
// ─────────────────────────────────────────────

export class EditorController {
  private state: EditorState;
  private readonly motorClient: IMotorClient;
  /** Lista de callbacks suscritos a cambios de estado */
  private readonly subscribers: Array<(state: EditorState) => void> = [];

  /**
   * @param motorClient Cliente del Motor. Por defecto: MotorApiClient real.
   *                    En pruebas, inyectar MockMotorClient.
   */
  constructor(motorClient?: IMotorClient) {
    this.state = createInitialState();
    this.motorClient = motorClient ?? new MotorApiClient();
  }

  // ─────────────────────────────────────────────
  // Suscripción a cambios (para integración con UI)
  // ─────────────────────────────────────────────

  /** Suscribirse a cambios de estado del Editor */
  subscribe(cb: (state: EditorState) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      const idx = this.subscribers.indexOf(cb);
      if (idx >= 0) this.subscribers.splice(idx, 1);
    };
  }

  /** Retorna una copia inmutable del estado actual */
  getState(): Readonly<EditorState> {
    return this.state;
  }

  private setState(newState: EditorState): void {
    this.state = newState;
    this.subscribers.forEach((cb) => cb(this.state));
  }

  // ─────────────────────────────────────────────
  // 1. Operaciones sobre Elementos
  // ─────────────────────────────────────────────

  crearElemento(
    id: string,
    valor_verdad: BelnapValue = "N",
    pertenencia: string[] = [],
    posicion?: Partial<Posicion>,
  ): ControllerResult {
    if (this.state.elementos[id]) {
      return {
        ok: false,
        errors: [{
          field: `elementos[${id}].id`,
          message: `Ya existe un elemento con id "${id}".`,
          severity: "error",
          entityId: id,
        }],
      };
    }
    this.setState(actions.crearElemento(this.state, id, valor_verdad, pertenencia, posicion));
    return { ok: true, data: undefined };
  }

  editarElemento(
    id: string,
    cambios: Partial<Omit<import("../domain/editorTypes").ElementoIn, "id">>,
  ): ControllerResult {
    if (!this.state.elementos[id]) {
      return { ok: false, errors: [{ field: `elementos`, message: `Elemento "${id}" no encontrado.`, severity: "error", entityId: id }] };
    }
    this.setState(actions.editarElemento(this.state, id, cambios));
    return { ok: true, data: undefined };
  }

  eliminarElemento(id: string): ControllerResult {
    this.setState(actions.eliminarElemento(this.state, id));
    return { ok: true, data: undefined };
  }

  // ─────────────────────────────────────────────
  // 2. Operaciones sobre Conjuntos
  // ─────────────────────────────────────────────

  crearConjunto(
    id: string,
    conectivo: MotorConnective = "PROPAGATION",
    posicion?: Partial<Posicion>,
  ): ControllerResult {
    if (this.state.conjuntos[id]) {
      return {
        ok: false,
        errors: [{
          field: `conjuntos[${id}].id`,
          message: `Ya existe un conjunto con id "${id}".`,
          severity: "error",
          entityId: id,
        }],
      };
    }
    this.setState(actions.crearConjunto(this.state, id, conectivo, posicion));
    return { ok: true, data: undefined };
  }

  editarConjunto(
    id: string,
    cambios: Partial<Omit<import("../domain/editorTypes").ConjuntoIn, "id">>,
  ): ControllerResult {
    if (!this.state.conjuntos[id]) {
      return { ok: false, errors: [{ field: `conjuntos`, message: `Conjunto "${id}" no encontrado.`, severity: "error", entityId: id }] };
    }
    this.setState(actions.editarConjunto(this.state, id, cambios));
    return { ok: true, data: undefined };
  }

  eliminarConjunto(id: string): ControllerResult {
    this.setState(actions.eliminarConjunto(this.state, id));
    return { ok: true, data: undefined };
  }

  // ─────────────────────────────────────────────
  // 3. Arcos internos
  // ─────────────────────────────────────────────

  registrarArco(arco: EditorArc): ControllerResult {
    if (!this.state.elementos[arco.origen]) {
      return { ok: false, errors: [{ field: `arcos[${arco.id}].origen`, message: `Elemento origen "${arco.origen}" no existe.`, severity: "error", entityId: arco.id }] };
    }
    if (!this.state.elementos[arco.destino]) {
      return { ok: false, errors: [{ field: `arcos[${arco.id}].destino`, message: `Elemento destino "${arco.destino}" no existe.`, severity: "error", entityId: arco.id }] };
    }
    this.setState(actions.registrarArco(this.state, arco));
    return { ok: true, data: undefined };
  }

  eliminarArco(arcId: string): ControllerResult {
    this.setState(actions.eliminarArco(this.state, arcId));
    return { ok: true, data: undefined };
  }

  // ─────────────────────────────────────────────
  // 4. Relaciones de pertenencia y subconjuntos
  // ─────────────────────────────────────────────

  asignarElementoAConjunto(elementoId: string, conjuntoId: string): ControllerResult {
    this.setState(actions.asignarElementoAConjunto(this.state, elementoId, conjuntoId));
    return { ok: true, data: undefined };
  }

  quitarElementoDeConjunto(elementoId: string, conjuntoId: string): ControllerResult {
    this.setState(actions.quitarElementoDeConjunto(this.state, elementoId, conjuntoId));
    return { ok: true, data: undefined };
  }

  definirSubconjunto(padreId: string, subId: string): ControllerResult {
    this.setState(actions.definirSubconjunto(this.state, padreId, subId));
    return { ok: true, data: undefined };
  }

  quitarSubconjunto(padreId: string, subId: string): ControllerResult {
    this.setState(actions.quitarSubconjunto(this.state, padreId, subId));
    return { ok: true, data: undefined };
  }

  // ─────────────────────────────────────────────
  // 5. Atributos lógicos y visuales
  // ─────────────────────────────────────────────

  asignarValorVerdad(elementoId: string, valor: BelnapValue): ControllerResult {
    this.setState(actions.asignarValorVerdad(this.state, elementoId, valor));
    return { ok: true, data: undefined };
  }

  asignarConectivo(conjuntoId: string, conectivo: MotorConnective): ControllerResult {
    this.setState(actions.asignarConectivo(this.state, conjuntoId, conectivo));
    return { ok: true, data: undefined };
  }

  definirResultadoDe(conjuntoId: string, alias: string | null): ControllerResult {
    this.setState(actions.definirResultadoDe(this.state, conjuntoId, alias));
    return { ok: true, data: undefined };
  }

  actualizarAtributosElemento(
    elementoId: string,
    cambios: Partial<AtributosVisualesElemento>,
  ): ControllerResult {
    this.setState(actions.actualizarAtributosVisualesElemento(this.state, elementoId, cambios));
    return { ok: true, data: undefined };
  }

  actualizarAtributosConjunto(
    conjuntoId: string,
    cambios: Partial<AtributosVisualesConjunto>,
  ): ControllerResult {
    this.setState(actions.actualizarAtributosVisualesConjunto(this.state, conjuntoId, cambios));
    return { ok: true, data: undefined };
  }

  setMaxIteraciones(max: number): ControllerResult {
    this.setState(actions.setMaxIteraciones(this.state, max));
    return { ok: true, data: undefined };
  }

  // ─────────────────────────────────────────────
  // 6. Validación y generación de MotorInput
  // ─────────────────────────────────────────────

  /** Valida el estado actual sin intentar ejecutar el Motor */
  validar(): ValidationResult {
    return validarEstado(this.state);
  }

  /**
   * Genera el MotorInput a partir del estado actual.
   * Retorna error si la validación falla.
   */
  generarMotorInput(): ControllerResult<MotorInput> {
    const validation = validarEstado(this.state);
    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }
    const payload = toMotorInput(this.state);
    return { ok: true, data: payload };
  }

  // ─────────────────────────────────────────────
  // 7. Comunicación con el Motor
  // ─────────────────────────────────────────────

  /**
   * Verifica que el Motor esté activo (GET /health).
   */
  async checkMotorHealth(): Promise<boolean> {
    return this.motorClient.health();
  }

  /**
   * Carga los conectivos disponibles desde el Motor (GET /conectivos).
   * Actualiza el estado interno del Editor con la lista real.
   * Si el Motor no está disponible, mantiene el fallback estático.
   */
  async cargarConectivos(): Promise<void> {
    try {
      const conectivos = await this.motorClient.getConectivos();
      this.setState(actions.setConectivosDisponibles(this.state, conectivos));
    } catch {
      // Silencioso: el Editor ya tiene un fallback estático en KNOWN_CONNECTIVES
    }
  }

  /**
   * Ejecuta el flujo completo:
   *   1. Valida el estado.
   *   2. Genera MotorInput.
   *   3. Cambia a modo "ejecucion".
   *   4. Envía a POST /calcular.
   *   5. Almacena el MotorOutput en el estado.
   *   6. Retorna el resultado para que el Simulador lo consuma.
   *
   * Si la validación falla, NO envía al Motor y retorna errores.
   * Si el Motor falla, restaura el modo "edicion".
   */
  async ejecutar(): Promise<ControllerResult<import("../domain/editorTypes").MotorOutput>> {
    // ── Validar ──
    const validation = validarEstado(this.state);
    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }

    // ── Generar payload ──
    const payload = toMotorInput(this.state);

    // ── Cambiar a modo ejecución ──
    this.setState(actions.setModo(this.state, "ejecucion"));

    try {
      // ── Enviar al Motor ──
      const output = await this.motorClient.calcular(payload);

      // ── Almacenar resultado ──
      this.setState(actions.setMotorOutput(this.state, output));

      return { ok: true, data: output };
    } catch (err) {
      // ── Restaurar modo edición si el Motor falla ──
      this.setState(actions.setModo(this.state, "edicion"));
      const msg = err instanceof Error ? err.message : "Error desconocido al contactar el Motor.";
      return {
        ok: false,
        errors: [{ field: "motor", message: msg, severity: "error" }],
      };
    }
  }

  /** Vuelve al modo edición desde modo ejecución */
  volverAEdicion(): void {
    this.setState(actions.setModo(this.state, "edicion"));
    this.setState(actions.setMotorOutput(this.state, null));
  }
}