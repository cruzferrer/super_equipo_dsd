/**
 * editorTypes.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Contratos de datos del Editor EPiC Playground.
 *
 * Este archivo define el nuevo contrato de salida del Editor hacia el Motor.
 *
 * Cambio principal del modelo:
 *   Antes:
 *     - El Editor generaba ElementoIn[] y ConjuntoIn[] para el Motor viejo.
 *
 *   Ahora:
 *     - El Editor genera un dominio compartido con:
 *       variables, ocurrencias, pares y arcos.
 *
 * Motivo del cambio:
 *   El profesor pidió que una misma variable pueda aparecer varias veces en
 *   distintas cajas/pares y que todas las apariciones con el mismo nombre
 *   compartan las mismas bolitas/evidencias.
 *
 * Regla central:
 *   - VariableLogica representa la entidad lógica real: p, q, r.
 *   - OcurrenciaVisual representa una aparición visual de esa variable.
 *   - Varias ocurrencias pueden apuntar a la misma variable mediante variable_id.
 *   - Las evidencias viven en la VariableLogica, no en cada ocurrencia.
 *
 * Ejemplo:
 *   occ_1.variable_id = "p"
 *   occ_3.variable_id = "p"
 *
 *   Ambas ocurrencias representan la misma variable lógica "p".
 *   Si p tiene evidencia verde, ambas deben actuar como p con evidencia verde.
 *
 * El Editor NO calcula propagaciones.
 * El Editor NO renderiza directamente.
 * El Editor solo mantiene y exporta la estructura editable del dominio.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// Lógica de Belnap — valores canónicos
// ─────────────────────────────────────────────

/**
 * Los cuatro valores de la lógica de Belnap.
 *
 * V → evidencia positiva / verdad
 * F → evidencia negativa / falsedad
 * N → ninguna evidencia
 * B → ambas evidencias / contradicción
 */
export type BelnapValue = "V" | "F" | "N" | "B";

/**
 * Evidencias o "bolitas" que el usuario puede asignar.
 *
 * La evidencia vive en la variable lógica, no en la ocurrencia visual.
 * Esto permite que todas las ocurrencias con el mismo variable_id compartan
 * las mismas bolitas.
 */
export type Evidencia = "verde" | "roja";

/**
 * Lista fija del dominio de valores usado por el proyecto.
 * Se incluye en la salida del Editor para que el Motor conozca el dominio lógico.
 */
export const DOMINIO_VALORES: BelnapValue[] = ["V", "F", "N", "B"];

/**
 * Convierte un conjunto de evidencias al valor de Belnap correspondiente.
 *
 * []                  → N
 * ["verde"]           → V
 * ["roja"]            → F
 * ["verde", "roja"]   → B
 */
export function evidenciasToBelnap(evidencias: Evidencia[]): BelnapValue {
  const tieneVerde = evidencias.includes("verde");
  const tieneRoja = evidencias.includes("roja");

  if (tieneVerde && tieneRoja) return "B";
  if (tieneVerde) return "V";
  if (tieneRoja) return "F";
  return "N";
}

// ─────────────────────────────────────────────
// Conectivos válidos
// ─────────────────────────────────────────────

/**
 * Conectivos reconocidos por el Motor según el código existente del Motor.
 *
 * Estos nombres vienen del REGISTRY en connectives.py:
 *   AND, OR, IMPLIES, BICONDITIONAL, PROPAGATION,
 *   CONTRAPOSITIONAL, KJOIN.
 *
 * El Editor no implementa la lógica de estos conectivos.
 * Solo los registra como parte de arcos o relaciones.
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

export const KNOWN_CONNECTIVES: MotorConnective[] = [
  "AND",
  "OR",
  "IMPLIES",
  "BICONDITIONAL",
  "PROPAGATION",
  "CONTRAPOSITIONAL",
  "KJOIN",
];

// ─────────────────────────────────────────────
// Estado general del sistema
// ─────────────────────────────────────────────

/**
 * Modo general del sistema.
 *
 * edicion:
 *   El usuario está construyendo/modificando el dominio.
 *
 * ejecucion:
 *   El dominio se envió o está listo para enviarse al Motor.
 */
