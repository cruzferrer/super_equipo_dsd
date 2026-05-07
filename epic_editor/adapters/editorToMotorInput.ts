/**
 * editorToMotorInput.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Adaptador: EditorState → MotorInput
 *
 * Responsabilidad ÚNICA (SRP):
 *   Transformar el estado interno del Editor en un MotorInput compatible
 *   con el contrato real del Motor (schemas.py).
 *
 * Este adaptador es la ÚNICA pieza que conoce tanto el EditorState como
 * el formato del MotorInput. Nadie más debe hacer esa traducción.
 *
 * Estrategia de traducción de arcos internos (OCP):
 *   Si el Editor tiene arcos internos (EditorArc), este adaptador los
 *   traduce a ConjuntoIn según la estrategia ARC_STRATEGY.
 *
 *   La estrategia está desacoplada: para cambiarla, se reemplaza
 *   `arcToConjunto` sin tocar el resto del adaptador ni del Editor.
 *
 *   Estrategia actual: "arco como conjunto implícito"
 *     - Cada arco p → q genera un ConjuntoIn con el conectivo del arco.
 *     - El elemento origen se agrega a ese conjunto.
 *     - El elemento destino también se agrega a ese conjunto.
 *     - La evidencia fluye del origen al destino vía el Motor.
 *
 *   Si el equipo decide no usar arcos internos:
 *     - Eliminar las líneas de `translateArcs` en `toMotorInput`.
 *     - El resto del adaptador sigue funcionando sin cambios.
 *
 * Lo que este adaptador NO hace:
 *   - No calcula propagaciones.
 *   - No aplica conectivos.
 *   - No renderiza nada.
 *   - No valida el estado (eso es responsabilidad de editorValidation.ts).
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { EditorState } from "../domain/editorState";
import type {
  ElementoIn,
  ConjuntoIn,
  MotorInput,
  EditorArc,
} from "../domain/editorTypes";

// ─────────────────────────────────────────────
// Estrategia de traducción de arcos
// ─────────────────────────────────────────────

/**
 * ArcTranslationResult — resultado de traducir un arco a estructuras del Motor.
 *
 * Un arco puede generar:
 *   - Nuevos ConjuntoIn (el arco se convierte en un contexto de propagación).
 *   - Modificaciones de pertenencia en ElementoIn existentes.
 */
interface ArcTranslationResult {
  conjuntoGenerado: ConjuntoIn;
  /** IDs de elementos que deben añadirse al conjunto generado */
  elementosAfectados: string[];
}

/**
 * Traduce un EditorArc a un ConjuntoIn implícito.
 *
 * Estrategia actual ("arco como conjunto implícito"):
 *   arco { origen: "p", destino: "q", conectivo: "IMPLIES" }
 *   →
 *   ConjuntoIn {
 *     id: "arc_p_q",
 *     conectivo: "IMPLIES",
 *     subconjuntos: [],
 *     es_resultado_de: null,
 *     atributos_visuales: { radio: 40, forma: "flecha", posicion: { x: 0, y: 0 } }
 *   }
 *   + elementos p y q pertenecen al conjunto "arc_p_q"
 *
 * Esta función es la ÚNICA que debe cambiar si la estrategia de arcos cambia.
 */
function arcToConjunto(arc: EditorArc): ArcTranslationResult {
  const conjuntoId = `arc_${arc.origen}_${arc.destino}`;

  const conjuntoGenerado: ConjuntoIn = {
    id: conjuntoId,
    subconjuntos: [],
    es_resultado_de: null,
    conectivo: arc.conectivo,
    atributos_visuales: {
      radio: 40,
      // "flecha" es una forma semántica para el Visualizador; no la renderiza el Editor
      forma: "flecha",
      posicion: { x: 0, y: 0 },
      // Preservar color del arco como metadato visual
      color: arc.atributos_visuales.color ?? "#333333",
    },
  };

  return {
    conjuntoGenerado,
    elementosAfectados: [arc.origen, arc.destino],
  };
}

/**
 * Traduce todos los arcos internos del Editor a ConjuntoIn implícitos y
 * actualiza las pertenencias de los ElementoIn correspondientes.
 *
 * Retorna:
 *   - conjuntosAdicionales: nuevos ConjuntoIn generados por los arcos.
 *   - pertenenciasExtra: mapa elementoId → conjuntoIds a agregar.
 */
