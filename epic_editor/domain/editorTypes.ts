/**
 * editorTypes.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Contratos de datos del Editor EPiC Playground.
 *
 * Este archivo define los tipos internos del Editor Y los tipos compatibles
 * con el Motor (schemas.py). La regla de oro es:
 *   - Los tipos "Editor*" son internos al Editor.
 *   - Los tipos que coinciden con schemas.py (ElementoIn, ConjuntoIn, etc.)
 *     son el contrato de salida hacia el Motor.
 *   - El Editor NUNCA importa lógica del Motor; solo conoce las formas de datos.
 *
 * Relación con el Motor:
 *   ElementoIn / ConjuntoIn / MotorInput / MotorOutput
 *   son réplicas exactas del contrato definido en epic_motor/models/schemas.py.
 *   Si schemas.py cambia, este archivo debe actualizarse también.
 *
 * Arcos dirigidos:
 *   EditorArc es una entidad INTERNA del Editor. No se envía directamente
 *   al Motor. El adaptador (editorToMotorInput.ts) es el responsable de
 *   traducir arcos a ElementoIn / ConjuntoIn válidos.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// Lógica de Belnap — valores canónicos
// ─────────────────────────────────────────────

/**
 * Los cuatro valores de la lógica de Belnap.
 * El Editor SIEMPRE usa estos valores canónicos al generar MotorInput.
 * El Motor acepta variantes (true/false/none/both), pero el Editor
 * debe normalizar a "V" | "F" | "N" | "B" antes de enviar.
 *
 * Significado semántico:
 *   V → solo evidencia positiva (verde)
 *   F → solo evidencia negativa (rojo)
 *   N → sin evidencia (gris) — valor por defecto
 *   B → evidencia positiva Y negativa simultánea (ámbar / contradicción)
 */
export type BelnapValue = "V" | "F" | "N" | "B";

/** Mapeo de color visual → BelnapValue evidencial (solo si el color representa lógica) */
export const COLOR_TO_BELNAP: Record<string, BelnapValue> = {
  verde:  "V",
  rojo:   "F",
  gris:   "N",
  ambar:  "B",
};

// ─────────────────────────────────────────────
// Conectivos válidos del Motor
// ─────────────────────────────────────────────

/**
 * Conectivos reconocidos por el Motor (connectives.py → REGISTRY).
 * El Editor usa esta lista para validar ConjuntoIn.conectivo.
 * El Editor NO implementa la lógica de ningún conectivo.
 * El conectivo por defecto es "PROPAGATION".
 */
export type MotorConnective =
  | "AND"
  | "OR"
  | "IMPLIES"
  | "BICONDITIONAL"
  | "PROPAGATION"
  | "CONTRAPOSITIONAL"
  | "KJOIN";

export const DEFAULT_CONNECTIVE: MotorConnective = "PROPAGATION";

/** Lista estática de fallback si GET /conectivos no está disponible */
export const KNOWN_CONNECTIVES: MotorConnective[] = [
  "AND", "OR", "IMPLIES", "BICONDITIONAL",
  "PROPAGATION", "CONTRAPOSITIONAL", "KJOIN",
];

// ─────────────────────────────────────────────
// Atributos visuales (datos, no renderizado)
// ─────────────────────────────────────────────

/**
 * Posición en el canvas lógico.
 * El Editor la almacena como dato; el Visualizador la usa para dibujar.
 */
export interface Posicion {
  x: number;
  y: number;
}

/**
 * Atributos visuales de un ElementoIn.
 * Son metadatos que el Editor gestiona como datos estructurales.
 * El Editor NO los renderiza directamente.
 */
export interface AtributosVisualesElemento {
  posicion: Posicion;
  /** Color visual (hex, nombre CSS o null). Puede diferir del valor lógico. */
  color: string | null;
  /** Tamaño del nodo. Metadato para el Visualizador. */
  tamano?: number;
  /** Alias visible al usuario (etiqueta). */
  alias?: string;
  /** Metadatos adicionales para extensión futura. */
  [key: string]: unknown;
}

/**
 * Atributos visuales de un ConjuntoIn.
 * Ídem: datos para el Visualizador, no renderizados por el Editor.
 */
