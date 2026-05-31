/*
Creacion de todo el archivo motorApiClient.ts utilizando Gemini, prompt utilizado:
Con el anterior contexto de la conversacion y tomando en cuenta los cambios utilizados por el profesor,
realiza el motorApiClient.ts, Solo cambiaremos los tipos que entran y salen. 
Enviaremos el PlaygroundSnapshot y recibiremos el PlaygroundSnapshot + execution_trace.
le mandamos el PlaygroundSnapshot completo y exigimos que nos devuelva exactamente el mismo PlaygroundSnapshot, pero con el bloque execution_trace anexado.
El Motor puede leer el JSON, ignorar la llave visual, procesar la llave logic, y adjuntar la respuesta. Nosotros recibimos eso y lo mandamos directo al estado global.
*/
import type {
  PlaygroundSnapshot,
  MotorConnective,
} from "../domain/editorTypes";

export class MotorApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly detail: string,
    public readonly raw?: unknown,
  ) {
    super(`MotorApiError [${statusCode}]: ${detail}`);
    this.name = "MotorApiError";
  }
}

export interface IMotorClient {
  health(): Promise<boolean>;
  getConectivos(): Promise<MotorConnective[]>;
  calcular(snapshot: PlaygroundSnapshot): Promise<PlaygroundSnapshot>;
}

export class MotorApiClient implements IMotorClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://localhost:8000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) return false;
      const data = await res.json();
      return data?.status === "ok";
    } catch {
      return false;
    }
  }

  async getConectivos(): Promise<MotorConnective[]> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/conectivos`);
    } catch (e) {
      throw new MotorApiError(0, "No se pudo conectar con el Motor.", e);
    }

    if (!res.ok) {
      const body = await this._tryParseBody(res);
      throw new MotorApiError(
        res.status,
        body?.detail ?? "Error al obtener conectivos.",
        body,
      );
    }

    const data = await res.json();
    return Object.keys(data);
  }

  async calcular(snapshot: PlaygroundSnapshot): Promise<PlaygroundSnapshot> {
    // Convertir arrays a diccionarios para el motor Python
    const motorSnapshot = this._convertToMotorFormat(snapshot);
    
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(motorSnapshot),
      });
    } catch (e) {
      throw new MotorApiError(0, "No se pudo conectar con el Motor.", e);
    }

    const body = await this._tryParseBody(res);

    if (res.status === 422) {
      throw new MotorApiError(
        422,
        `El Motor rechazó el snapshot: ${JSON.stringify(body?.detail ?? body)}`,
        body,
      );
    }

    if (res.status === 500) {
      throw new MotorApiError(
        500,
        `Error interno del Motor: ${body?.detail ?? "sin detalle"}`,
        body,
      );
    }

    if (!res.ok) {
      throw new MotorApiError(
        res.status,
        `Respuesta inesperada del Motor.`,
        body,
      );
    }

    // Convertir la respuesta del motor (diccionarios) de vuelta a arrays
    return this._convertFromMotorFormat(body);
  }

  /**
   * Convierte el formato del Editor (arrays) al formato del Motor (diccionarios)
   */
  private _convertToMotorFormat(snapshot: PlaygroundSnapshot): any {
    const motorLogic: any = {
      variables: {},
      sets: {},
      relations: {}
    };

    // Convertir arrays a diccionarios usando el id como clave
    snapshot.logic.variables.forEach(v => {
      motorLogic.variables[v.id] = {
        id: v.id,
        value: v.truth_value || "N"
      };
    });

    snapshot.logic.sets.forEach(s => {
      motorLogic.sets[s.id] = {
        id: s.id,
        elements: s.subsets || []
      };
    });

    snapshot.logic.relations.forEach(r => {
      motorLogic.relations[r.id] = {
        id: r.id,
        source: r.from_variable,
        target: r.to_variable,
        connective: r.connective || "PROPAGATION",
        is_contrapositive: false
      };
    });

    return {
      meta: {
        max_iterations: snapshot.meta.max_iterations || 100,
        version: "1.1"
      },
      logic: motorLogic,
      visual: snapshot.visual || {},
      execution_trace: snapshot.execution_trace || null
    };
  }

  /**
   * Convierte el formato del Motor (diccionarios) de vuelta al formato del Editor (arrays)
   */
  private _convertFromMotorFormat(motorSnapshot: any): PlaygroundSnapshot {
    const logic: any = {
      variables: [],
      sets: [],
      relations: []
    };

    // Convertir diccionarios a arrays
    if (motorSnapshot.logic?.variables) {
      logic.variables = Object.values(motorSnapshot.logic.variables).map((v: any) => ({
        id: v.id,
        truth_value: v.value || "N",
        memberships: []
      }));
    }

    if (motorSnapshot.logic?.sets) {
      logic.sets = Object.values(motorSnapshot.logic.sets).map((s: any) => ({
        id: s.id,
        connective: "PROPAGATION",
        subsets: s.elements || [],
        result_alias: null
      }));
    }

    if (motorSnapshot.logic?.relations) {
      logic.relations = Object.values(motorSnapshot.logic.relations).map((r: any) => ({
        id: r.id,
        from_variable: r.source,
        to_variable: r.target,
        connective: r.connective || "PROPAGATION"
      }));
    }

    return {
      meta: {
        schema_version: "1.0",
        editor_mode: "ejecucion",
        belnap_domain: ["V", "F", "N", "B"],
        max_iterations: motorSnapshot.meta?.max_iterations || 100
      },
      logic,
      visual: motorSnapshot.visual || {},
      execution_trace: motorSnapshot.execution_trace
    };
  }

  private async _tryParseBody(res: Response): Promise<any> {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
}

export class MockMotorClient implements IMotorClient {
  private readonly config: {
    healthOk?: boolean;
    conectivos?: MotorConnective[];
    calcularResponse?: PlaygroundSnapshot | MotorApiError;
  };

  constructor(
    config: {
      healthOk?: boolean;
      conectivos?: MotorConnective[];
      calcularResponse?: PlaygroundSnapshot | MotorApiError;
    } = {},
  ) {
    this.config = {
      healthOk: true,
      conectivos: [
        "AND",
        "OR",
        "IMPLIES",
        "BICONDITIONAL",
        "PROPAGATION",
        "CONTRAPOSITIONAL",
        "KJOIN",
      ],
      ...config,
    };
  }

  async health(): Promise<boolean> {
    return this.config.healthOk ?? true;
  }

  async getConectivos(): Promise<MotorConnective[]> {
    return this.config.conectivos ?? [];
  }

  async calcular(snapshot: PlaygroundSnapshot): Promise<PlaygroundSnapshot> {
    if (this.config.calcularResponse instanceof MotorApiError) {
      throw this.config.calcularResponse;
    }
    if (this.config.calcularResponse) {
      return this.config.calcularResponse;
    }

    return {
      ...snapshot,
      execution_trace: {
        iterations: 1,
        stabilized: true,
        actions: [
          {
            step: 1,
            action_type: "stabilization",
            target_id: "*",
            result_value: "*",
            description: "Mock: sistema estabilizado simulado.",
          },
        ],
        final_logic: snapshot.logic,
      },
    };
  }
}
