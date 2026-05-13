import type { EditorState } from "./editorState";
import type {
  BelnapValue,
  MotorConnective,
  ExecutionTrace,
} from "./editorTypes";

export function crearVariableLogica(
  state: EditorState,
  id: string,
  truth_value: BelnapValue = "N",
): EditorState {
  if (state.snapshot.logic.variables.some((v) => v.id === id)) return state;

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: {
        ...state.snapshot.logic,
        variables: [
          ...state.snapshot.logic.variables,
          { id, truth_value, memberships: [] },
        ],
      },
    },
  };
}

export function eliminarVariableLogica(
  state: EditorState,
  id: string,
): EditorState {
  const variables = state.snapshot.logic.variables.filter((v) => v.id !== id);
  const relations = state.snapshot.logic.relations.filter(
    (r) => r.from_variable !== id && r.to_variable !== id,
  );

  const instances = { ...state.snapshot.visual.instances };
  for (const key of Object.keys(instances)) {
    if (instances[key].variable_id === id) {
      delete instances[key];
    }
  }

  const visualRelations = { ...state.snapshot.visual.relations };
  for (const r of state.snapshot.logic.relations) {
    if (
      (r.from_variable === id || r.to_variable === id) &&
      visualRelations[r.id]
    ) {
      delete visualRelations[r.id];
    }
  }

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: { ...state.snapshot.logic, variables, relations },
      visual: {
        ...state.snapshot.visual,
        instances,
        relations: visualRelations,
      },
    },
  };
}

export function crearInstanciaVisual(
  state: EditorState,
  instance_id: string,
  variable_id: string,
  x: number,
  y: number,
): EditorState {
  if (!state.snapshot.logic.variables.some((v) => v.id === variable_id))
    return state;

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      visual: {
        ...state.snapshot.visual,
        instances: {
          ...state.snapshot.visual.instances,
          [instance_id]: { id: instance_id, variable_id, x, y },
        },
      },
    },
  };
}

export function eliminarInstanciaVisual(
  state: EditorState,
  instance_id: string,
): EditorState {
  const instances = { ...state.snapshot.visual.instances };
  delete instances[instance_id];

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      visual: { ...state.snapshot.visual, instances },
    },
  };
}

export function crearContexto(
  state: EditorState,
  id: string,
  connective: MotorConnective,
  x: number,
  y: number,
  radius: number = 100,
  shape: string = "ellipse",
): EditorState {
  if (state.snapshot.logic.sets.some((s) => s.id === id)) return state;

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: {
        ...state.snapshot.logic,
        sets: [
          ...state.snapshot.logic.sets,
          { id, connective, subsets: [], result_alias: null },
        ],
      },
      visual: {
        ...state.snapshot.visual,
        sets: {
          ...state.snapshot.visual.sets,
          [id]: { x, y, radius, shape },
        },
      },
    },
  };
}

export function eliminarContexto(state: EditorState, id: string): EditorState {
  const sets = state.snapshot.logic.sets.filter((s) => s.id !== id);

  const setsCleaned = sets.map((s) => ({
    ...s,
    subsets: s.subsets.filter((sub) => sub !== id),
  }));

  const variables = state.snapshot.logic.variables.map((v) => ({
    ...v,
    memberships: v.memberships.filter((m) => m !== id),
  }));

  const visualSets = { ...state.snapshot.visual.sets };
  delete visualSets[id];

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: { ...state.snapshot.logic, sets: setsCleaned, variables },
      visual: { ...state.snapshot.visual, sets: visualSets },
    },
  };
}

export function crearRelacion(
  state: EditorState,
  id: string,
  from_variable: string,
  to_variable: string,
  connective: MotorConnective,
  color: string = "#000000",
  thickness: number = 2,
): EditorState {
  if (state.snapshot.logic.relations.some((r) => r.id === id)) return state;

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: {
        ...state.snapshot.logic,
        relations: [
          ...state.snapshot.logic.relations,
          { id, from_variable, to_variable, connective },
        ],
      },
      visual: {
        ...state.snapshot.visual,
        relations: {
          ...state.snapshot.visual.relations,
          [id]: { color, thickness },
        },
      },
    },
  };
}

export function eliminarRelacion(state: EditorState, id: string): EditorState {
  const relations = state.snapshot.logic.relations.filter((r) => r.id !== id);
  const visualRelations = { ...state.snapshot.visual.relations };
  delete visualRelations[id];

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: { ...state.snapshot.logic, relations },
      visual: { ...state.snapshot.visual, relations: visualRelations },
    },
  };
}

export function asignarVariableAContexto(
  state: EditorState,
  variable_id: string,
  set_id: string,
): EditorState {
  const variables = state.snapshot.logic.variables.map((v) => {
    if (v.id === variable_id && !v.memberships.includes(set_id)) {
      return { ...v, memberships: [...v.memberships, set_id] };
    }
    return v;
  });

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: { ...state.snapshot.logic, variables },
    },
  };
}

export function quitarVariableDeContexto(
  state: EditorState,
  variable_id: string,
  set_id: string,
): EditorState {
  const variables = state.snapshot.logic.variables.map((v) => {
    if (v.id === variable_id) {
      return { ...v, memberships: v.memberships.filter((m) => m !== set_id) };
    }
    return v;
  });

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: { ...state.snapshot.logic, variables },
    },
  };
}

export function actualizarValorVerdad(
  state: EditorState,
  variable_id: string,
  truth_value: BelnapValue,
): EditorState {
  const variables = state.snapshot.logic.variables.map((v) =>
    v.id === variable_id ? { ...v, truth_value } : v,
  );

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      logic: { ...state.snapshot.logic, variables },
    },
  };
}

export function guardarResultadoEjecucion(
  state: EditorState,
  execution_trace: ExecutionTrace | undefined,
): EditorState {
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      meta: {
        ...state.snapshot.meta,
        editor_mode: execution_trace ? "ejecucion" : "edicion",
      },
      execution_trace,
    },
  };
}
