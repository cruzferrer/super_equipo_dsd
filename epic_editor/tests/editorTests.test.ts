/**
 * editorTests.test.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Pruebas del módulo Editor EPiC Playground.
 *
 * Estas pruebas validan el nuevo modelo:
 *
 *   variables + ocurrencias + pares + arcos
 *
 * Regla central:
 *   Una variable lógica puede aparecer muchas veces visualmente.
 *   Todas sus ocurrencias comparten valor_actual y evidencias.
 *
 * Ejemplo:
 *   occ_1.variable_id = "p"
 *   occ_3.variable_id = "p"
 *
 *   Ambas representan a la misma variable lógica "p".
 */

import { describe, it, expect } from "@jest/globals";

import { createInitialState } from "../domain/editorState";

import {
  evidenciasToBelnap,
  type VariableLogica,
  type OcurrenciaVisual,
  type ParVisual,
  type EditorArc,
} from "../domain/editorTypes";

import {
  crearVariable,
  crearOcurrencia,
  crearPar,
  crearArco,
  agregarEvidenciaAOcurrencia,
  agregarEvidenciaAVariable,
  quitarEvidenciaAVariable,
  eliminarVariable,
  eliminarOcurrencia,
  eliminarPar,
  moverOcurrencia,
  moverPar,
} from "../domain/editorActions";

import {
  validarEstado,
  esBelnapValido,
  esEvidenciaValida,
  esConectivoValido,
} from "../validators/editorValidation";

import { toMotorInput } from "../adapters/editorToMotorInput";

import {
  EditorController,
} from "../controllers/editorController";

import {
  MockMotorClient,
} from "../services/motorApiClient";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function variable(id: string): VariableLogica {
  return {
    id,
    valor_actual: "N",
    evidencias: [],
    alias: null,
  };
}

function par(id: string): ParVisual {
  return {
    id,
    ocurrencias: [],
    atributos_visuales: {
      x: 100,
      y: 100,
    },
  };
}

function ocurrencia(
  id: string,
  variable_id: string,
  par_id: string,
  x = 0,
  y = 0,
): OcurrenciaVisual {
  return {
    id,
    variable_id,
    par_id,
    atributos_visuales: {
      x,
      y,
    },
  };
}

function arco(
  id: string,
  origen_ocurrencia: string,
  destino_ocurrencia: string,
  origen_variable: string,
  destino_variable: string,
): EditorArc {
  return {
    id,
    origen_ocurrencia,
    destino_ocurrencia,
    origen_variable,
    destino_variable,
    conectivo: "IMPLIES",
  };
}

function crearEstadoBasico() {
  let state = createInitialState();

  state = crearVariable(state, variable("p"));
  state = crearVariable(state, variable("q"));

  state = crearPar(state, par("par_1"));

  state = crearOcurrencia(
    state,
    ocurrencia("occ_1", "p", "par_1", 100, 160),
  );

  state = crearOcurrencia(
    state,
    ocurrencia("occ_2", "q", "par_1", 260, 160),
  );

  state = {
    ...state,
    pares: {
      ...state.pares,
      par_1: {
        ...state.pares.par_1,
        ocurrencias: ["occ_1", "occ_2"],
      },
    },
  };

  state = crearArco(
    state,
    arco("a1", "occ_1", "occ_2", "p", "q"),
  );

  return state;
}

// ─────────────────────────────────────────────
// Utilidades de dominio
// ─────────────────────────────────────────────

