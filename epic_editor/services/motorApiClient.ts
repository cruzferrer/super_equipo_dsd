/**
 * motorApiClient.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Cliente HTTP del Motor EPiC Playground.
 *
 * Responsabilidad ÚNICA (SRP):
 *   Comunicarse con la API REST del Motor. Solo hace HTTP.
 *   No calcula, no valida estado del Editor, no renderiza.
 *
 * Endpoints que consume:
 *   GET  /health      → Verifica que el Motor esté activo.
 *   GET  /conectivos  → Lista los conectivos disponibles.
 *   POST /calcular    → Envía MotorInput y recibe MotorOutput.
 *
 * Manejo de errores:
 *   - Error 422: payload inválido según el Motor (Pydantic validation error).
 *   - Error 500: error interno del Motor.
 *   - Error de red: Motor no disponible.
 *   Todos se convierten en MotorApiError para que el controlador los maneje.
 *
 * Principio DIP:
 *   El EditorController depende de IMotorClient (interfaz), no de esta clase.
 *   En pruebas, MockMotorClient implementa la misma interfaz.
 *   Para cambiar la implementación HTTP (ej: WebSocket), se reemplaza esta
 *   clase sin tocar el controlador.
 *
 * Configuración:
 *   La URL base se pasa al constructor. Por defecto: http://localhost:8000.
 *   El Editor nunca hardcodea la URL en la lógica de negocio.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { MotorInput, MotorOutput } from "../domain/editorTypes";

// ─────────────────────────────────────────────
// Error tipado del cliente API
// ─────────────────────────────────────────────

/**
 * Error estructurado que el cliente lanza cuando la comunicación con el Motor falla.
 * El controlador puede distinguir por `statusCode` si fue un error del cliente (422)
 * o del servidor (500), o si el Motor no estaba disponible (0).
 */
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

// ─────────────────────────────────────────────
// Interfaz del cliente (para DIP y testabilidad)
// ─────────────────────────────────────────────

/**
 * IMotorClient — abstracción del cliente del Motor.
 *
 * El EditorController depende de esta interfaz, no de MotorApiClient.
 * Esto permite sustituir la implementación HTTP por un mock en pruebas
 * sin cambiar una línea del controlador (LSP + DIP).
 */
export interface IMotorClient {
  /** Verifica que el Motor esté activo. Retorna true si responde ok. */
  health(): Promise<boolean>;

  /** Retorna la lista de nombres de conectivos disponibles. */
  getConectivos(): Promise<string[]>;

  /**
   * Envía un MotorInput al Motor y retorna el MotorOutput con el estado
   * estabilizado y las acciones generadas.
   * Lanza MotorApiError si el Motor responde con error o no está disponible.
   */
  calcular(payload: MotorInput): Promise<MotorOutput>;
}

// ─────────────────────────────────────────────
// Implementación HTTP real
// ─────────────────────────────────────────────

/**
 * MotorApiClient — implementación HTTP del cliente del Motor.
 *
 * Usa fetch (disponible en Node ≥18 y en todos los browsers modernos).
 * Para environments sin fetch nativo, puede inyectarse una alternativa.
 */
export class MotorApiClient implements IMotorClient {
  private readonly baseUrl: string;

  /**
   * @param baseUrl URL base del Motor. Por defecto: http://localhost:8000
   */
  constructor(baseUrl = "http://localhost:8000") {
    // Eliminar barra final para consistencia en la construcción de URLs
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  // ── GET /health ──

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) return false;
      const data = await res.json();
      return data?.status === "ok";
    } catch {
      // Motor no disponible (error de red)
      return false;
    }
  }

  // ── GET /conectivos ──

  async getConectivos(): Promise<string[]> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/conectivos`);
    } catch (e) {
      throw new MotorApiError(0, "No se pudo conectar con el Motor.", e);
    }

    if (!res.ok) {
      const body = await this._tryParseBody(res);
      throw new MotorApiError(res.status, body?.detail ?? "Error al obtener conectivos.", body);
    }

    // El Motor retorna un objeto { "AND": {...}, "OR": {...}, ... }
    // El cliente extrae solo las claves (nombres de conectivos)
    const data = await res.json();
    return Object.keys(data);
  }

  // ── POST /calcular ──

  async calcular(payload: MotorInput): Promise<MotorOutput> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new MotorApiError(0, "No se pudo conectar con el Motor.", e);
    }

    const body = await this._tryParseBody(res);

    if (res.status === 422) {
      // Pydantic validation error — payload incompatible con schemas.py
      throw new MotorApiError(
        422,
        `El payload no es válido para el Motor: ${JSON.stringify(body?.detail ?? body)}`,
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
      throw new MotorApiError(res.status, `Respuesta inesperada del Motor.`, body);
    }

    return body as MotorOutput;
  }

  // ── Helper ──

  private async _tryParseBody(res: Response): Promise<any> {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
}

// ─────────────────────────────────────────────
// Mock del cliente (para pruebas y desarrollo)
// ─────────────────────────────────────────────

/**
 * MockMotorClient — implementación de IMotorClient para pruebas y desarrollo.
 *
 * No hace llamadas HTTP. Retorna respuestas predefinidas o configurables.
 * Permite probar el EditorController sin levantar el Motor.
 *
 * Ejemplo de uso en pruebas:
 *   const mock = new MockMotorClient({ healthOk: true });
 *   const controller = new EditorController(mock);
 */
export class MockMotorClient implements IMotorClient {
  private readonly config: {
    healthOk?: boolean;
    conectivos?: string[];
    calcularResponse?: MotorOutput | MotorApiError;
  };

  constructor(config: {
    healthOk?: boolean;
    conectivos?: string[];
    calcularResponse?: MotorOutput | MotorApiError;
  } = {}) {
    this.config = {
      healthOk: true,
      conectivos: ["AND", "OR", "IMPLIES", "BICONDITIONAL", "PROPAGATION", "CONTRAPOSITIONAL", "KJOIN"],
      ...config,
    };
  }

  async health(): Promise<boolean> {
    return this.config.healthOk ?? true;
  }

  async getConectivos(): Promise<string[]> {
    return this.config.conectivos ?? [];
  }

  async calcular(payload: MotorInput): Promise<MotorOutput> {
    if (this.config.calcularResponse instanceof MotorApiError) {
      throw this.config.calcularResponse;
    }
    if (this.config.calcularResponse) {
      return this.config.calcularResponse;
    }

    // Respuesta mínima válida por defecto (sin propagación real)
    const elementosOut = payload.elementos.map((el) => ({
      ...el,
      valor_verdad_inicial: el.valor_verdad,
    }));

    return {
      elementos: elementosOut,
      conjuntos: payload.conjuntos,
      acciones: [
        {
          paso: 1,
          tipo_accion: "estabilizacion",
          elemento_id: "*",
          valor_resultante: "*",
          descripcion: "Mock: sistema estabilizado en iteración 1.",
        },
      ],
      iteraciones_realizadas: 1,
      estabilizado: true,
      resumen: {
        total_elementos: payload.elementos.length,
        total_acciones: 1,
        distribucion_valores: { V: 0, F: 0, N: payload.elementos.length, B: 0 },
      },
    };
  }
}