export interface AtributosVisualesConjunto {
  radio: number;
  forma: string;   // "elipse", "rectangulo", etc.
  posicion: Posicion;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
// Contratos del Motor (réplica de schemas.py)
// ─────────────────────────────────────────────

/**
 * Elemento tal como lo recibe el Motor.
 * Réplica exacta de ElementoIn en schemas.py.
 *
 * Cada círculo, nodo o proposición visual del Editor debe poder
 * traducirse a esta estructura antes de enviar al Motor.
 */
export interface ElementoIn {
  id: string;
  valor_verdad: BelnapValue;
  pertenencia: string[];      // IDs de ConjuntoIn a los que pertenece
  proviene: string[];         // Trazabilidad de origen (puede estar vacío)
  atributos_visuales: AtributosVisualesElemento;
}

/**
 * Elemento con valor calculado por el Motor (solo en MotorOutput).
 * El Editor no produce ElementoOut; lo recibe como respuesta del Motor.
 */
export interface ElementoOut extends ElementoIn {
  valor_verdad_inicial: string;
}

/**
 * Conjunto / contenedor tal como lo recibe el Motor.
 * Réplica exacta de ConjuntoIn en schemas.py.
 *
 * Puede representar: agrupaciones visuales, contextos de propagación,
 * relaciones estructurales o entidades compuestas.
 */
export interface ConjuntoIn {
  id: string;
  subconjuntos: string[];         // IDs de otros ConjuntoIn anidados
  es_resultado_de: string | null; // Alias/renombramiento lógico ("Z")
  conectivo: MotorConnective;
  atributos_visuales: AtributosVisualesConjunto;
}

/**
 * Payload completo que el Editor envía al Motor vía POST /calcular.
 * Réplica exacta de MotorInput en schemas.py.
 */
export interface MotorInput {
  elementos: ElementoIn[];
  conjuntos: ConjuntoIn[];
  max_iteraciones: number; // 1..500, por defecto 100
}

/**
 * Respuesta del Motor tras calcular propagaciones.
 * El Editor la recibe pero no la interpreta semánticamente.
 * La interpretación semántica del resultado es responsabilidad del Simulador.
 */
export interface MotorOutput {
  elementos: ElementoOut[];
  conjuntos: ConjuntoIn[];
  acciones: Accion[];
  iteraciones_realizadas: number;
  estabilizado: boolean;
  resumen: Record<string, unknown>;
}

/**
 * Acción generada por el Motor durante la propagación.
 * Describe eventos como propagación, estabilización o cambio de nombre.
 * El Editor no genera Acciones; las recibe en MotorOutput.
 */
export interface Accion {
  paso: number;
  tipo_accion: string;
  elemento_id: string;
  origen?: string;
  destino?: string;
  valor_anterior?: string;
  valor_resultante: string;
  conectivo_usado?: string;
  descripcion: string;
}

// ─────────────────────────────────────────────
// Entidades internas del Editor
// ─────────────────────────────────────────────

/**
 * Arco dirigido — entidad INTERNA del Editor.
 *
 * El Motor NO recibe arcos directamente. Esta estructura existe solo
 * dentro del Editor para representar intenciones estructurales como:
 *   - relación entre dos elementos
 *   - implicación entre proposiciones
 *   - dependencia visual entre nodos
 *
 * Antes de llamar al Motor, el adaptador (editorToMotorInput.ts)
 * traduce cada arco a ElementoIn/ConjuntoIn válidos.
 *
 * Si el equipo decide no usar arcos internos, este tipo puede eliminarse
 * sin afectar el resto del Editor ni el contrato con el Motor.
 * El adaptador absorberá ese cambio de forma aislada.
 */
export interface EditorArc {
  id: string;
  origen: string;              // ID de ElementoIn origen
  destino: string;             // ID de ElementoIn destino
  conectivo: MotorConnective;  // Intención lógica del arco
  atributos_visuales: {
    color?: string;
    grosor?: number;
    [key: string]: unknown;
  };
}

// ─────────────────────────────────────────────
// Errores de validación estructurados
// ─────────────────────────────────────────────

/**
 * Error de validación estructurado que el Editor puede emitir.
 * Diseñado para ser útil para otros componentes o para la UI.
 */
export interface EditorValidationError {
  field: string;       // Ej: "elementos[0].pertenencia"
  message: string;     // Ej: "El conjunto C99 no existe"
  severity: "error" | "warning";
  entityId?: string;   // ID del elemento o conjunto afectado
}

/**
 * Resultado de una operación de validación del Editor.
 */
export interface ValidationResult {
  valid: boolean;
  errors: EditorValidationError[];
}