describe("Utilidades de dominio", () => {
  it("evidencias vacías producen N", () => {
    expect(evidenciasToBelnap([])).toBe("N");
  });

  it("evidencia verde produce V", () => {
    expect(evidenciasToBelnap(["verde"])).toBe("V");
  });

  it("evidencia roja produce F", () => {
    expect(evidenciasToBelnap(["roja"])).toBe("F");
  });

  it("evidencia verde y roja produce B", () => {
    expect(evidenciasToBelnap(["verde", "roja"])).toBe("B");
  });

  it("valida valores Belnap permitidos", () => {
    expect(esBelnapValido("V")).toBe(true);
    expect(esBelnapValido("F")).toBe(true);
    expect(esBelnapValido("N")).toBe(true);
    expect(esBelnapValido("B")).toBe(true);
    expect(esBelnapValido("TRUE")).toBe(false);
  });

  it("valida evidencias permitidas", () => {
    expect(esEvidenciaValida("verde")).toBe(true);
    expect(esEvidenciaValida("roja")).toBe(true);
    expect(esEvidenciaValida("azul")).toBe(false);
  });

  it("valida conectivos permitidos", () => {
    expect(esConectivoValido("IMPLIES")).toBe(true);
    expect(esConectivoValido("KJOIN")).toBe(true);
    expect(esConectivoValido("XOR_CUANTICO")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Acciones sobre variables
// ─────────────────────────────────────────────

describe("Acciones sobre variables", () => {
  it("crearVariable agrega una variable lógica al estado", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));

    expect(state.variables.p).toBeDefined();
    expect(state.variables.p.id).toBe("p");
    expect(state.variables.p.valor_actual).toBe("N");
  });

  it("agregarEvidenciaAVariable actualiza evidencias y valor_actual", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = agregarEvidenciaAVariable(state, "p", "verde");

    expect(state.variables.p.evidencias).toEqual(["verde"]);
    expect(state.variables.p.valor_actual).toBe("V");
  });

  it("agregar evidencia roja a variable con verde produce B", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = agregarEvidenciaAVariable(state, "p", "verde");
    state = agregarEvidenciaAVariable(state, "p", "roja");

    expect(state.variables.p.evidencias).toEqual(["verde", "roja"]);
    expect(state.variables.p.valor_actual).toBe("B");
  });

  it("quitarEvidenciaAVariable recalcula valor_actual", () => {
    let state = createInitialState();

    state = crearVariable(state, {
      id: "p",
      evidencias: ["verde", "roja"],
    });

    state = quitarEvidenciaAVariable(state, "p", "roja");

    expect(state.variables.p.evidencias).toEqual(["verde"]);
    expect(state.variables.p.valor_actual).toBe("V");
  });

  it("eliminarVariable elimina sus ocurrencias y arcos relacionados", () => {
    let state = crearEstadoBasico();

    state = eliminarVariable(state, "p");

    expect(state.variables.p).toBeUndefined();
    expect(state.ocurrencias.occ_1).toBeUndefined();
    expect(state.arcos.a1).toBeUndefined();
    expect(state.pares.par_1.ocurrencias).toEqual(["occ_2"]);
  });
});

// ─────────────────────────────────────────────
// Ocurrencias y sincronización de bolitas
// ─────────────────────────────────────────────

