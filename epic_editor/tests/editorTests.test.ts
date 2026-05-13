import { EditorController } from "../controllers/editorController";
import { MockMotorClient } from "../services/motorApiClient";
import { validarSnapshot } from "../validators/editorValidation";

describe("EditorController y Acciones", () => {
  it("crea una variable logica sin instancias visuales", () => {
    const ctrl = new EditorController();

    const result = ctrl.crearVariable("p", "V");

    expect(result.ok).toBe(true);
    const state = ctrl.getState();
    expect(state.snapshot.logic.variables).toHaveLength(1);
    expect(state.snapshot.logic.variables[0].id).toBe("p");
    expect(state.snapshot.logic.variables[0].truth_value).toBe("V");
    expect(Object.keys(state.snapshot.visual.instances)).toHaveLength(0);
  });

  it("falla al crear instancia visual si la variable logica no existe", () => {
    const ctrl = new EditorController();

    ctrl.dibujarInstancia("inst_1", "fantasma", 100, 100);

    const state = ctrl.getState();
    expect(state.snapshot.visual.instances["inst_1"]).toBeUndefined();
  });

  it("crea multiples instancias visuales para una misma variable logica", () => {
    const ctrl = new EditorController();
    ctrl.crearVariable("p", "V");

    ctrl.dibujarInstancia("inst_1", "p", 100, 100);
    ctrl.dibujarInstancia("inst_2", "p", 200, 200);

    const state = ctrl.getState();
    expect(Object.keys(state.snapshot.visual.instances)).toHaveLength(2);
    expect(state.snapshot.visual.instances["inst_1"].variable_id).toBe("p");
    expect(state.snapshot.visual.instances["inst_2"].variable_id).toBe("p");
  });

  it("elimina en cascada instancias y relaciones visuales al eliminar variable logica", () => {
    const ctrl = new EditorController();
    ctrl.crearVariable("p", "V");
    ctrl.crearVariable("q", "N");
    ctrl.dibujarInstancia("inst_p", "p", 10, 10);
    ctrl.dibujarInstancia("inst_q", "q", 20, 20);
    ctrl.conectar("rel_1", "p", "q", "IMPLIES");

    ctrl.eliminarVariable("p");

    const state = ctrl.getState();
    expect(state.snapshot.logic.variables).toHaveLength(1);
    expect(state.snapshot.logic.variables[0].id).toBe("q");

    expect(state.snapshot.visual.instances["inst_p"]).toBeUndefined();
    expect(state.snapshot.visual.instances["inst_q"]).toBeDefined();

    expect(state.snapshot.logic.relations).toHaveLength(0);
    expect(state.snapshot.visual.relations["rel_1"]).toBeUndefined();
  });

  it("falla al crear IDs duplicados en logica y visual", () => {
    const ctrl = new EditorController();

    ctrl.crearVariable("p", "V");
    const resLogica = ctrl.crearVariable("p", "F");
    expect(resLogica.ok).toBe(false);

    ctrl.dibujarInstancia("inst_1", "p", 0, 0);
    const resVisual = ctrl.dibujarInstancia("inst_1", "p", 10, 10);
    expect(resVisual.ok).toBe(false);
  });
});

describe("Validaciones de Snapshot", () => {
  it("valida un snapshot correcto", () => {
    const ctrl = new EditorController();
    ctrl.crearContexto("ctx_1", "PROPAGATION", 0, 0);
    ctrl.crearVariable("p", "V");

    const validacion = ctrl.validar();

    expect(validacion.valid).toBe(true);
    expect(validacion.errors).toHaveLength(0);
  });

  it("detecta referencias rotas en membresias", () => {
    const ctrl = new EditorController();
    ctrl.crearVariable("p", "V");

    const state = ctrl.getState();
    state.snapshot.logic.variables[0].memberships.push("ctx_fantasma");

    const validacion = validarSnapshot(
      state.snapshot,
      state.available_connectives,
    );

    expect(validacion.valid).toBe(false);
    expect(validacion.errors.some((e) => e.field.includes("memberships"))).toBe(
      true,
    );
  });

  it("detecta ciclos en la jerarquia de conjuntos", () => {
    const ctrl = new EditorController();
    ctrl.crearContexto("ctx_1", "PROPAGATION", 0, 0);
    ctrl.crearContexto("ctx_2", "PROPAGATION", 0, 0);

    const state = ctrl.getState();
    state.snapshot.logic.sets[0].subsets.push("ctx_2");
    state.snapshot.logic.sets[1].subsets.push("ctx_1");

    const validacion = validarSnapshot(
      state.snapshot,
      state.available_connectives,
    );

    expect(validacion.valid).toBe(false);
    expect(
      validacion.errors.some((e) => e.message.includes("Ciclo detectado")),
    ).toBe(true);
  });
});

describe("Integracion con MotorApiClient", () => {
  it("ejecuta correctamente y guarda el execution_trace usando el mock", async () => {
    const mockClient = new MockMotorClient();
    const ctrl = new EditorController(mockClient);

    ctrl.crearVariable("p", "V");
    ctrl.crearContexto("ctx_1", "PROPAGATION", 100, 100);

    const result = await ctrl.ejecutar();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.stabilized).toBe(true);
      expect(result.data.actions).toHaveLength(1);
    }

    const state = ctrl.getState();
    expect(state.snapshot.meta.editor_mode).toBe("ejecucion");
    expect(state.snapshot.execution_trace).toBeDefined();
  });

  it("bloquea la ejecucion si el snapshot es invalido", async () => {
    const ctrl = new EditorController(new MockMotorClient());

    ctrl.crearVariable("p", "V");
    const state = ctrl.getState();
    state.snapshot.logic.variables[0].memberships.push("ctx_invalido");

    const result = await ctrl.ejecutar();

    expect(result.ok).toBe(false);
    expect(ctrl.getState().snapshot.meta.editor_mode).toBe("edicion");
  });

  it("regresa a modo edicion limpiando el rastro", async () => {
    const ctrl = new EditorController(new MockMotorClient());
    ctrl.crearVariable("p", "V");
    await ctrl.ejecutar();

    expect(ctrl.getState().snapshot.meta.editor_mode).toBe("ejecucion");

    ctrl.regresarAEdicion();

    const state = ctrl.getState();
    expect(state.snapshot.meta.editor_mode).toBe("edicion");
    expect(state.snapshot.execution_trace).toBeUndefined();
  });
});
