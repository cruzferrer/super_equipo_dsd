import type {
  PlaygroundSnapshot,
  ValidationResult,
  EditorValidationError,
} from "../domain/editorTypes";

function err(
  field: string,
  message: string,
  entityId?: string,
): EditorValidationError {
  return { field, message, severity: "error", entityId };
}

function hasCycle(
  start: string,
  subconjuntosMap: Record<string, string[]>,
  visited: Set<string> = new Set(),
  path: Set<string> = new Set(),
): boolean {
  if (path.has(start)) return true;
  if (visited.has(start)) return false;

  visited.add(start);
  path.add(start);

  for (const sub of subconjuntosMap[start] ?? []) {
    if (hasCycle(sub, subconjuntosMap, visited, new Set(path))) return true;
  }

  return false;
}

export function validarSnapshot(
  snapshot: PlaygroundSnapshot,
  available_connectives: string[],
): ValidationResult {
  const errores: EditorValidationError[] = [];
  const valid_belnap = new Set(snapshot.meta.belnap_domain);
  const connectives = new Set(available_connectives);

  const variablesIds = new Set(snapshot.logic.variables.map((v) => v.id));
  const setsIds = new Set(snapshot.logic.sets.map((s) => s.id));

  for (const v of snapshot.logic.variables) {
    if (!valid_belnap.has(v.truth_value)) {
      errores.push(
        err(
          `logic.variables[${v.id}].truth_value`,
          `Valor Belnap inválido: ${v.truth_value}`,
          v.id,
        ),
      );
    }
    for (const setId of v.memberships) {
      if (!setsIds.has(setId)) {
        errores.push(
          err(
            `logic.variables[${v.id}].memberships`,
            `Apunta a un contexto inexistente: ${setId}`,
            v.id,
          ),
        );
      }
    }
  }

  const subMap: Record<string, string[]> = {};
  for (const s of snapshot.logic.sets) {
    subMap[s.id] = s.subsets;
    if (!connectives.has(s.connective)) {
      errores.push(
        err(
          `logic.sets[${s.id}].connective`,
          `Conectivo desconocido: ${s.connective}`,
          s.id,
        ),
      );
    }
    for (const subId of s.subsets) {
      if (!setsIds.has(subId)) {
        errores.push(
          err(
            `logic.sets[${s.id}].subsets`,
            `Subconjunto inexistente: ${subId}`,
            s.id,
          ),
        );
      }
    }
  }

  for (const s of snapshot.logic.sets) {
    if (hasCycle(s.id, subMap)) {
      errores.push(
        err(
          `logic.sets[${s.id}].subsets`,
          `Ciclo detectado en la jerarquía de subconjuntos.`,
          s.id,
        ),
      );
    }
  }

  for (const r of snapshot.logic.relations) {
    if (!variablesIds.has(r.from_variable)) {
      errores.push(
        err(
          `logic.relations[${r.id}].from_variable`,
          `Origen inexistente: ${r.from_variable}`,
          r.id,
        ),
      );
    }
    if (!variablesIds.has(r.to_variable)) {
      errores.push(
        err(
          `logic.relations[${r.id}].to_variable`,
          `Destino inexistente: ${r.to_variable}`,
          r.id,
        ),
      );
    }
    if (!connectives.has(r.connective)) {
      errores.push(
        err(
          `logic.relations[${r.id}].connective`,
          `Conectivo desconocido: ${r.connective}`,
          r.id,
        ),
      );
    }
  }

  for (const [instId, inst] of Object.entries(snapshot.visual.instances)) {
    if (!variablesIds.has(inst.variable_id)) {
      errores.push(
        err(
          `visual.instances[${instId}].variable_id`,
          `Instancia visual apunta a variable lógica inexistente: ${inst.variable_id}`,
          instId,
        ),
      );
    }
  }

  if (snapshot.meta.max_iterations < 1 || snapshot.meta.max_iterations > 500) {
    errores.push(
      err(
        `meta.max_iterations`,
        `Fuera de rango (1-500): ${snapshot.meta.max_iterations}`,
      ),
    );
  }

  return {
    valid: errores.length === 0,
    errors: errores,
  };
}