export type EstadoSistema = "edicion" | "ejecucion";

// ─────────────────────────────────────────────
// Atributos visuales mínimos
// ─────────────────────────────────────────────

/**
 * Posición visual mínima.
 *
 * El Editor guarda coordenadas porque el usuario puede colocar dibujitos
 * en diferentes partes de la superficie de edición.
 *
 * El Editor no decide cómo se renderiza.
 * El Visualizador decide la forma, color exacto, estilos y tamaños.
 */
export interface AtributosVisualesBasicos {
  x: number;
  y: number;
}

// ─────────────────────────────────────────────
// Nuevo modelo del Dominio Compartido
// ─────────────────────────────────────────────

/**
 * VariableLogica
 * ─────────────────────────────────────────────
 * Representa una variable lógica real del sistema.
 *
 * Ejemplos:
 *   p
 *   q
 *   r
 *
 * Esta entidad guarda el valor lógico y las evidencias.
 * Si la variable "p" aparece en varias ocurrencias visuales, todas apuntan
 * a esta misma VariableLogica mediante variable_id: "p".
 */
export interface VariableLogica {
  /**
   * Nombre lógico de la variable.
   * Ejemplo: "p", "q", "r".
   */
  id: string;

  /**
   * Valor lógico actual de la variable.
   * Debe coincidir con las evidencias.
   *
   * []                  → N
   * ["verde"]           → V
   * ["roja"]            → F
   * ["verde", "roja"]   → B
   */
  valor_actual: BelnapValue;

  /**
   * Bolitas/evidencias asignadas a la variable.
   * Al vivir aquí, todas las ocurrencias de la misma variable comparten
   * las mismas bolitas.
   */
  evidencias: Evidencia[];

  /**
   * Nombre alternativo o explicación opcional.
   *
   * Ejemplo:
   *   id: "z"
   *   alias: "p_implica_q"
   *
   * Si no se usa, va en null.
   */
  alias: string | null;
}

/**
 * OcurrenciaVisual
 * ─────────────────────────────────────────────
 * Representa una aparición visual de una variable dentro de un par/caja.
 *
 * Ejemplo:
 *   occ_1 aparece en par_1 y representa a p.
 *   occ_3 aparece en par_2 y también representa a p.
 *
 * Ambas son ocurrencias distintas, pero apuntan a la misma variable lógica.
 */
export interface OcurrenciaVisual {
  /**
   * Identificador único de la ocurrencia visual.
   * Ejemplo: "occ_1".
   */
  id: string;

  /**
   * ID de la VariableLogica que representa esta ocurrencia.
   * Ejemplo: "p".
   */
  variable_id: string;

  /**
   * ID del par/caja donde aparece esta ocurrencia.
   * Ejemplo: "par_1".
   */
  par_id: string;

  /**
   * Posición de esta aparición visual.
   * El Visualizador decide cómo dibujarla.
   */
  atributos_visuales: AtributosVisualesBasicos;
}

/**
 * ParVisual
 * ─────────────────────────────────────────────
 * Representa una caja/par que agrupa ocurrencias.
 *
 * Según lo mencionado por el profesor, las expresiones pueden mostrarse
 * en cajas de pares. Por eso esta entidad conserva qué ocurrencias están
 * dentro de cada par.
 */
export interface ParVisual {
  /**
   * Identificador único del par/caja.
   * Ejemplo: "par_1".
   */
  id: string;

  /**
   * Lista de ocurrencias contenidas en este par.
   * Ejemplo: ["occ_1", "occ_2"].
   */
  ocurrencias: string[];

