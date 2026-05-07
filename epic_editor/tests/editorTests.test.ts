/**
 * editorTests.test.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Suite de pruebas del Editor EPiC Playground.
 *
 * Cubre los 20 casos definidos en el prompt, más casos adicionales.
 *
 * Organización:
 *   1. Validaciones del EditorState
 *   2. Acciones del Editor
 *   3. Adaptador EditorState → MotorInput
 *   4. Comunicación con el Motor (usando MockMotorClient)
 *   5. Flujo completo de edición → ejecución
 *
 * Tecnología: describe/it estilo Jest/Vitest (compatible con ambos).
 * Para ejecutar: npx vitest run  o  npx jest
 * ──────────────────────────────────────────────────────────────────────────
 */

import { createInitialState } from "../domain/editorState";
import * as actions from "../domain/editorActions";
import { validarEstado } from "../validators/editorValidation";
import { toMotorInput } from "../adapters/editorToMotorInput";
import { EditorController } from "../controllers/editorController";
import { MockMotorClient, MotorApiError } from "../services/motorApiClient";
import type { EditorState } from "../domain/editorState";
import type { MotorOutput } from "../domain/editorTypes";

// ─────────────────────────────────────────────
// Helpers de prueba
// ─────────────────────────────────────────────

/** Crea un estado con un elemento en un conjunto */
function estadoBase(): EditorState {
  let s = createInitialState();
  s = actions.crearConjunto(s, "C1", "PROPAGATION", { x: 120, y: 200 });
  s = actions.crearElemento(s, "e1", "V", ["C1"], { x: 120, y: 200 });
  return s;
}

/** Crea un estado con dos elementos en el mismo conjunto */
function estadoDosElementos(
  val1 = "V",
  val2 = "N",
  conectivo = "KJOIN",
): EditorState {
  let s = createInitialState();
  s = actions.crearConjunto(s, "C1", conectivo as any);
  s = actions.crearElemento(s, "e1", val1 as any, ["C1"]);
  s = actions.crearElemento(s, "e2", val2 as any, ["C1"]);
  return s;
}

// ─────────────────────────────────────────────
// 1. Validaciones del EditorState
// ─────────────────────────────────────────────

