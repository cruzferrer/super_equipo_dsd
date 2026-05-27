/*
Creacion de todo el archivo editorController.ts utilizando Gemini, prompt utilizado:
Con el anterior contexto de la conversacion y tomando en cuenta los cambios utilizados por el profesor,
realiza primero el editorController.ts, siendo este el cerebro del sistema:
coordina el estado, valida que no haya basura y se comunica con el Motor usando el nuevo estándar.
*/
import type {
  PlaygroundSnapshot,
  BelnapValue,
  MotorConnective,
  ValidationResult,
  ExecutionTrace,
} from "../domain/editorTypes";
import { createInitialState } from "../domain/editorState";
import type { EditorState } from "../domain/editorState";
import * as actions from "../domain/editorActions";
import { validarSnapshot } from "../validators/editorValidation";
import type { IMotorClient } from "../services/motorApiClient";
import { MotorApiClient } from "../services/motorApiClient";

export type ControllerResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; errors: ValidationResult["errors"] };

export class EditorController {
  private state: EditorState;
  private readonly motorClient: IMotorClient;
  private readonly subscribers: Array<(state: EditorState) => void> = [];

  constructor(motorClient?: IMotorClient) {
    this.state = createInitialState();
    this.motorClient = motorClient ?? new MotorApiClient();
  }

  subscribe(cb: (state: EditorState) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      const idx = this.subscribers.indexOf(cb);
      if (idx >= 0) this.subscribers.splice(idx, 1);
    };
  }

  getState(): Readonly<EditorState> {
    return this.state;
  }

  private setState(newState: EditorState): void {
    this.state = newState;
    this.subscribers.forEach((cb) => cb(this.state));
  }

  crearVariable(id: string, valor: BelnapValue = "N"): ControllerResult {
    if (this.state.snapshot.logic.variables.some((v) => v.id === id)) {
      return {
        ok: false,
        errors: [
          {
            field: "logic.variables",
            message: "ID de variable duplicado.",
            severity: "error",
            entityId: id,
          },
        ],
      };
    }
    this.setState(actions.crearVariableLogica(this.state, id, valor));
    return { ok: true, data: undefined };
  }

  eliminarVariable(id: string): ControllerResult {
    this.setState(actions.eliminarVariableLogica(this.state, id));
    return { ok: true, data: undefined };
  }

  dibujarInstancia(
    instance_id: string,
    variable_id: string,
    x: number,
    y: number,
  ): ControllerResult {
    if (this.state.snapshot.visual.instances[instance_id]) {
      return {
        ok: false,
        errors: [
          {
            field: "visual.instances",
            message: "ID de instancia duplicado.",
            severity: "error",
            entityId: instance_id,
          },
        ],
      };
    }
    this.setState(
      actions.crearInstanciaVisual(this.state, instance_id, variable_id, x, y),
    );
    return { ok: true, data: undefined };
  }

  eliminarInstancia(instance_id: string): ControllerResult {
    this.setState(actions.eliminarInstanciaVisual(this.state, instance_id));
    return { ok: true, data: undefined };
  }

  crearContexto(
    id: string,
    connective: MotorConnective,
    x: number,
    y: number,
  ): ControllerResult {
    this.setState(actions.crearContexto(this.state, id, connective, x, y));
    return { ok: true, data: undefined };
  }

  eliminarContexto(id: string): ControllerResult {
    this.setState(actions.eliminarContexto(this.state, id));
    return { ok: true, data: undefined };
  }

  conectar(
    id: string,
    from: string,
    to: string,
    connective: MotorConnective,
  ): ControllerResult {
    this.setState(actions.crearRelacion(this.state, id, from, to, connective));
    return { ok: true, data: undefined };
  }

  async cargarConectivos(): Promise<void> {
    try {
      const conectivos = await this.motorClient.getConectivos();
      this.setState({ ...this.state, available_connectives: conectivos });
    } catch (e) {
      console.error(e);
    }
  }

  validar(): ValidationResult {
    return validarSnapshot(
      this.state.snapshot,
      this.state.available_connectives,
    );
  }

  async ejecutar(): Promise<ControllerResult<ExecutionTrace>> {
    const validation = this.validar();
    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }

    try {
      const resultSnapshot = await this.motorClient.calcular(
        this.state.snapshot,
      );

      this.setState(
        actions.guardarResultadoEjecucion(
          this.state,
          resultSnapshot.execution_trace,
        ),
      );

      if (!resultSnapshot.execution_trace) {
        return {
          ok: false,
          errors: [
            {
              field: "motor",
              message: "El motor no devolvió un rastro de ejecución.",
              severity: "error",
            },
          ],
        };
      }

      return { ok: true, data: resultSnapshot.execution_trace };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error de red con el Motor.";
      return {
        ok: false,
        errors: [{ field: "motor", message: msg, severity: "error" }],
      };
    }
  }

  regresarAEdicion(): void {
    this.setState(actions.guardarResultadoEjecucion(this.state, undefined));
  }
}
