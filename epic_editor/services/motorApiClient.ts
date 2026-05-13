/**
 * motorApiClient.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Cliente HTTP para comunicarse con el Motor EPiC Playground.
 *
 * Responsabilidad:
 *   - Consultar si el Motor está activo.
 *   - Consultar conectivos disponibles.
 *   - Enviar el nuevo MotorInputV2 al Motor.
 *
 * Este archivo NO:
 *   - modifica el estado del Editor;
 *   - valida el dominio;
 *   - calcula propagaciones;
 *   - interpreta semánticamente el resultado;
 *   - renderiza nada.
 *
 * Cambio principal:
 *   Antes `calcular()` recibía:
 *
 *     {
 *       elementos: [],
 *       conjuntos: [],
 *       max_iteraciones: 100
 *     }
 *
 *   Ahora recibe MotorInputV2:
 *
 *     {
 *       proyecto,
 *       version,
 *       estado_sistema,
 *       dominio_valores,
 *       dominio_compartido: {
 *         variables,
 *         ocurrencias,
 *         pares,
 *         arcos
 *       }
 *     }
 * ──────────────────────────────────────────────────────────────────────────
 */

import type {
  MotorConnective,
  MotorInputV2,
  MotorOutput,
} from "../domain/editorTypes";

// ─────────────────────────────────────────────
// Error especializado del cliente del Motor
// ─────────────────────────────────────────────

/**
 * MotorApiError
 * ─────────────────────────────────────────────
 * Error controlado para fallos de comunicación con el Motor.
 *
 * Permite distinguir errores HTTP o de red de otros errores internos.
 */
export class MotorApiError extends Error {
  public readonly status?: number;
  public readonly detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = "MotorApiError";
    this.status = status;
    this.detail = detail;
  }
}

// ─────────────────────────────────────────────
// Interfaz del cliente
// ─────────────────────────────────────────────

/**
 * IMotorClient
 * ─────────────────────────────────────────────
 * Abstracción del cliente del Motor.
 *
 * El EditorController depende de esta interfaz y no de una implementación
 * concreta. Esto permite usar:
 *
 *   - MotorApiClient para integración real;
 *   - MockMotorClient para pruebas.
 */
export interface IMotorClient {
  health(): Promise<boolean>;
  listarConectivos(): Promise<MotorConnective[]>;
  calcular(payload: MotorInputV2): Promise<MotorOutput>;
}

// ─────────────────────────────────────────────
// Cliente HTTP real
// ─────────────────────────────────────────────

/**
 * MotorApiClient
 * ─────────────────────────────────────────────
 * Implementación real vía HTTP usando fetch.
 */
export class MotorApiClient implements IMotorClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://localhost:8000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Verifica si el Motor está disponible.
   *
   * Espera que el Motor responda correctamente en GET /health.
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la lista de conectivos disponibles desde el Motor.
   *
   * El Motor anterior devolvía un objeto con los conectivos como llaves.
   * Por eso aquí soportamos esa estructura.
   */
  async listarConectivos(): Promise<MotorConnective[]> {
    const response = await fetch(`${this.baseUrl}/conectivos`);

    if (!response.ok) {
      throw new MotorApiError(
        "No se pudieron cargar los conectivos del Motor.",
        response.status,
        await safeReadJson(response),
      );
    }

    const data = await response.json();

    /**
     * Estructura esperada del Motor actual:
     *
     * {
     *   "AND": { ... },
     *   "OR": { ... },
     *   "IMPLIES": { ... }
     * }
     */
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return Object.keys(data) as MotorConnective[];
    }

    /**
     * Si en el futuro el Motor devuelve directamente un arreglo:
     *
     * ["AND", "OR", "IMPLIES"]
     */
    if (Array.isArray(data)) {
      return data as MotorConnective[];
    }

    throw new MotorApiError(
      "La respuesta de /conectivos no tiene un formato reconocido.",
    );
  }

  /**
   * Envía el nuevo MotorInputV2 al Motor.
   *
   * Endpoint esperado:
   *   POST /calcular
   *
   * El equipo del Motor se adaptará a este nuevo contrato.
   */
  async calcular(payload: MotorInputV2): Promise<MotorOutput> {
    const response = await fetch(`${this.baseUrl}/calcular`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await safeReadJson(response);

    if (!response.ok) {
      throw new MotorApiError(
        "El Motor rechazó el dominio enviado por el Editor.",
        response.status,
        data,
      );
    }

    return data as MotorOutput;
  }
}

// ─────────────────────────────────────────────
// Mock para pruebas
// ─────────────────────────────────────────────

/**
 * MockMotorClient
 * ─────────────────────────────────────────────
 * Cliente simulado para pruebas del Editor.
 *
 * No calcula propagaciones reales.
 * Solo confirma que el Editor puede:
 *   - consultar health;
 *   - cargar conectivos;
 *   - enviar MotorInputV2;
 *   - recibir una respuesta.
 */
export class MockMotorClient implements IMotorClient {
  private readonly available: boolean;
  private readonly shouldFailOnCalcular: boolean;
  public readonly receivedPayloads: MotorInputV2[] = [];

  constructor(options?: {
    available?: boolean;
    shouldFailOnCalcular?: boolean;
  }) {
    this.available = options?.available ?? true;
    this.shouldFailOnCalcular = options?.shouldFailOnCalcular ?? false;
  }

  async health(): Promise<boolean> {
    return this.available;
  }

  async listarConectivos(): Promise<MotorConnective[]> {
    return [
      "AND",
      "OR",
      "IMPLIES",
      "BICONDITIONAL",
      "PROPAGATION",
      "CONTRAPOSITIONAL",
      "KJOIN",
    ];
  }

  async calcular(payload: MotorInputV2): Promise<MotorOutput> {
    this.receivedPayloads.push(payload);

    if (this.shouldFailOnCalcular) {
      throw new MotorApiError("Error simulado del Motor.", 500, {
        detail: "Fallo simulado en MockMotorClient.",
      });
    }

    /**
     * Respuesta flexible mientras el equipo del Motor define su salida nueva.
     */
    return {
      estabilizado: true,
      entrada_recibida: payload,
      resumen: {
        total_variables: payload.dominio_compartido.variables.length,
        total_ocurrencias: payload.dominio_compartido.ocurrencias.length,
        total_pares: payload.dominio_compartido.pares.length,
        total_arcos: payload.dominio_compartido.arcos.length,
      },
    };
  }
}

// ─────────────────────────────────────────────
// Utilidad interna
// ─────────────────────────────────────────────

/**
 * Lee JSON de forma segura.
 *
 * Si la respuesta no tiene cuerpo JSON válido, regresa null en lugar de
 * lanzar un error adicional.
 */
async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}