describe("Validaciones del Editor", () => {

  // Caso 11: Error cuando un elemento pertenece a un conjunto inexistente
  it("11 — error si pertenencia apunta a conjunto inexistente", () => {
    let s = createInitialState();
    s = actions.crearElemento(s, "e1", "V", ["C99"]);
    const result = validarEstado(s);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.includes("pertenencia"))).toBe(true);
    expect(result.errors.some((e) => e.message.includes("C99"))).toBe(true);
  });

  // Caso 12: Error cuando un conjunto referencia un subconjunto inexistente
  it("12 — error si subconjunto no existe", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = actions.definirSubconjunto(s, "C1", "C_FANTASMA");
    const result = validarEstado(s);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("C_FANTASMA"))).toBe(true);
  });

  // Caso 13: Error cuando hay ciclo entre subconjuntos
  it("13 — error si existe ciclo en subconjuntos", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = actions.crearConjunto(s, "C2", "PROPAGATION");
    // Forzar ciclo directo: C1→C2 y C2→C1
    s = actions.definirSubconjunto(s, "C1", "C2");
    s = actions.definirSubconjunto(s, "C2", "C1");
    const result = validarEstado(s);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.toLowerCase().includes("ciclo"))).toBe(true);
  });

  // Caso 14: Error cuando el conectivo no existe
  it("14 — error si conectivo no reconocido", () => {
    let s = createInitialState();
    // Forzar un conectivo inválido directamente en el estado
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = { ...s, conjuntos: { ...s.conjuntos, C1: { ...s.conjuntos.C1!, conectivo: "XOR_CUANTICO" as any } } };
    const result = validarEstado(s);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("XOR_CUANTICO"))).toBe(true);
  });

  // Caso 15: Error cuando se repite un ID (detección a nivel de controlador)
  it("15 — error si se intenta crear elemento con ID duplicado", () => {
    const ctrl = new EditorController(new MockMotorClient());
    ctrl.crearConjunto("C1");
    ctrl.crearElemento("e1", "V", ["C1"]);
    const result = ctrl.crearElemento("e1", "F", ["C1"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("e1"))).toBe(true);
    }
  });

  // Caso 16: Error si arco tiene origen o destino inexistente
  it("16 — error si arco interno apunta a elemento inexistente", () => {
    let s = createInitialState();
    s = actions.crearElemento(s, "p", "V", []);
    s = actions.registrarArco(s, {
      id: "a1",
      origen: "p",
      destino: "q_INEXISTENTE",
      conectivo: "IMPLIES",
      atributos_visuales: {},
    });
    const result = validarEstado(s);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.includes("destino"))).toBe(true);
  });

  it("— max_iteraciones fuera de rango genera error", () => {
    let s = estadoBase();
    s = actions.setMaxIteraciones(s, 0);
    const result = validarEstado(s);
    expect(result.valid).toBe(false);
  });

  it("— max_iteraciones en rango válido es aceptado", () => {
    let s = estadoBase();
    s = actions.setMaxIteraciones(s, 250);
    const result = validarEstado(s);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 2. Acciones del Editor
// ─────────────────────────────────────────────

describe("Acciones del Editor", () => {

  it("— crearElemento añade al estado", () => {
    const s = estadoBase();
    expect(s.elementos["e1"]).toBeDefined();
    expect(s.elementos["e1"]!.valor_verdad).toBe("V");
  });

  it("— editarElemento actualiza valor_verdad", () => {
    let s = estadoBase();
    s = actions.asignarValorVerdad(s, "e1", "F");
    expect(s.elementos["e1"]!.valor_verdad).toBe("F");
  });

  it("— eliminarElemento limpia referencias de arcos", () => {
    let s = createInitialState();
    s = actions.crearElemento(s, "p", "V", []);
    s = actions.crearElemento(s, "q", "N", []);
    s = actions.registrarArco(s, { id: "a1", origen: "p", destino: "q", conectivo: "IMPLIES", atributos_visuales: {} });
    s = actions.eliminarElemento(s, "p");
    expect(s.elementos["p"]).toBeUndefined();
    expect(s.arcos["a1"]).toBeUndefined(); // arco debe eliminarse
  });

  it("— eliminarConjunto limpia pertenencia en elementos", () => {
    let s = estadoBase(); // e1 ∈ C1
    s = actions.eliminarConjunto(s, "C1");
    expect(s.conjuntos["C1"]).toBeUndefined();
    expect(s.elementos["e1"]!.pertenencia).not.toContain("C1");
  });

  it("— definirSubconjunto agrega correctamente", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "KJOIN");
    s = actions.crearConjunto(s, "C2", "PROPAGATION");
    s = actions.definirSubconjunto(s, "C1", "C2");
    expect(s.conjuntos["C1"]!.subconjuntos).toContain("C2");
  });

  it("— quitarSubconjunto lo elimina correctamente", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "KJOIN");
    s = actions.crearConjunto(s, "C2", "PROPAGATION");
    s = actions.definirSubconjunto(s, "C1", "C2");
    s = actions.quitarSubconjunto(s, "C1", "C2");
    expect(s.conjuntos["C1"]!.subconjuntos).not.toContain("C2");
  });

  it("— setModo cambia el modo correctamente", () => {
    let s = estadoBase();
    s = actions.setModo(s, "ejecucion");
    expect(s.modo).toBe("ejecucion");
  });
});

// ─────────────────────────────────────────────
// 3. Adaptador EditorState → MotorInput
// ─────────────────────────────────────────────