describe("Ocurrencias visuales y sincronización", () => {
  it("crearOcurrencia agrega una aparición visual de una variable", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));

    expect(state.ocurrencias.occ_1).toBeDefined();
    expect(state.ocurrencias.occ_1.variable_id).toBe("p");
  });

  it("dos ocurrencias pueden apuntar a la misma variable lógica", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearPar(state, par("par_2"));

    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_2", "p", "par_2"));

    expect(state.ocurrencias.occ_1.variable_id).toBe("p");
    expect(state.ocurrencias.occ_2.variable_id).toBe("p");
  });

  it("poner evidencia en una ocurrencia actualiza la variable lógica", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));

    state = agregarEvidenciaAOcurrencia(state, "occ_1", "verde");

    expect(state.variables.p.evidencias).toEqual(["verde"]);
    expect(state.variables.p.valor_actual).toBe("V");
  });

  it("si dos ocurrencias apuntan a p, ambas comparten el valor de p", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearPar(state, par("par_2"));

    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_2", "p", "par_2"));

    state = agregarEvidenciaAOcurrencia(state, "occ_1", "verde");

    expect(state.ocurrencias.occ_1.variable_id).toBe("p");
    expect(state.ocurrencias.occ_2.variable_id).toBe("p");
    expect(state.variables.p.valor_actual).toBe("V");
    expect(state.variables.p.evidencias).toEqual(["verde"]);
  });

  it("moverOcurrencia actualiza sus coordenadas", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1", 10, 20));

    state = moverOcurrencia(state, "occ_1", { x: 300, y: 400 });

    expect(state.ocurrencias.occ_1.atributos_visuales).toEqual({
      x: 300,
      y: 400,
    });
  });

  it("eliminarOcurrencia la quita del par y elimina arcos relacionados", () => {
    let state = crearEstadoBasico();

    state = eliminarOcurrencia(state, "occ_1");

    expect(state.ocurrencias.occ_1).toBeUndefined();
    expect(state.pares.par_1.ocurrencias).toEqual(["occ_2"]);
    expect(state.arcos.a1).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// Pares
// ─────────────────────────────────────────────

describe("Pares visuales", () => {
  it("crearPar agrega una caja/par al estado", () => {
    let state = createInitialState();

    state = crearPar(state, par("par_1"));

    expect(state.pares.par_1).toBeDefined();
    expect(state.pares.par_1.ocurrencias).toEqual([]);
  });

  it("moverPar actualiza coordenadas del par", () => {
    let state = createInitialState();

    state = crearPar(state, par("par_1"));
    state = moverPar(state, "par_1", { x: 500, y: 600 });

    expect(state.pares.par_1.atributos_visuales).toEqual({
      x: 500,
      y: 600,
    });
  });

  it("eliminarPar elimina sus ocurrencias y arcos relacionados", () => {
    let state = crearEstadoBasico();

    state = eliminarPar(state, "par_1");

    expect(state.pares.par_1).toBeUndefined();
    expect(state.ocurrencias.occ_1).toBeUndefined();
    expect(state.ocurrencias.occ_2).toBeUndefined();
    expect(state.arcos.a1).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// Validaciones
// ─────────────────────────────────────────────

describe("Validaciones del Editor", () => {
  it("estado básico válido no produce errores graves", () => {
    const state = crearEstadoBasico();

    const result = validarEstado(state);

    expect(result.valid).toBe(true);
  });

  it("error si valor_actual no coincide con evidencias", () => {
    let state = createInitialState();

    state = crearVariable(state, {
      id: "p",
      valor_actual: "V",
      evidencias: [],
    });

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("variables.p.valor_actual"),
      ),
    ).toBe(true);
  });

  it("error si una ocurrencia apunta a variable inexistente", () => {
    let state = createInitialState();

    state = crearPar(state, par("par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("ocurrencias.occ_1.variable_id"),
      ),
    ).toBe(true);
  });

  it("error si una ocurrencia apunta a par inexistente", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_inexistente"));

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("ocurrencias.occ_1.par_id"),
      ),
    ).toBe(true);
  });

  it("error si un par referencia ocurrencia inexistente", () => {
    let state = createInitialState();

    state = crearPar(state, {
      id: "par_1",
      ocurrencias: ["occ_inexistente"],
      atributos_visuales: { x: 0, y: 0 },
    });

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("pares.par_1.ocurrencias"),
      ),
    ).toBe(true);
  });

  it("warning si un par no tiene exactamente dos ocurrencias", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));

    state = {
      ...state,
      pares: {
        ...state.pares,
        par_1: {
          ...state.pares.par_1,
          ocurrencias: ["occ_1"],
        },
      },
    };

    const result = validarEstado(state);

    expect(result.valid).toBe(true);
    expect(
      result.errors.some((error) => error.severity === "warning"),
    ).toBe(true);
  });

  it("error si arco apunta a ocurrencia inexistente", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearVariable(state, variable("q"));
    state = crearPar(state, par("par_1"));

    state = crearArco(
      state,
      arco("a1", "occ_inexistente", "occ_2", "p", "q"),
    );

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("arcos.a1.origen_ocurrencia"),
      ),
    ).toBe(true);
  });

  it("error si origen_variable no coincide con variable de origen_ocurrencia", () => {
    let state = crearEstadoBasico();

    state = {
      ...state,
      arcos: {
        ...state.arcos,
        a1: {
          ...state.arcos.a1,
          origen_variable: "q",
        },
      },
    };

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("arcos.a1.origen_variable"),
      ),
    ).toBe(true);
  });

  it("error si conectivo de arco no es válido", () => {
    let state = crearEstadoBasico();

    state = {
      ...state,
      arcos: {
        ...state.arcos,
        a1: {
          ...state.arcos.a1,
          conectivo: "XOR_CUANTICO" as never,
        },
      },
    };

    const result = validarEstado(state);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.field.includes("arcos.a1.conectivo"),
      ),
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Adaptador a MotorInputV2
// ─────────────────────────────────────────────

describe("Adaptador toMotorInput", () => {
  it("genera el JSON completo con proyecto, versión y dominio compartido", () => {
    const state = crearEstadoBasico();

    const payload = toMotorInput(state);

    expect(payload.proyecto).toBe("EPIC Playground PoC");
    expect(payload.version).toBe("2.0");
    expect(payload.estado_sistema).toBe("edicion");
    expect(payload.dominio_valores).toEqual(["V", "F", "N", "B"]);

    expect(payload.dominio_compartido.variables).toHaveLength(2);
    expect(payload.dominio_compartido.ocurrencias).toHaveLength(2);
    expect(payload.dominio_compartido.pares).toHaveLength(1);
    expect(payload.dominio_compartido.arcos).toHaveLength(1);
  });

  it("incluye variables con evidencias sincronizadas", () => {
    let state = crearEstadoBasico();

    state = agregarEvidenciaAOcurrencia(state, "occ_1", "verde");

    const payload = toMotorInput(state);
    const p = payload.dominio_compartido.variables.find(
      (item) => item.id === "p",
    );

    expect(p).toBeDefined();
    expect(p?.valor_actual).toBe("V");
    expect(p?.evidencias).toEqual(["verde"]);
  });

  it("incluye ocurrencias repetidas de la misma variable", () => {
    let state = createInitialState();

    state = crearVariable(state, variable("p"));
    state = crearPar(state, par("par_1"));
    state = crearPar(state, par("par_2"));

    state = crearOcurrencia(state, ocurrencia("occ_1", "p", "par_1"));
    state = crearOcurrencia(state, ocurrencia("occ_2", "p", "par_2"));

    const payload = toMotorInput(state);

    const ocurrenciasDeP = payload.dominio_compartido.ocurrencias.filter(
      (item) => item.variable_id === "p",
    );

    expect(ocurrenciasDeP).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// Controlador
// ─────────────────────────────────────────────

describe("EditorController", () => {
  it("crearVariable desde controlador evita duplicados", () => {
    const editor = new EditorController();

    const result1 = editor.crearVariable({ id: "p" });
    const result2 = editor.crearVariable({ id: "p" });

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(false);
  });

  it("crearOcurrencia desde controlador exige variable existente", () => {
    const editor = new EditorController();

    editor.crearPar(par("par_1"));

    const result = editor.crearOcurrencia(
      ocurrencia("occ_1", "p", "par_1"),
    );

    expect(result.ok).toBe(false);
  });

  it("agregarEvidenciaAOcurrencia desde controlador actualiza variable", () => {
    const editor = new EditorController();

    editor.crearVariable({ id: "p" });
    editor.crearPar(par("par_1"));
    editor.crearOcurrencia(ocurrencia("occ_1", "p", "par_1"));

    const result = editor.agregarEvidenciaAOcurrencia("occ_1", "verde");

    expect(result.ok).toBe(true);
    expect(editor.getState().variables.p.valor_actual).toBe("V");
  });

  it("generarMotorInput devuelve MotorInputV2 válido", () => {
    const editor = new EditorController();

    editor.crearVariable({ id: "p" });
    editor.crearVariable({ id: "q" });
    editor.crearPar(par("par_1"));
    editor.crearOcurrencia(ocurrencia("occ_1", "p", "par_1"));
    editor.crearOcurrencia(ocurrencia("occ_2", "q", "par_1"));
    editor.crearArco(arco("a1", "occ_1", "occ_2", "p", "q"));

    const result = editor.generarMotorInput();

    expect(result.ok).toBe(true);
    expect(result.data?.dominio_compartido.variables).toHaveLength(2);
  });

  it("ejecutar envía MotorInputV2 al MockMotorClient", async () => {
    const motorClient = new MockMotorClient();
    const editor = new EditorController({ motorClient });

    editor.crearVariable({ id: "p" });
    editor.crearVariable({ id: "q" });
    editor.crearPar(par("par_1"));
    editor.crearOcurrencia(ocurrencia("occ_1", "p", "par_1"));
    editor.crearOcurrencia(ocurrencia("occ_2", "q", "par_1"));
    editor.crearArco(arco("a1", "occ_1", "occ_2", "p", "q"));

    const result = await editor.ejecutar();

    expect(result.ok).toBe(true);
    expect(motorClient.receivedPayloads).toHaveLength(1);
    expect(motorClient.receivedPayloads[0].version).toBe("2.0");
  });

  it("ejecutar no manda al Motor si el estado es inválido", async () => {
    const motorClient = new MockMotorClient();
    const editor = new EditorController({ motorClient });

    editor.crearVariable({ id: "p" });
    editor.crearPar(par("par_1"));

    /**
     * Forzamos estado inválido manualmente:
     * par_1 tiene solo una ocurrencia, pero eso es warning, no error.
     * Para crear un error real, agregamos arco inexistente directo al estado.
     */
    editor.setState({
      ...editor.getState(),
      arcos: {
        a1: arco("a1", "occ_inexistente", "occ_2", "p", "q"),
      },
    });

    const result = await editor.ejecutar();

    expect(result.ok).toBe(false);
    expect(motorClient.receivedPayloads).toHaveLength(0);
  });
});