import type { PlaygroundSnapshot, MotorConnective } from "./editorTypes";

export interface EditorState {
  snapshot: PlaygroundSnapshot;
  available_connectives: MotorConnective[];
}

export function createInitialState(): EditorState {
  return {
    snapshot: {
      meta: {
        schema_version: "3.0",
        editor_mode: "edicion",
        belnap_domain: ["V", "F", "N", "B"],
        max_iterations: 100,
      },
      logic: {
        variables: [],
        sets: [],
        relations: [],
      },
      visual: {
        instances: {},
        sets: {},
        relations: {},
      },
    },
    available_connectives: [
      "AND",
      "OR",
      "IMPLIES",
      "BICONDITIONAL",
      "PROPAGATION",
      "CONTRAPOSITIONAL",
      "KJOIN",
    ],
  };
}