describe("Adaptador editorToMotorInput", () => {

  // Caso 1: MotorInput con un elemento
  it("1 — MotorInput con un elemento", () => {
    const payload = toMotorInput(estadoBase());
    expect(payload.elementos).toHaveLength(1);
    expect(payload.elementos[0]!.id).toBe("e1");
  });

  // Caso 2: MotorInput con dos elementos en el mismo conjunto
  it("2 — MotorInput con dos elementos en el mismo conjunto", () => {
    const payload = toMotorInput(estadoDosElementos("V", "N"));
    expect(payload.elementos).toHaveLength(2);
    expect(payload.conjuntos).toHaveLength(1);
    expect(payload.elementos[0]!.pertenencia).toContain("C1");
    expect(payload.elementos[1]!.pertenencia).toContain("C1");
  });

  // Casos 3-6: Valores V, F, N, B
  it("3 — MotorInput con valor V", () => {
    const p = toMotorInput(estadoBase()); // e1 = "V"
    expect(p.elementos[0]!.valor_verdad).toBe("V");
  });

  it("4 — MotorInput con valor F", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = actions.crearElemento(s, "e1", "F", ["C1"]);
    expect(toMotorInput(s).elementos[0]!.valor_verdad).toBe("F");
  });

  it("5 — MotorInput con valor N", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = actions.crearElemento(s, "e1", "N", ["C1"]);
    expect(toMotorInput(s).elementos[0]!.valor_verdad).toBe("N");
  });

  it("6 — MotorInput con valor B", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = actions.crearElemento(s, "e1", "B", ["C1"]);
    expect(toMotorInput(s).elementos[0]!.valor_verdad).toBe("B");
  });

  // Caso 7: KJOIN
  it("7 — MotorInput con conectivo KJOIN", () => {
    const p = toMotorInput(estadoDosElementos("V", "F", "KJOIN"));
    expect(p.conjuntos[0]!.conectivo).toBe("KJOIN");
  });

  // Caso 8: IMPLIES
  it("8 — MotorInput con conectivo IMPLIES", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "IMPLIES");
    s = actions.crearElemento(s, "p", "V", ["C1"]);
    s = actions.crearElemento(s, "q", "N", ["C1"]);
    const p = toMotorInput(s);
    expect(p.conjuntos[0]!.conectivo).toBe("IMPLIES");
  });

  // Caso 9: Subconjuntos
  it("9 — MotorInput con subconjuntos", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "KJOIN");
    s = actions.crearConjunto(s, "C2", "PROPAGATION");
    s = actions.definirSubconjunto(s, "C1", "C2");
    s = actions.crearElemento(s, "e1", "V", ["C2"]);
    const p = toMotorInput(s);
    const c1 = p.conjuntos.find((c) => c.id === "C1");
    expect(c1?.subconjuntos).toContain("C2");
  });

  // Caso 10: es_resultado_de
  it("10 — MotorInput con es_resultado_de", () => {
    let s = createInitialState();
    s = actions.crearConjunto(s, "C1", "PROPAGATION");
    s = actions.definirResultadoDe(s, "C1", "Z");
    s = actions.crearElemento(s, "e1", "V", ["C1"]);
    const p = toMotorInput(s);
    const c1 = p.conjuntos.find((c) => c.id === "C1");
    expect(c1?.es_resultado_de).toBe("Z");
  });

  // Caso 17: Traducción de arco p → q a MotorInput válido
  it("17 — arco p→q se traduce a ConjuntoIn implícito en MotorInput", () => {
    let s = createInitialState();
    s = actions.crearElemento(s, "p", "V", []);
    s = actions.crearElemento(s, "q", "N", []);
    s = actions.registrarArco(s, {
      id: "a1",
      origen: "p",
      destino: "q",
      conectivo: "IMPLIES",
      atributos_visuales: { color: "#333" },
    });
    const p = toMotorInput(s);
    const conjImplicito = p.conjuntos.find((c) => c.id === "arc_p_q");
    expect(conjImplicito).toBeDefined();
    expect(conjImplicito?.conectivo).toBe("IMPLIES");
    // p y q deben pertenecer al conjunto generado
    const elemP = p.elementos.find((e) => e.id === "p");
    const elemQ = p.elementos.find((e) => e.id === "q");
    expect(elemP?.pertenencia).toContain("arc_p_q");
    expect(elemQ?.pertenencia).toContain("arc_p_q");
  });

  it("— max_iteraciones se preserva en MotorInput", () => {
    let s = estadoBase();
    s = actions.setMaxIteraciones(s, 250);
    expect(toMotorInput(s).max_iteraciones).toBe(250);
  });
});

// ─────────────────────────────────────────────
// 4. Comunicación con el Motor (Mock)
// ─────────────────────────────────────────────