function translateArcs(
  arcos: EditorState["arcos"],
): {
  conjuntosAdicionales: ConjuntoIn[];
  pertenenciasExtra: Record<string, string[]>;
} {
  const conjuntosAdicionales: ConjuntoIn[] = [];
  const pertenenciasExtra: Record<string, string[]> = {};

  for (const arc of Object.values(arcos)) {
    const { conjuntoGenerado, elementosAfectados } = arcToConjunto(arc);
    conjuntosAdicionales.push(conjuntoGenerado);

    for (const eid of elementosAfectados) {
      if (!pertenenciasExtra[eid]) pertenenciasExtra[eid] = [];
      if (!pertenenciasExtra[eid].includes(conjuntoGenerado.id)) {
        pertenenciasExtra[eid].push(conjuntoGenerado.id);
      }
    }
  }

  return { conjuntosAdicionales, pertenenciasExtra };
}

// ─────────────────────────────────────────────
// Función principal del adaptador
// ─────────────────────────────────────────────

/**
 * Convierte el EditorState completo a un MotorInput listo para enviarse
 * a POST /calcular.
 *
 * Flujo:
 *   1. Copiar elementos y conjuntos del estado actual.
 *   2. Si existen arcos internos, traducirlos y añadir conjuntos implícitos.
 *   3. Actualizar pertenencias de elementos afectados por arcos.
 *   4. Construir y retornar MotorInput.
 *
 * Precondición: el EditorState ya fue validado (validarEstado retornó valid: true).
 * Esta función no lanza errores de validación; asume que el estado es correcto.
 */
export function toMotorInput(state: EditorState): MotorInput {
  // ── 1. Copia base de elementos y conjuntos ──
  const elementosBase: ElementoIn[] = Object.values(state.elementos).map((el) => ({
    ...el,
    pertenencia: [...el.pertenencia],
    proviene: [...el.proviene],
    atributos_visuales: {
      ...el.atributos_visuales,
      posicion: { ...el.atributos_visuales.posicion },
    },
  }));

  const conjuntosBase: ConjuntoIn[] = Object.values(state.conjuntos).map((conj) => ({
    ...conj,
    subconjuntos: [...conj.subconjuntos],
    atributos_visuales: {
      ...conj.atributos_visuales,
      posicion: { ...conj.atributos_visuales.posicion },
    },
  }));

  // ── 2. Traducción de arcos internos (si existen) ──
  const tieneArcos = Object.keys(state.arcos).length > 0;
  let conjuntosFinales = conjuntosBase;
  let elementosFinales = elementosBase;

  if (tieneArcos) {
    const { conjuntosAdicionales, pertenenciasExtra } = translateArcs(state.arcos);

    // Añadir conjuntos generados por arcos (evitar duplicados por id)
    const idsExistentes = new Set(conjuntosBase.map((c) => c.id));
    for (const conj of conjuntosAdicionales) {
      if (!idsExistentes.has(conj.id)) {
        conjuntosFinales = [...conjuntosFinales, conj];
        idsExistentes.add(conj.id);
      }
    }

    // ── 3. Actualizar pertenencias de elementos afectados por arcos ──
    elementosFinales = elementosBase.map((el) => {
      const extra = pertenenciasExtra[el.id] ?? [];
      if (extra.length === 0) return el;

      const pertenenciaActualizada = [...el.pertenencia];
      for (const cid of extra) {
        if (!pertenenciaActualizada.includes(cid)) {
          pertenenciaActualizada.push(cid);
        }
      }
      return { ...el, pertenencia: pertenenciaActualizada };
    });
  }

  // ── 4. Construir MotorInput ──
  return {
    elementos: elementosFinales,
    conjuntos: conjuntosFinales,
    max_iteraciones: state.maxIteraciones,
  };
}

/**
 * Exporta solo los elementos en formato ElementoIn[] (útil para pruebas parciales).
 */
export function toElementosArray(state: EditorState): ElementoIn[] {
  return Object.values(state.elementos);
}

/**
 * Exporta solo los conjuntos en formato ConjuntoIn[] (útil para pruebas parciales).
 */
export function toConjuntosArray(state: EditorState): ConjuntoIn[] {
  return Object.values(state.conjuntos);
}