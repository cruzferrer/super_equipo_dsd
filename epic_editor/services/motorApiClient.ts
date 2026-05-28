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
    // 1. Map to Motor Python API format (dictionaries instead of arrays)
    const motorVariables: Record<string, any> = {};
    snapshot.logic.variables.forEach(v => {
      motorVariables[v.id] = {
        id: v.id,
        value: v.truth_value || "N"
      };
    });

    const motorSets: Record<string, any> = {};
    snapshot.logic.sets.forEach(s => {
      motorSets[s.id] = {
        id: s.id,
        elements: [] // not used by python engine but validated
      };
    });

    const motorRelations: Record<string, any> = {};
    snapshot.logic.relations.forEach(r => {
      motorRelations[r.id] = {
        id: r.id,
        source: r.from_variable,
        target: r.to_variable,
        connective: r.connective || "PROPAGATION",
        is_contrapositive: r.connective === "CONTRAPOSITIONAL"
      };
    });

    const motorPayload = {
      meta: {
        max_iterations: snapshot.meta.max_iterations || 100,
        version: "1.1"
      },
      logic: {
        variables: motorVariables,
        sets: motorSets,
        relations: motorRelations
      },
      visual: snapshot.visual || {}
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(motorPayload),
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

    // 2. Map back from Motor Python API format to TypeScript format
    const motorRes = body as any;
    
    // Reconstruct variables array
    const variables = snapshot.logic.variables.map(v => {
      const motorVar = motorRes.logic?.variables?.[v.id];
      return {
        ...v,
        truth_value: motorVar ? motorVar.value : v.truth_value
      };
    });

    // Reconstruct sets array
    const sets = snapshot.logic.sets;

    // Reconstruct relations array
    const relations = snapshot.logic.relations;

    // Reconstruct execution trace
    const motorTrace = motorRes.execution_trace || { actions: [], stabilized: true, total_iterations: 0 };
    const actions = (motorTrace.actions || []).map((act: any) => ({
      step: act.step,
      action_type: act.is_stabilized ? "stabilization" : "propagation",
      target_id: act.variable_id || act.target_id,
      result_value: act.new_value || act.result_value,
      description: act.description
    }));

    const execution_trace = {
      iterations: motorTrace.total_iterations ?? motorTrace.iterations ?? 0,
      stabilized: motorTrace.stabilized ?? false,
      actions: actions,
      final_logic: {
        variables: variables,
        sets: sets,
        relations: relations
      }
    };

    return {
      meta: snapshot.meta,
      logic: {
        variables,
        sets,
        relations
      },
      visual: snapshot.visual,
      execution_trace
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