  /**
   * Posición visual mínima del par/caja.
   * El Visualizador decide cómo dibujar la caja.
   */
  atributos_visuales: AtributosVisualesBasicos;
}

/**
 * EditorArc
 * ─────────────────────────────────────────────
 * Representa un arco dirigido entre dos ocurrencias.
 *
 * El arco conserva dos niveles de información:
 *
 * 1. Nivel visual:
 *    origen_ocurrencia y destino_ocurrencia indican qué dibujitos conecta.
 *
 * 2. Nivel lógico:
 *    origen_variable y destino_variable indican qué variables conecta.
 *
 * Ejemplo:
 *   occ_1 representa p
 *   occ_2 representa q
 *
 *   arco a1:
 *     origen_ocurrencia: occ_1
 *     destino_ocurrencia: occ_2
 *     origen_variable: p
 *     destino_variable: q
 *     conectivo: IMPLIES
 *
 * Esto representa p → q.
 */
export interface EditorArc {
  id: string;

  /**
   * Ocurrencia visual desde donde sale el arco.
   */
  origen_ocurrencia: string;

  /**
   * Ocurrencia visual hacia donde llega el arco.
   */
  destino_ocurrencia: string;

  /**
   * Variable lógica de origen.
   * Debe coincidir con variable_id de origen_ocurrencia.
   */
  origen_variable: string;

  /**
   * Variable lógica de destino.
   * Debe coincidir con variable_id de destino_ocurrencia.
   */
  destino_variable: string;

  /**
   * Conectivo asociado a la relación.
   * Ejemplo: IMPLIES para p → q.
   */
  conectivo: MotorConnective;
}

/**
 * DominioCompartido
 * ─────────────────────────────────────────────
 * Estado estructural central producido por el Editor.
 *
 * Contiene:
 *   - variables: entidades lógicas reales.
 *   - ocurrencias: apariciones visuales de variables.
 *   - pares: cajas que agrupan ocurrencias.
 *   - arcos: relaciones dirigidas entre ocurrencias/variables.
 */
export interface DominioCompartido {
  variables: VariableLogica[];
  ocurrencias: OcurrenciaVisual[];
  pares: ParVisual[];
  arcos: EditorArc[];
}

/**
 * MotorInputV2
 * ─────────────────────────────────────────────
 * Nueva salida completa del Editor hacia el Motor.
 *
 * Se llama MotorInputV2 porque sigue siendo la entrada que recibirá el Motor,
 * pero ya no usa el contrato viejo de:
 *
 *   elementos + conjuntos + max_iteraciones
 *
 * Ahora usa:
 *
 *   variables + ocurrencias + pares + arcos
 *
 * Esto permite representar variables repetidas visualmente sin duplicar
 * su estado lógico.
 */
export interface MotorInputV2 {
  proyecto: "EPIC Playground PoC";
  version: "2.0";
  estado_sistema: EstadoSistema;
  dominio_valores: BelnapValue[];
  dominio_compartido: DominioCompartido;
}

// ─────────────────────────────────────────────
// Respuesta del Motor
// ─────────────────────────────────────────────

/**
 * MotorOutput
 * ─────────────────────────────────────────────
 * Respuesta del Motor.
 *
 * Como el equipo del Motor se va a adaptar al nuevo contrato, dejamos esta
 * estructura flexible temporalmente.
 *
 * Cuando el equipo del Motor defina su salida exacta, este tipo debe hacerse
 * más específico.
 */
export interface MotorOutput {
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
// Errores de validación estructurados
// ─────────────────────────────────────────────

/**
 * Error de validación estructurado que el Editor puede emitir.
 * Diseñado para ser útil para otros componentes o para la UI.
 */
export interface EditorValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  entityId?: string;
}

/**
 * Resultado de una operación de validación del Editor.
 */
export interface ValidationResult {
  valid: boolean;
  errors: EditorValidationError[];
}