describe("Comunicación con el Motor (MockMotorClient)", () => {

  // Caso 18: GET /health
  it("18 — health retorna true cuando el Motor está activo", async () => {
    const ctrl = new EditorController(new MockMotorClient({ healthOk: true }));
    expect(await ctrl.checkMotorHealth()).toBe(true);
  });

  it("18b — health retorna false cuando el Motor no está disponible", async () => {
    const ctrl = new EditorController(new MockMotorClient({ healthOk: false }));
    expect(await ctrl.checkMotorHealth()).toBe(false);
  });

  // Caso 19: GET /conectivos
  it("19 — cargarConectivos actualiza el estado del Editor", async () => {
    const mock = new MockMotorClient({
      conectivos: ["AND", "OR", "KJOIN"],
    });
    const ctrl = new EditorController(mock);
    await ctrl.cargarConectivos();
    expect(ctrl.getState().conectivosDisponibles).toEqual(["AND", "OR", "KJOIN"]);
  });

  // Caso 20: POST /calcular
  it("20 — ejecutar envía MotorInput y recibe MotorOutput", async () => {
    const mockOutput: MotorOutput = {
      elementos: [{ id: "e1", valor_verdad: "V", valor_verdad_inicial: "V", pertenencia: ["C1"], proviene: [], atributos_visuales: { posicion: { x: 120, y: 200 }, color: "verde" } }],
      conjuntos: [{ id: "C1", subconjuntos: [], es_resultado_de: null, conectivo: "PROPAGATION", atributos_visuales: { radio: 50, forma: "elipse", posicion: { x: 120, y: 200 } } }],
      acciones: [{ paso: 1, tipo_accion: "estabilizacion", elemento_id: "*", valor_resultante: "*", descripcion: "Estabilizado." }],
      iteraciones_realizadas: 1,
      estabilizado: true,
      resumen: {},
    };
    const ctrl = new EditorController(new MockMotorClient({ calcularResponse: mockOutput }));
    ctrl.crearConjunto("C1");
    ctrl.crearElemento("e1", "V", ["C1"]);
    const result = await ctrl.ejecutar();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.estabilizado).toBe(true);
    }
  });

  it("— ejecutar falla con validación si el estado es inválido", async () => {
    const ctrl = new EditorController(new MockMotorClient());
    // e1 pertenece a C99 que no existe
    ctrl.crearElemento("e1", "V", ["C99"]);
    const result = await ctrl.ejecutar();
    expect(result.ok).toBe(false);
    // Modo debe seguir en "edicion"
    expect(ctrl.getState().modo).toBe("edicion");
  });

  it("— ejecutar restaura modo edicion si el Motor devuelve error", async () => {
    const ctrl = new EditorController(
      new MockMotorClient({ calcularResponse: new MotorApiError(500, "Error interno") }),
    );
    ctrl.crearConjunto("C1");
    ctrl.crearElemento("e1", "V", ["C1"]);
    const result = await ctrl.ejecutar();
    expect(result.ok).toBe(false);
    expect(ctrl.getState().modo).toBe("edicion");
  });
});

// ─────────────────────────────────────────────
// 5. Flujo completo (escenarios del test_motor.py)
// ─────────────────────────────────────────────

describe("Flujo completo — escenarios compatibles con test_motor.py", () => {

  it("Caso 1 — elemento único en conjunto PROPAGATION genera MotorInput válido", () => {
    const ctrl = new EditorController();
    ctrl.crearConjunto("C1", "PROPAGATION", { x: 120, y: 200 });
    ctrl.crearElemento("e1", "V", ["C1"], { x: 120, y: 200 });
    const result = ctrl.generarMotorInput();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.elementos[0]!.valor_verdad).toBe("V");
      expect(result.data.conjuntos[0]!.conectivo).toBe("PROPAGATION");
    }
  });

  it("Caso 2 — propagación simple KJOIN (V + N)", () => {
    const ctrl = new EditorController();
    ctrl.crearConjunto("C1", "KJOIN");
    ctrl.crearElemento("e1", "V", ["C1"], { x: 100, y: 160 });
    ctrl.crearElemento("e2", "N", ["C1"], { x: 260, y: 160 });
    const result = ctrl.generarMotorInput();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.elementos).toHaveLength(2);
    }
  });

  it("Caso 3 — contradicción V/F genera MotorInput válido (Motor calcula B)", () => {
    const ctrl = new EditorController();
    ctrl.crearConjunto("C1", "KJOIN");
    ctrl.crearElemento("e1", "V", ["C1"]);
    ctrl.crearElemento("e2", "F", ["C1"]);
    const result = ctrl.generarMotorInput();
    expect(result.ok).toBe(true);
    // El Editor solo genera el escenario; el Motor producirá B
    if (result.ok) {
      expect(result.data.elementos.map((e) => e.valor_verdad).sort()).toEqual(["F", "V"]);
    }
  });

  it("Caso 4 — jerarquía de subconjuntos", () => {
    const ctrl = new EditorController();
    ctrl.crearConjunto("C1", "KJOIN");
    ctrl.crearConjunto("C2", "KJOIN");
    ctrl.definirSubconjunto("C1", "C2");
    ctrl.crearElemento("e1", "V", ["C2"]);
    ctrl.crearElemento("e2", "N", ["C1"]);
    const result = ctrl.generarMotorInput();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const c1 = result.data.conjuntos.find((c) => c.id === "C1");
      expect(c1?.subconjuntos).toContain("C2");
    }
  });

  it("Caso 5 — cambio de variable (es_resultado_de)", () => {
    const ctrl = new EditorController();
    ctrl.crearConjunto("C1", "PROPAGATION");
    ctrl.definirResultadoDe("C1", "Z");
    ctrl.crearElemento("e1", "V", ["C1"]);
    const result = ctrl.generarMotorInput();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const c1 = result.data.conjuntos.find((c) => c.id === "C1");
      expect(c1?.es_resultado_de).toBe("Z");
    }
  });
});