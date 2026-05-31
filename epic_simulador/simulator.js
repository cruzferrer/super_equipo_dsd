// EPiC Playground Simulator & Visualizer Core Logic

// ==========================================
// 0. Imports del Editor Bridge
// ==========================================
import * as EditorBridge from './editor-bridge.js';

// ==========================================
// 1. Preset Simulation Examples (JSON snapshots)
// ==========================================
const PRESETS = {
  simple: {
    meta: { version: "3.0", max_iterations: 10, belnap_domain: ["V", "F", "N", "B"], editor_mode: "ejecucion" },
    logic: {
      variables: [
        { id: "p", truth_value: "V", memberships: ["set_A"] },
        { id: "q", truth_value: "N", memberships: ["set_B"] }
      ],
      sets: [
        { id: "set_A", connective: "PROPAGATION", subsets: [], result_alias: null },
        { id: "set_B", connective: "PROPAGATION", subsets: [], result_alias: null }
      ],
      relations: [
        { id: "rel1", from_variable: "p", to_variable: "q", connective: "PROPAGATION" }
      ]
    },
    visual: {
      sets: {
        set_A: { x: 150, y: 200, radius: 80, shape: "circle" },
        set_B: { x: 450, y: 200, radius: 80, shape: "circle" }
      },
      instances: {
        inst_p: { id: "inst_p", variable_id: "p", x: 150, y: 200 },
        inst_q: { id: "inst_q", variable_id: "q", x: 450, y: 200 }
      },
      relations: {
        rel1: { color: "#3B82F6", thickness: 2 }
      }
    },
    execution_trace: {
      total_iterations: 2,
      stabilized: true,
      actions: [
        {
          step: 1,
          variable_id: "q",
          old_value: "N",
          new_value: "V",
          description: "La variable 'q' cambió de N a V vía PROPAGATION desde 'p'",
          is_stabilized: false
        },
        {
          step: 2,
          variable_id: "*",
          old_value: "*",
          new_value: "*",
          description: "El sistema se estabilizó en la iteración 2.",
          is_stabilized: true
        }
      ]
    }
  },

  contrapositive: {
    meta: { version: "3.0", max_iterations: 10, belnap_domain: ["V", "F", "N", "B"], editor_mode: "ejecucion" },
    logic: {
      variables: [
        { id: "p", truth_value: "N", memberships: ["set_A"] },
        { id: "q", truth_value: "F", memberships: ["set_B"] }
      ],
      sets: [
        { id: "set_A", connective: "CONTRAPOSITIONAL", subsets: [], result_alias: null },
        { id: "set_B", connective: "CONTRAPOSITIONAL", subsets: [], result_alias: null }
      ],
      relations: [
        { id: "rel1", from_variable: "p", to_variable: "q", connective: "CONTRAPOSITIONAL" }
      ]
    },
    visual: {
      sets: {
        set_A: { x: 150, y: 200, radius: 80, shape: "circle" },
        set_B: { x: 450, y: 200, radius: 80, shape: "circle" }
      },
      instances: {
        inst_p: { id: "inst_p", variable_id: "p", x: 150, y: 200 },
        inst_q: { id: "inst_q", variable_id: "q", x: 450, y: 200 }
      },
      relations: {
        rel1: { color: "#EC4899", thickness: 2 }
      }
    },
    execution_trace: {
      total_iterations: 2,
      stabilized: true,
      actions: [
        {
          step: 1,
          variable_id: "p",
          old_value: "N",
          new_value: "F",
          description: "La variable 'p' cambió de N a F vía CONTRAPOSITIONAL (Modus Tollens) desde 'q'",
          is_stabilized: false
        },
        {
          step: 2,
          variable_id: "*",
          old_value: "*",
          new_value: "*",
          description: "El sistema se estabilizó en la iteración 2.",
          is_stabilized: true
        }
      ]
    }
  },

  contradiction: {
    meta: { version: "3.0", max_iterations: 10, belnap_domain: ["V", "F", "N", "B"], editor_mode: "ejecucion" },
    logic: {
      variables: [
        { id: "p1", truth_value: "V", memberships: ["set_A"] },
        { id: "p2", truth_value: "F", memberships: ["set_B"] },
        { id: "q", truth_value: "N", memberships: ["set_C"] }
      ],
      sets: [
        { id: "set_A", connective: "PROPAGATION", subsets: [], result_alias: null },
        { id: "set_B", connective: "PROPAGATION", subsets: [], result_alias: null },
        { id: "set_C", connective: "PROPAGATION", subsets: [], result_alias: null }
      ],
      relations: [
        { id: "rel1", from_variable: "p1", to_variable: "q", connective: "PROPAGATION" },
        { id: "rel2", from_variable: "p2", to_variable: "q", connective: "PROPAGATION" }
      ]
    },
    visual: {
      sets: {
        set_A: { x: 150, y: 110, radius: 70, shape: "circle" },
        set_B: { x: 150, y: 290, radius: 70, shape: "circle" },
        set_C: { x: 450, y: 200, radius: 85, shape: "circle" }
      },
      instances: {
        inst_p1: { id: "inst_p1", variable_id: "p1", x: 150, y: 110 },
        inst_p2: { id: "inst_p2", variable_id: "p2", x: 150, y: 290 },
        inst_q: { id: "inst_q", variable_id: "q", x: 450, y: 200 }
      },
      relations: {
        rel1: { color: "#3B82F6", thickness: 2 },
        rel2: { color: "#EF4444", thickness: 2 }
      }
    },
    execution_trace: {
      total_iterations: 2,
      stabilized: true,
      actions: [
        {
          step: 1,
          variable_id: "q",
          old_value: "N",
          new_value: "B",
          description: "La variable 'q' cambió de N a B (Contradicción/Ambos) al recibir evidencia V y F",
          is_stabilized: false
        },
        {
          step: 2,
          variable_id: "*",
          old_value: "*",
          new_value: "*",
          description: "El sistema se estabilizó en la iteración 2.",
          is_stabilized: true
        }
      ]
    }
  },

  loop: {
    meta: { version: "3.0", max_iterations: 15, belnap_domain: ["V", "F", "N", "B"], editor_mode: "ejecucion" },
    logic: {
      variables: [
        { id: "p", truth_value: "V", memberships: ["set_A"] },
        { id: "q", truth_value: "N", memberships: ["set_B"] },
        { id: "r", truth_value: "N", memberships: ["set_C"] }
      ],
      sets: [
        { id: "set_A", connective: "PROPAGATION", subsets: [], result_alias: null },
        { id: "set_B", connective: "PROPAGATION", subsets: [], result_alias: null },
        { id: "set_C", connective: "PROPAGATION", subsets: [], result_alias: null }
      ],
      relations: [
        { id: "rel1", from_variable: "p", to_variable: "q", connective: "PROPAGATION" },
        { id: "rel2", from_variable: "q", to_variable: "r", connective: "PROPAGATION" },
        { id: "rel3", from_variable: "r", to_variable: "p", connective: "PROPAGATION" }
      ]
    },
    visual: {
      sets: {
        set_A: { x: 150, y: 150, radius: 70, shape: "circle" },
        set_B: { x: 450, y: 150, radius: 70, shape: "circle" },
        set_C: { x: 300, y: 340, radius: 70, shape: "circle" }
      },
      instances: {
        inst_p: { id: "inst_p", variable_id: "p", x: 150, y: 150 },
        inst_q: { id: "inst_q", variable_id: "q", x: 450, y: 150 },
        inst_r: { id: "inst_r", variable_id: "r", x: 300, y: 340 }
      },
      relations: {
        rel1: { color: "#3B82F6", thickness: 2 },
        rel2: { color: "#3B82F6", thickness: 2 },
        rel3: { color: "#3B82F6", thickness: 2 }
      }
    },
    execution_trace: {
      total_iterations: 4,
      stabilized: true,
      actions: [
        {
          step: 1,
          variable_id: "q",
          old_value: "N",
          new_value: "V",
          description: "La variable 'q' se propaga a V desde 'p'",
          is_stabilized: false
        },
        {
          step: 2,
          variable_id: "r",
          old_value: "N",
          new_value: "V",
          description: "La variable 'r' se propaga a V desde 'q'",
          is_stabilized: false
        },
        {
          step: 3,
          variable_id: "p",
          old_value: "V",
          new_value: "V",
          description: "La variable 'p' recibe V desde 'r' (Refuerzo)",
          is_stabilized: false
        },
        {
          step: 4,
          variable_id: "*",
          old_value: "*",
          new_value: "*",
          description: "El sistema se estabilizó.",
          is_stabilized: true
        }
      ]
    }
  }
};

// ==========================================
// 2. Global State Variables
// ==========================================
let simState = {
  snapshot: null,
  currentStep: 0,
  isPlaying: false,
  playInterval: null,
  animationTimeout: null,
  speed: 800,
  zoom: 1,
  pan: { x: 0, y: 0 },
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  activeTab: "box-view",
  variableHistory: {},
  boxPairs: [],
  relativeCoordinates: {}
};

// State for custom visual designer built in-browser
let editorGraph = {
  sets: {},
  instances: {},
  relations: {},
  logic: {
    variables: [],
    sets: [],
    relations: []
  }
};

// ==========================================
// 3. Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  
  // Inicializar el Editor Bridge
  console.log('[Simulator] Inicializando Editor Bridge...');
  EditorBridge.initializeEditorBridge('http://localhost:8000');
  
  // Registrar callback para actualizar la vista cuando cambie el estado del editor
  EditorBridge.onStateChange((snapshot) => {
    console.log('[Simulator] Estado del editor actualizado, renderizando preview...');
    renderEditorPreview();
  });
  
  // Registrar callback para manejar errores
  EditorBridge.onError((errors) => {
    console.error('[Simulator] Errores del editor:', errors);
    displayEditorErrors(errors);
  });
  
  setupEventListeners();
  setupEditorEventListeners();
  loadSnapshot(PRESETS.simple);
  
  console.log('[Simulator] Inicialización completa');
});

// ==========================================
// 4. File and JSON Upload handlers
// ==========================================
function setupEventListeners() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const btnPaste = document.getElementById("btnPaste");
  const jsonTextArea = document.getElementById("jsonTextArea");

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  btnPaste.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(jsonTextArea.value);
      loadSnapshot(parsed);
    } catch (err) {
      alert("JSON inválido: " + err.message);
    }
  });

  document.querySelectorAll(".btn-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const presetName = btn.getAttribute("data-preset");
      if (PRESETS[presetName]) {
        loadSnapshot(PRESETS[presetName]);
      }
    });
  });

  document.getElementById("btnPlay").addEventListener("click", togglePlay);
  document.getElementById("btnNext").addEventListener("click", stepForward);
  document.getElementById("btnPrev").addEventListener("click", stepBackward);
  document.getElementById("btnReset").addEventListener("click", resetSimulation);

  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");
  speedSlider.addEventListener("input", (e) => {
    simState.speed = parseInt(e.target.value);
    speedValue.textContent = `${simState.speed}ms`;
    if (simState.isPlaying) {
      pause();
      play();
    }
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
      simState.activeTab = tabId;

      renderActiveTab();
    });
  });

  const canvasContainer = document.getElementById("globalCanvasContainer");
  canvasContainer.addEventListener("mousedown", (e) => {
    simState.isDragging = true;
    simState.dragStart = { x: e.clientX - simState.pan.x, y: e.clientY - simState.pan.y };
  });

  window.addEventListener("mousemove", (e) => {
    if (!simState.isDragging || simState.activeTab !== "global-view") return;
    simState.pan.x = e.clientX - simState.dragStart.x;
    simState.pan.y = e.clientY - simState.dragStart.y;
    applyZoomPan();
  });

  window.addEventListener("mouseup", () => {
    simState.isDragging = false;
  });

  canvasContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      simState.zoom *= zoomFactor;
    } else {
      simState.zoom /= zoomFactor;
    }
    simState.zoom = Math.min(Math.max(simState.zoom, 0.2), 5);
    applyZoomPan();
  });

  document.getElementById("btnZoomIn").addEventListener("click", () => {
    simState.zoom *= 1.2;
    applyZoomPan();
  });
  document.getElementById("btnZoomOut").addEventListener("click", () => {
    simState.zoom /= 1.2;
    applyZoomPan();
  });
  document.getElementById("btnZoomReset").addEventListener("click", () => {
    simState.zoom = 1;
    simState.pan = { x: 0, y: 0 };
    applyZoomPan();
  });
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      loadSnapshot(parsed);
      document.getElementById("jsonTextArea").value = JSON.stringify(parsed, null, 2);
    } catch (err) {
      alert("Error al parsear el archivo: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// 5. Dynamic Ball Visibility Algorithm (History-Aware)
// ==========================================
// A ball is visible at step 's' if its value is not "N" (neutral/none)
// AND it has not propagated its value to any target with a newer update.
function isBallVisibleAtStep(varId, step) {
  const valHistory = simState.variableHistory[varId];
  if (!valHistory) return false;
  const val = valHistory[step];
  if (val === "N") return false;

  const logic = simState.snapshot.logic;
  const actions = simState.snapshot.execution_trace.actions;

  // Helper to find the last step <= 'step' where a variable was updated
  const getLastUpdateStep = (vId) => {
    let last = -1;
    const initialVal = simState.variableHistory[vId]?.[0];
    if (initialVal && initialVal !== "N") {
      last = 0; // Starts active at initial step
    }
    
    actions.forEach(act => {
      if (act.step <= step && act.variable_id === vId) {
        last = act.step;
      }
    });
    return last;
  };

  const myLastUpdate = getLastUpdateStep(varId);

  // 1. Direct Flow Check: If we propagated to a target and the target has a newer update,
  // then the ball has left this circle and moved forward.
  const directRelations = logic.relations.filter(r => r.from_variable === varId && r.connective !== "CONTRAPOSITIONAL");
  for (const rel of directRelations) {
    const targetVal = simState.variableHistory[rel.to_variable]?.[step];
    if (targetVal && targetVal !== "N") {
      const targetLastUpdate = getLastUpdateStep(rel.to_variable);
      if (myLastUpdate < targetLastUpdate) {
        return false;
      }
    }
  }

  // 2. Contrapositive Flow Check: Modus Tollens.
  // The flow travels backward (target to source).
  // If we are the target and the source has been updated more recently, the ball retroceded.
  const contraRelations = logic.relations.filter(r => r.to_variable === varId && r.connective === "CONTRAPOSITIONAL");
  for (const rel of contraRelations) {
    const sourceVal = simState.variableHistory[rel.from_variable]?.[step];
    if (sourceVal && sourceVal !== "N") {
      const sourceLastUpdate = getLastUpdateStep(rel.from_variable);
      if (myLastUpdate < sourceLastUpdate) {
        return false;
      }
    }
  }

  return true;
}

// ==========================================
// 6. Core Parser & Setup State
// ==========================================
function loadSnapshot(snapshot) {
  if (!snapshot.logic) snapshot.logic = { variables: [], sets: [], relations: [] };
  if (!snapshot.visual) snapshot.visual = { instances: {}, sets: {}, relations: {} };
  
  let variablesList = [];
  if (Array.isArray(snapshot.logic.variables)) {
    variablesList = snapshot.logic.variables;
  } else if (snapshot.logic.variables && typeof snapshot.logic.variables === "object") {
    variablesList = Object.values(snapshot.logic.variables);
  }
  
  variablesList.forEach(v => {
    if (v.truth_value === undefined && v.value !== undefined) {
      v.truth_value = v.value;
    }
  });
  snapshot.logic.variables = variablesList;

  let relationsList = [];
  if (Array.isArray(snapshot.logic.relations)) {
    relationsList = snapshot.logic.relations;
  } else if (snapshot.logic.relations && typeof snapshot.logic.relations === "object") {
    relationsList = Object.values(snapshot.logic.relations);
  }
  
  relationsList.forEach(r => {
    if (r.from_variable === undefined && r.source !== undefined) {
      r.from_variable = r.source;
    }
    if (r.to_variable === undefined && r.target !== undefined) {
      r.to_variable = r.target;
    }
  });
  snapshot.logic.relations = relationsList;

  let setsList = [];
  if (Array.isArray(snapshot.logic.sets)) {
    setsList = snapshot.logic.sets;
  } else if (snapshot.logic.sets && typeof snapshot.logic.sets === "object") {
    setsList = Object.values(snapshot.logic.sets);
  }
  
  setsList.forEach(s => {
    if (s.subsets === undefined) s.subsets = [];
    if (s.connective === undefined) s.connective = "PROPAGATION";
  });
  snapshot.logic.sets = setsList;

  if (!snapshot.execution_trace) {
    snapshot.execution_trace = {
      total_iterations: 1,
      stabilized: true,
      actions: [
        {
          step: 1,
          variable_id: "*",
          old_value: "*",
          new_value: "*",
          description: "Sistema inicial (Sin acciones de propagación en la traza).",
          is_stabilized: true
        }
      ]
    };
  } else {
    let actions = snapshot.execution_trace.actions || [];
    actions.forEach(act => {
      if (act.variable_id === undefined && act.target_id !== undefined) {
        act.variable_id = act.target_id;
      }
      if (act.new_value === undefined && act.result_value !== undefined) {
        act.new_value = act.result_value;
      }
      if (act.is_stabilized === undefined) {
        act.is_stabilized = act.action_type === "stabilization" || act.variable_id === "*";
      }
    });
    snapshot.execution_trace.actions = actions;
    if (snapshot.execution_trace.total_iterations === undefined && snapshot.execution_trace.iterations !== undefined) {
      snapshot.execution_trace.total_iterations = snapshot.execution_trace.iterations;
    }
  }

  simState.snapshot = snapshot;
  simState.currentStep = 0;
  pause();

  buildVariableHistory();
  calculateRelativeCoordinates();
  extractBoxPairs();
  updateUI();

  simState.zoom = 1;
  simState.pan = { x: 0, y: 0 };
  applyZoomPan();

  setTimeout(fitGlobalCanvas, 50);
}

function buildVariableHistory() {
  const vars = simState.snapshot.logic.variables;
  const actions = simState.snapshot.execution_trace.actions;
  
  const history = {};
  vars.forEach(v => {
    history[v.id] = [v.truth_value || "N"];
  });

  let maxStep = 0;
  actions.forEach(a => {
    if (a.step > maxStep) maxStep = a.step;
  });

  for (let s = 1; s <= maxStep; s++) {
    vars.forEach(v => {
      const prevVal = history[v.id][s - 1];
      history[v.id][s] = prevVal;
    });

    const stepActions = actions.filter(a => a.step === s);
    stepActions.forEach(act => {
      if (act.variable_id && act.variable_id !== "*") {
        if (history[act.variable_id]) {
          history[act.variable_id][s] = act.new_value;
        }
      }
    });
  }

  simState.variableHistory = history;
}

function calculateRelativeCoordinates() {
  const visual = simState.snapshot.visual;
  const logic = simState.snapshot.logic;
  simState.relativeCoordinates = {};

  Object.entries(visual.instances).forEach(([instId, inst]) => {
    const varLog = logic.variables.find(v => v.id === inst.variable_id);
    if (!varLog) return;

    let parentSetId = null;
    
    if (varLog.memberships && varLog.memberships.length > 0) {
      parentSetId = varLog.memberships.find(setId => visual.sets[setId]);
    }

    if (!parentSetId) {
      const sets = Object.entries(visual.sets);
      for (const [setId, setVal] of sets) {
        const dx = inst.x - setVal.x;
        const dy = inst.y - setVal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= setVal.radius) {
          parentSetId = setId;
          break;
        }
      }
    }

    if (parentSetId) {
      const parentSet = visual.sets[parentSetId];
      simState.relativeCoordinates[instId] = {
        setId: parentSetId,
        dx: inst.x - parentSet.x,
        dy: inst.y - parentSet.y
      };
    } else {
      simState.relativeCoordinates[instId] = {
        setId: null,
        dx: 0,
        dy: 0
      };
    }
  });
}

function extractBoxPairs() {
  const logic = simState.snapshot.logic;
  const visual = simState.snapshot.visual;
  const setList = Object.keys(visual.sets);
  
  if (setList.length === 0) {
    simState.boxPairs = [];
    return;
  }

  const setTransitions = [];
  const addedPairs = new Set();

  logic.relations.forEach(rel => {
    const fromVar = logic.variables.find(v => v.id === rel.from_variable);
    const toVar = logic.variables.find(v => v.id === rel.to_variable);
    if (!fromVar || !toVar) return;

    const fromInst = Object.values(visual.instances).find(inst => inst.variable_id === fromVar.id);
    const toInst = Object.values(visual.instances).find(inst => inst.variable_id === toVar.id);
    if (!fromInst || !toInst) return;

    const fromSetId = simState.relativeCoordinates[fromInst.id]?.setId;
    const toSetId = simState.relativeCoordinates[toInst.id]?.setId;

    if (fromSetId && toSetId && fromSetId !== toSetId) {
      const pairKey = `${fromSetId}->${toSetId}`;
      if (!addedPairs.has(pairKey)) {
        addedPairs.add(pairKey);
        setTransitions.push({ from: fromSetId, to: toSetId, relationId: rel.id });
      }
    }
  });

  let pairs = [];
  if (setTransitions.length > 0) {
    setTransitions.forEach(trans => {
      pairs.push([trans.from, trans.to]);
    });
  }

  if (pairs.length === 0 && setList.length > 1) {
    const sortedSets = setList.map(id => ({ id, x: visual.sets[id].x }))
                            .sort((a, b) => a.x - b.x)
                            .map(s => s.id);
    for (let i = 0; i < sortedSets.length - 1; i++) {
      pairs.push([sortedSets[i], sortedSets[i+1]]);
    }
  }

  if (pairs.length === 0 && setList.length === 1) {
    pairs.push([setList[0], setList[0]]);
  }

  simState.boxPairs = pairs;
}

// ==========================================
// 7. UI Updates
// ==========================================
function updateUI() {
  const trace = simState.snapshot.execution_trace;
  const badge = document.getElementById("stabilizedBadge");
  const iterationsEl = document.getElementById("iterationCount");
  const totalStepsEl = document.getElementById("totalSteps");
  const currentStepEl = document.getElementById("currentStep");

  if (trace.stabilized) {
    badge.textContent = "Estabilizado";
    badge.className = "badge badge-success";
  } else {
    badge.textContent = "Divergente";
    badge.className = "badge badge-danger";
  }

  iterationsEl.textContent = trace.total_iterations;
  
  const totalSteps = trace.actions.length;
  totalStepsEl.textContent = totalSteps;
  currentStepEl.textContent = simState.currentStep;

  buildTraceLogHTML();
  renderActiveTab();
}

function buildTraceLogHTML() {
  const traceList = document.getElementById("traceList");
  traceList.innerHTML = "";
  const actions = simState.snapshot.execution_trace.actions;

  if (actions.length === 0) {
    traceList.innerHTML = `<div class="trace-placeholder">Sin acciones registradas.</div>`;
    return;
  }

  actions.forEach((act, idx) => {
    const item = document.createElement("div");
    item.className = `trace-item ${simState.currentStep === idx + 1 ? 'active' : ''}`;
    
    let valIndicator = "";
    if (act.new_value && act.new_value !== "*") {
      valIndicator = `<span class="val-badge val-${act.new_value.toLowerCase()}"></span>`;
    }

    item.innerHTML = `
      <span class="trace-step-badge">P${act.step}</span>
      <div class="trace-details">
        <p class="trace-desc">${act.description}</p>
        <div class="trace-meta">
          ${valIndicator}
          <span>${act.variable_id !== "*" ? `Variable: ${act.variable_id}` : 'Estabilización'}</span>
        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      jumpToStep(idx + 1);
    });

    traceList.appendChild(item);
  });

  const activeItem = traceList.querySelector(".trace-item.active");
  if (activeItem) {
    activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// ==========================================
// 8. SVG Rendering Engine
// ==========================================
function renderActiveTab() {
  if (simState.activeTab === "box-view") {
    renderBoxView();
  } else if (simState.activeTab === "global-view") {
    renderGlobalView();
  } else if (simState.activeTab === "editor-view") {
    renderEditorPreview();
  }
}

// --- BOX VIEW RENDER ---
function renderBoxView() {
  const container = document.getElementById("boxesGrid");
  container.innerHTML = "";

  if (simState.boxPairs.length === 0) {
    container.innerHTML = `
      <div class="no-data-placeholder">
        <i data-lucide="box" class="large-icon"></i>
        <h3>No hay conjuntos para emparejar</h3>
      </div>`;
    lucide.createIcons();
    return;
  }

  const visual = simState.snapshot.visual;
  const logic = simState.snapshot.logic;

  simState.boxPairs.forEach((pair, boxIdx) => {
    const setIdLeft = pair[0];
    const setIdRight = pair[1];

    const setLeft = visual.sets[setIdLeft];
    const setRight = visual.sets[setIdRight];
    if (!setLeft || !setRight) return;

    const card = document.createElement("div");
    card.className = "box-card card";
    card.innerHTML = `
      <div class="box-card-header">
        <span class="box-title">Cajita ${boxIdx + 1}: ${setIdLeft === setIdRight ? setIdLeft : `${setIdLeft} &rarr; ${setIdRight}`}</span>
        <span class="box-tag">Par Consecutivo</span>
      </div>
      <div class="box-svg-container" id="box-svg-${boxIdx}">
      </div>
    `;

    container.appendChild(card);

    const svgContainer = document.getElementById(`box-svg-${boxIdx}`);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 420 200");
    svgContainer.appendChild(svg);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <marker id="arrow-box-${boxIdx}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6" />
      </marker>
    `;
    svg.appendChild(defs);

    const leftCenterX = 110;
    const rightCenterX = 310;
    const centerY = 100;
    
    const leftRadius = Math.min(setLeft.radius, 70);
    const rightRadius = Math.min(setRight.radius, 70);

    // Draw sets
    const gSetL = drawSetSVG(setIdLeft, setLeft, leftCenterX, centerY, leftRadius);
    svg.appendChild(gSetL);

    if (setIdLeft !== setIdRight) {
      const gSetR = drawSetSVG(setIdRight, setRight, rightCenterX, centerY, rightRadius);
      svg.appendChild(gSetR);
    }

    const ballCoords = {};

    // Draw variables with Visibility logic
    const drawVariablesForSet = (setId, cx) => {
      Object.entries(visual.instances).forEach(([instId, inst]) => {
        const relData = simState.relativeCoordinates[instId];
        if (relData && relData.setId === setId) {
          const scale = cx === leftCenterX ? (leftRadius / setLeft.radius) : (rightRadius / setRight.radius);
          const bx = cx + relData.dx * scale;
          const by = centerY + relData.dy * scale;

          const varLog = logic.variables.find(v => v.id === inst.variable_id);
          if (!varLog) return;

          const valHistory = simState.variableHistory[varLog.id];
          const curVal = valHistory ? valHistory[simState.currentStep] : "N";

          // Calculate visual ball visibility for step
          const isVisible = isBallVisibleAtStep(varLog.id, simState.currentStep);

          const gBall = drawBallSVG(inst.variable_id, instId, bx, by, curVal, isVisible);
          svg.appendChild(gBall);

          ballCoords[varLog.id] = { x: bx, y: by };
        }
      });
    };

    drawVariablesForSet(setIdLeft, leftCenterX);
    if (setIdLeft !== setIdRight) {
      drawVariablesForSet(setIdRight, rightCenterX);
    }

    // Draw implication arrows
    logic.relations.forEach(rel => {
      const fromCoord = ballCoords[rel.from_variable];
      const toCoord = ballCoords[rel.to_variable];

      if (fromCoord && toCoord) {
        const relVisual = visual.relations[rel.id] || { color: "#3B82F6", thickness: 2 };
        
        const dx = toCoord.x - fromCoord.x;
        const dy = toCoord.y - fromCoord.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const radiusBall = 15;

        const startX = fromCoord.x + (dx / len) * radiusBall;
        const startY = fromCoord.y + (dy / len) * radiusBall;
        const endX = toCoord.x - (dx / len) * (radiusBall + 6);
        const endY = toCoord.y - (dy / len) * (radiusBall + 6);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", `box-path-${boxIdx}-${rel.id}`);
        
        let pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
        if (Math.abs(dy) < 5) {
          const midX = (startX + endX) / 2;
          const ctrlY = startY - 15;
          pathD = `M ${startX} ${startY} Q ${midX} ${ctrlY} ${endX} ${endY}`;
        }

        path.setAttribute("d", pathD);
        path.setAttribute("class", `svg-relation-path ${relVisual.is_contrapositive ? 'contrapositive' : ''}`);
        path.setAttribute("stroke", relVisual.color || "#3B82F6");
        path.setAttribute("stroke-width", relVisual.thickness || 2);
        path.setAttribute("marker-end", `url(#arrow-box-${boxIdx})`);
        
        svg.appendChild(path);
      }
    });
  });
}

// --- GLOBAL CANVAS RENDER ---
function renderGlobalView() {
  const container = document.getElementById("globalCanvasContainer");
  container.innerHTML = "";

  const visual = simState.snapshot.visual;
  const logic = simState.snapshot.logic;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "globalSvg");
  container.appendChild(svg);

  const gTransform = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gTransform.setAttribute("id", "globalTransformGroup");
  svg.appendChild(gTransform);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <marker id="arrow-global" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6" />
    </marker>
  `;
  gTransform.appendChild(defs);

  Object.entries(visual.sets).forEach(([setId, setVal]) => {
    const gSet = drawSetSVG(setId, setVal, setVal.x, setVal.y, setVal.radius);
    gTransform.appendChild(gSet);
  });

  const ballCoords = {};

  Object.entries(visual.instances).forEach(([instId, inst]) => {
    const varLog = logic.variables.find(v => v.id === inst.variable_id);
    if (!varLog) return;

    const valHistory = simState.variableHistory[varLog.id];
    const curVal = valHistory ? valHistory[simState.currentStep] : "N";

    const isVisible = isBallVisibleAtStep(varLog.id, simState.currentStep);

    const gBall = drawBallSVG(inst.variable_id, instId, inst.x, inst.y, curVal, isVisible);
    gTransform.appendChild(gBall);

    ballCoords[varLog.id] = { x: inst.x, y: inst.y };
  });

  logic.relations.forEach(rel => {
    const fromCoord = ballCoords[rel.from_variable];
    const toCoord = ballCoords[rel.to_variable];

    if (fromCoord && toCoord) {
      const relVisual = visual.relations[rel.id] || { color: "#3B82F6", thickness: 2 };
      
      const dx = toCoord.x - fromCoord.x;
      const dy = toCoord.y - fromCoord.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const radiusBall = 15;

      const startX = fromCoord.x + (dx / len) * radiusBall;
      const startY = fromCoord.y + (dy / len) * radiusBall;
      const endX = toCoord.x - (dx / len) * (radiusBall + 6);
      const endY = toCoord.y - (dy / len) * (radiusBall + 6);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("id", `global-path-${rel.id}`);
      
      let pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
      if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
        const midX = (startX + endX) / 2 + (dy / len) * 15;
        const midY = (startY + endY) / 2 - (dx / len) * 15;
        pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
      }

      path.setAttribute("d", pathD);
      path.setAttribute("class", `svg-relation-path ${relVisual.is_contrapositive ? 'contrapositive' : ''}`);
      path.setAttribute("stroke", relVisual.color || "#3B82F6");
      path.setAttribute("stroke-width", relVisual.thickness || 2);
      path.setAttribute("marker-end", "url(#arrow-global)");
      
      gTransform.appendChild(path);
    }
  });

  applyZoomPan();
}

function drawSetSVG(setId, setVal, cx, cy, radius) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "g-set-container");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", radius);
  circle.setAttribute("class", "svg-set");
  g.appendChild(circle);

  const textId = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textId.setAttribute("x", cx);
  textId.setAttribute("y", cy - radius + 14);
  textId.setAttribute("class", "svg-set-label");
  textId.textContent = setVal.result_alias || setId;
  g.appendChild(textId);

  if (setVal.connective) {
    const textConn = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textConn.setAttribute("x", cx);
    textConn.setAttribute("y", cy - radius + 25);
    textConn.setAttribute("class", "svg-set-connective");
    textConn.textContent = `[${setVal.connective}]`;
    g.appendChild(textConn);
  }

  return g;
}

function drawBallSVG(varId, instId, x, y, value, isVisible = true) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "g-ball-container");
  g.setAttribute("data-instance-id", instId);
  g.setAttribute("data-variable-id", varId);
  g.setAttribute("style", `opacity: ${isVisible ? 1 : 0}; transition: opacity 0.35s ease-in-out;`);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", 15);
  circle.setAttribute("class", `svg-instance val-${value.toLowerCase()}`);
  g.appendChild(circle);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("class", "svg-instance-label");
  text.textContent = `${varId}:${value}`;
  g.appendChild(text);

  return g;
}

function fitGlobalCanvas() {
  const svg = document.getElementById("globalSvg");
  if (!svg) return;

  const bbox = svg.getBBox();
  const container = document.getElementById("globalCanvasContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (bbox.width === 0 || bbox.height === 0) return;

  const margin = 50;
  const zoomX = (width - margin * 2) / bbox.width;
  const zoomY = (height - margin * 2) / bbox.height;
  const zoom = Math.min(zoomX, zoomY, 1.2);

  simState.zoom = zoom;
  simState.pan.x = (width - bbox.width * zoom) / 2 - bbox.x * zoom;
  simState.pan.y = (height - bbox.height * zoom) / 2 - bbox.y * zoom;

  applyZoomPan();
}

function applyZoomPan() {
  const group = document.getElementById("globalTransformGroup");
  if (group) {
    group.setAttribute("transform", `translate(${simState.pan.x}, ${simState.pan.y}) scale(${simState.zoom})`);
  }
}

// ==========================================
// 9. Simulation Actions & Step Animations (Fail-safe Timeout Flow)
// ==========================================
function stepForward() {
  const actions = simState.snapshot.execution_trace.actions;
  if (simState.currentStep >= actions.length) {
    pause();
    return;
  }

  // Clear any existing animation timeout to force-complete previous step if clicking rapidly
  if (simState.animationTimeout) {
    clearTimeout(simState.animationTimeout);
    simState.animationTimeout = null;
  }

  const nextStepNum = simState.currentStep + 1;
  const stepActions = actions.filter(a => a.step === nextStepNum);

  if (stepActions.length === 0) {
    simState.currentStep = nextStepNum;
    updateUI();
    return;
  }

  // 1. Run parallel animations on top of the DOM at step s-1
  stepActions.forEach(action => {
    if (action.is_stabilized || action.variable_id === "*") {
      pulseStabilization();
    } else {
      triggerSingleActionAnimation(action);
    }
  });

  // 2. Set fail-safe timeout to update state and redraw statically after animation completes (750ms)
  simState.animationTimeout = setTimeout(() => {
    simState.animationTimeout = null;
    simState.currentStep = nextStepNum;
    updateUI();
  }, 750);
}

function pulseStabilization() {
  document.querySelectorAll(".svg-instance").forEach(el => {
    el.animate([
      { transform: "scale(1)", filter: "drop-shadow(0 0 0px transparent)" },
      { transform: "scale(1.15)", filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))" },
      { transform: "scale(1)", filter: "none" }
    ], { duration: 600, easing: "ease-out" });
  });
}

function triggerSingleActionAnimation(action) {
  const logic = simState.snapshot.logic;
  const targetVarId = action.variable_id;
  const newVal = action.new_value;

  const activeRelations = logic.relations.filter(r => r.to_variable === targetVarId);

  if (simState.activeTab === "box-view") {
    simState.boxPairs.forEach((pair, boxIdx) => {
      activeRelations.forEach(rel => {
        // Only trigger animation if the source ball is active in current step (s-1)
        const sourceVal = simState.variableHistory[rel.from_variable]?.[simState.currentStep];
        if (sourceVal && sourceVal !== "N") {
          const pathEl = document.getElementById(`box-path-${boxIdx}-${rel.id}`);
          if (pathEl) {
            // Fade-out source ball inside set as particle departs
            animateElementOpacity(`box-svg-${boxIdx}`, rel.from_variable, 1, 0, 250);

            // Animate particle along path
            animateParticleOnPath(pathEl, newVal, () => {
              // Update target ball text/color and fade it in on arrival
              updateBallValAndShow(`box-svg-${boxIdx}`, targetVarId, newVal);
              animateElementOpacity(`box-svg-${boxIdx}`, targetVarId, 0, 1, 300);
              pulseTargetBall(boxIdx, targetVarId);
            });
          }
        }
      });
    });
  } else {
    // Global Canvas View
    activeRelations.forEach(rel => {
      const sourceVal = simState.variableHistory[rel.from_variable]?.[simState.currentStep];
      if (sourceVal && sourceVal !== "N") {
        const pathEl = document.getElementById(`global-path-${rel.id}`);
        if (pathEl) {
          // Fade-out source
          animateElementOpacityGlobal(rel.from_variable, 1, 0, 250);

          // Animate particle
          animateParticleOnPath(pathEl, newVal, () => {
            // Update target and fade-in
            updateBallValAndShowGlobal(targetVarId, newVal);
            animateElementOpacityGlobal(targetVarId, 0, 1, 300);
            pulseTargetBallGlobal(targetVarId);
          });
        }
      }
    });
  }
}

function animateElementOpacity(boxIdx, variableId, fromOpacity, toOpacity, duration) {
  const boxSvg = document.getElementById(`box-svg-${boxIdx}`);
  if (!boxSvg) return;
  const ballGroup = boxSvg.querySelector(`[data-variable-id="${variableId}"]`);
  if (ballGroup) {
    ballGroup.animate([
      { opacity: fromOpacity },
      { opacity: toOpacity }
    ], { duration: duration, fill: "forwards", easing: "ease-in-out" });
    
    setTimeout(() => {
      ballGroup.style.opacity = toOpacity;
    }, duration);
  }
}

function animateElementOpacityGlobal(variableId, fromOpacity, toOpacity, duration) {
  const globalContainer = document.getElementById("globalCanvasContainer");
  if (!globalContainer) return;
  const ballGroup = globalContainer.querySelector(`[data-variable-id="${variableId}"]`);
  if (ballGroup) {
    ballGroup.animate([
      { opacity: fromOpacity },
      { opacity: toOpacity }
    ], { duration: duration, fill: "forwards", easing: "ease-in-out" });
    
    setTimeout(() => {
      ballGroup.style.opacity = toOpacity;
    }, duration);
  }
}

function updateBallValAndShow(boxIdx, variableId, value) {
  const boxSvg = document.getElementById(`box-svg-${boxIdx}`);
  if (!boxSvg) return;
  const ballGroup = boxSvg.querySelector(`[data-variable-id="${variableId}"]`);
  if (ballGroup) {
    const circle = ballGroup.querySelector("circle");
    const text = ballGroup.querySelector("text");
    if (circle) circle.className.baseVal = `svg-instance val-${value.toLowerCase()}`;
    if (text) text.textContent = `${variableId}:${value}`;
  }
}

function updateBallValAndShowGlobal(variableId, value) {
  const globalContainer = document.getElementById("globalCanvasContainer");
  if (!globalContainer) return;
  const ballGroup = globalContainer.querySelector(`[data-variable-id="${variableId}"]`);
  if (ballGroup) {
    const circle = ballGroup.querySelector("circle");
    const text = ballGroup.querySelector("text");
    if (circle) circle.className.baseVal = `svg-instance val-${value.toLowerCase()}`;
    if (text) text.textContent = `${variableId}:${value}`;
  }
}

function animateParticleOnPath(pathEl, value, onComplete) {
  const svg = pathEl.ownerSVGElement;
  if (!svg) return;

  const totalLength = pathEl.getTotalLength();
  const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  particle.setAttribute("r", 6);
  
  const color = value === "V" ? "#10B981" : (value === "F" ? "#EF4444" : "#8B5CF6");
  particle.setAttribute("fill", color);
  particle.setAttribute("filter", `drop-shadow(0 0 8px ${color})`);
  svg.appendChild(particle);

  const isNegative = value === "F";
  const startLength = isNegative ? totalLength : 0;
  const endLength = isNegative ? 0 : totalLength;

  let start = null;
  const duration = 750;

  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    
    const currentLength = startLength + (endLength - startLength) * progress;
    const point = pathEl.getPointAtLength(currentLength);
    
    particle.setAttribute("cx", point.x);
    particle.setAttribute("cy", point.y);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      svg.removeChild(particle);
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(animate);
}

function pulseTargetBall(boxIdx, variableId) {
  const boxSvgContainer = document.getElementById(`box-svg-${boxIdx}`);
  if (!boxSvgContainer) return;

  const balls = boxSvgContainer.querySelectorAll(`[data-variable-id="${variableId}"] circle`);
  balls.forEach(ball => {
    ball.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.4)" },
      { transform: "scale(1)" }
    ], { duration: 300, easing: "ease-out" });
  });
}

// Pulse visual instances of a variable in the Global Canvas
function pulseTargetBallGlobal(variableId) {
  const gCanvas = document.getElementById("globalCanvasContainer");
  const balls = gCanvas.querySelectorAll(`[data-variable-id="${variableId}"] circle`);
  balls.forEach(ball => {
    ball.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.4)" },
      { transform: "scale(1)" }
    ], { duration: 300, easing: "ease-out" });
  });
}

function stepBackward() {
  if (simState.animationTimeout) {
    clearTimeout(simState.animationTimeout);
    simState.animationTimeout = null;
  }
  if (simState.currentStep <= 0) return;

  simState.currentStep--;
  updateUI();
}

function resetSimulation() {
  if (simState.animationTimeout) {
    clearTimeout(simState.animationTimeout);
    simState.animationTimeout = null;
  }
  simState.currentStep = 0;
  pause();
  updateUI();
}

function togglePlay() {
  if (simState.isPlaying) {
    pause();
  } else {
    play();
  }
}

function play() {
  simState.isPlaying = true;
  document.getElementById("playIcon").setAttribute("data-lucide", "pause");
  document.getElementById("playText").textContent = "Pausar";
  lucide.createIcons();

  simState.playInterval = setInterval(() => {
    const actions = simState.snapshot.execution_trace.actions;
    if (simState.currentStep >= actions.length) {
      pause();
    } else {
      stepForward();
    }
  }, simState.speed);
}

function pause() {
  simState.isPlaying = false;
  if (simState.playInterval) {
    clearInterval(simState.playInterval);
    simState.playInterval = null;
  }

  document.getElementById("playIcon").setAttribute("data-lucide", "play");
  document.getElementById("playText").textContent = "Reproducir";
  lucide.createIcons();
}

function jumpToStep(stepIdx) {
  pause();
  if (simState.animationTimeout) {
    clearTimeout(simState.animationTimeout);
    simState.animationTimeout = null;
  }
  simState.currentStep = stepIdx;
  updateUI();
}

// ==========================================
// 10. Interactive Editor View Logic (Visual Designer)
// ==========================================
function setupEditorEventListeners() {
  document.getElementById("btnEditAddSet").addEventListener("click", editorAddSet);
  document.getElementById("btnEditAddVar").addEventListener("click", editorAddVariable);
  document.getElementById("btnEditAddRel").addEventListener("click", editorAddRelation);
  document.getElementById("btnResetEditor").addEventListener("click", resetEditorGraph);
  document.getElementById("btnCalculateAPI").addEventListener("click", calculateWithAPI);

  syncEditorDropdowns();
}

function resetEditorGraph() {
  console.log('[Simulator] Reiniciando editor...');
  
  // Reiniciar el bridge (esto crea un nuevo EditorController)
  EditorBridge.resetEditor();
  
  // Limpiar el editorGraph local (mantener compatibilidad con código existente)
  editorGraph = {
    sets: {},
    instances: {},
    relations: {},
    logic: {
      variables: [],
      sets: [],
      relations: []
    }
  };
  
  syncEditorDropdowns();
  renderEditorPreview();
  document.getElementById("apiErrorLog").style.display = "none";
  
  console.log('[Simulator] Editor reiniciado');
}

function editorAddSet() {
  const nameInput = document.getElementById("editSetName");
  const id = nameInput.value.trim().replace(/\s+/g, "_");
  const connective = document.getElementById("editSetConnective").value;

  if (!id) {
    alert("Por favor ingresa un nombre para el conjunto");
    return;
  }

  // Calcular posición automática
  const state = EditorBridge.getEditorState();
  const count = state ? state.snapshot.logic.sets.length : Object.keys(editorGraph.sets).length;
  const x = 120 + count * 220;
  const y = 150;
  const radius = 65;

  // Usar el bridge para crear el conjunto
  const result = EditorBridge.createSet(id, connective, x, y, radius);
  
  if (!result.ok) {
    alert(result.errors ? result.errors[0].message : "Error al crear el conjunto");
    return;
  }

  // Actualizar editorGraph local para compatibilidad
  editorGraph.logic.sets.push({
    id,
    connective,
    subsets: [],
    result_alias: null
  });

  editorGraph.sets[id] = {
    x,
    y,
    radius,
    shape: "circle",
    connective
  };

  nameInput.value = "";
  syncEditorDropdowns();
  renderEditorPreview();
  
  console.log('[Simulator] Conjunto creado:', id);
}

function editorAddVariable() {
  const nameInput = document.getElementById("editVarName");
  const id = nameInput.value.trim().replace(/\s+/g, "_");
  const setId = document.getElementById("editVarSet").value;
  const val = document.getElementById("editVarVal").value;

  if (!id) {
    alert("Por favor ingresa un nombre para la variable");
    return;
  }
  if (!setId) {
    alert("Por favor selecciona un conjunto contenedor");
    return;
  }

  // Crear la variable lógica usando el bridge
  const varResult = EditorBridge.createVariable(id, val);
  
  if (!varResult.ok) {
    alert(varResult.errors ? varResult.errors[0].message : "Error al crear la variable");
    return;
  }

  // Calcular posición visual dentro del conjunto
  const parentSet = editorGraph.sets[setId];
  if (!parentSet) {
    alert("Conjunto no encontrado");
    return;
  }

  const varsInSet = editorGraph.logic.variables.filter(v => v.memberships.includes(setId)).length;
  
  let dx = 0, dy = 0;
  if (varsInSet === 0) { dx = 0; dy = 0; }
  else if (varsInSet === 1) { dx = -20; dy = 15; }
  else if (varsInSet === 2) { dx = 20; dy = 15; }
  else if (varsInSet === 3) { dx = 0; dy = -25; }
  else {
    dx = (Math.random() - 0.5) * 40;
    dy = (Math.random() - 0.5) * 40;
  }

  const instId = `inst_${id}`;
  const x = parentSet.x + dx;
  const y = parentSet.y + dy;

  // Crear la instancia visual usando el bridge
  const instResult = EditorBridge.createVariableInstance(instId, id, x, y);
  
  if (!instResult.ok) {
    alert(instResult.errors ? instResult.errors[0].message : "Error al crear la instancia visual");
    return;
  }

  // Actualizar editorGraph local para compatibilidad
  editorGraph.logic.variables.push({
    id,
    truth_value: val,
    memberships: [setId]
  });

  editorGraph.instances[instId] = {
    id: instId,
    variable_id: id,
    x,
    y
  };

  nameInput.value = "";
  syncEditorDropdowns();
  renderEditorPreview();
  
  console.log('[Simulator] Variable creada:', id);
}

function editorAddRelation() {
  const fromVar = document.getElementById("editRelFrom").value;
  const toVar = document.getElementById("editRelTo").value;
  const connective = document.getElementById("editRelConnective").value;

  if (!fromVar || !toVar) {
    alert("Por favor selecciona origen y destino");
    return;
  }
  if (fromVar === toVar) {
    alert("No se puede conectar una variable consigo misma");
    return;
  }

  const id = `rel_${fromVar}_to_${toVar}`;
  
  // Crear la relación usando el bridge
  const result = EditorBridge.createRelation(id, fromVar, toVar, connective);
  
  if (!result.ok) {
    alert(result.errors ? result.errors[0].message : "Error al crear la relación");
    return;
  }

  // Actualizar editorGraph local para compatibilidad
  editorGraph.logic.relations.push({
    id,
    from_variable: fromVar,
    to_variable: toVar,
    connective
  });

  editorGraph.relations[id] = {
    color: connective === "CONTRAPOSITIONAL" ? "#EC4899" : "#3B82F6",
    thickness: 2
  };

  renderEditorPreview();
  
  console.log('[Simulator] Relación creada:', id);
}

function syncEditorDropdowns() {
  const varSetDropdown = document.getElementById("editVarSet");
  const relFromDropdown = document.getElementById("editRelFrom");
  const relToDropdown = document.getElementById("editRelTo");

  varSetDropdown.innerHTML = '<option value="">Selecciona Conjunto...</option>';
  relFromDropdown.innerHTML = '<option value="">Origen...</option>';
  relToDropdown.innerHTML = '<option value="">Destino...</option>';

  Object.keys(editorGraph.sets).forEach(setId => {
    varSetDropdown.innerHTML += `<option value="${setId}">${setId}</option>`;
  });

  editorGraph.logic.variables.forEach(v => {
    relFromDropdown.innerHTML += `<option value="${v.id}">${v.id}</option>`;
    relToDropdown.innerHTML += `<option value="${v.id}">${v.id}</option>`;
  });
}

function renderEditorPreview() {
  const container = document.getElementById("editorPreviewContainer");
  container.innerHTML = "";

  const sets = Object.entries(editorGraph.sets);
  const vars = editorGraph.logic.variables;
  const rels = editorGraph.logic.relations;

  if (sets.length === 0) {
    container.innerHTML = `<div class="trace-placeholder">Lienzo vacío. Añade un conjunto para iniciar.</div>`;
    return;
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 650 300");
  container.appendChild(svg);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <marker id="arrow-editor" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6" />
    </marker>
  `;
  svg.appendChild(defs);

  sets.forEach(([setId, val]) => {
    const gSet = drawSetSVG(setId, val, val.x, val.y, val.radius);
    svg.appendChild(gSet);
  });

  const ballCoords = {};

  vars.forEach(v => {
    const inst = Object.values(editorGraph.instances).find(i => i.variable_id === v.id);
    if (!inst) return;

    const gBall = drawBallSVG(v.id, inst.id, inst.x, inst.y, v.truth_value);
    svg.appendChild(gBall);

    ballCoords[v.id] = { x: inst.x, y: inst.y };
  });

  rels.forEach(rel => {
    const fromCoord = ballCoords[rel.from_variable];
    const toCoord = ballCoords[rel.to_variable];

    if (fromCoord && toCoord) {
      const visualRel = editorGraph.relations[rel.id] || { color: "#3B82F6", thickness: 2 };
      const dx = toCoord.x - fromCoord.x;
      const dy = toCoord.y - fromCoord.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const radiusBall = 15;

      const startX = fromCoord.x + (dx / len) * radiusBall;
      const startY = fromCoord.y + (dy / len) * radiusBall;
      const endX = toCoord.x - (dx / len) * (radiusBall + 6);
      const endY = toCoord.y - (dy / len) * (radiusBall + 6);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      let pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
      if (Math.abs(dy) > 10 && Math.abs(dx) > 10) {
        const midX = (startX + endX) / 2 + (dy / len) * 15;
        const midY = (startY + endY) / 2 - (dx / len) * 15;
        pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
      }

      path.setAttribute("d", pathD);
      path.setAttribute("class", `svg-relation-path ${rel.connective === 'CONTRAPOSITIONAL' ? 'contrapositive' : ''}`);
      path.setAttribute("stroke", rel.connective === 'CONTRAPOSITIONAL' ? "#EC4899" : "#3B82F6");
      path.setAttribute("stroke-width", visualRel.thickness || 2);
      path.setAttribute("marker-end", "url(#arrow-editor)");
      
      svg.appendChild(path);
    }
  });
}

// --- CALL FASTAPI BACKEND MOTOR USING EDITOR BRIDGE ---
async function calculateWithAPI() {
  const errorLog = document.getElementById("apiErrorLog");
  errorLog.style.display = "none";
  errorLog.innerHTML = "";

  console.log('[Simulator] Iniciando cálculo con Motor API usando EditorBridge...');

  // Verificar que el bridge esté inicializado
  if (!EditorBridge.isInitialized()) {
    errorLog.style.display = "block";
    errorLog.innerHTML = `<strong>Error:</strong> El Editor Bridge no está inicializado.<br><small>Recarga la página e intenta de nuevo.</small>`;
    return;
  }

  const state = EditorBridge.getEditorState();
  
  if (!state || state.snapshot.logic.variables.length === 0) {
    alert("Añade al menos una variable antes de calcular");
    return;
  }

  console.log('[Simulator] Estado del editor:', state);

  // Validar el snapshot antes de enviar
  console.log('[Simulator] Validando snapshot...');
  const validation = EditorBridge.validateSnapshot();
  
  if (!validation.valid) {
    console.error('[Simulator] Validación fallida:', validation.errors);
    errorLog.style.display = "block";
    errorLog.innerHTML = `<strong>Errores de Validación:</strong><ul>`;
    validation.errors.forEach(err => {
      errorLog.innerHTML += `<li><strong>${err.field}:</strong> ${err.message}</li>`;
    });
    errorLog.innerHTML += `</ul>`;
    return;
  }

  console.log('[Simulator] Snapshot válido, ejecutando con motor...');

  try {
    // Ejecutar usando el bridge (incluye validación y comunicación con el motor)
    const result = await EditorBridge.executeWithMotor();
    
    if (!result.ok) {
      console.error('[Simulator] Error en ejecución:', result.errors);
      errorLog.style.display = "block";
      errorLog.innerHTML = `<strong>Error al ejecutar:</strong><ul>`;
      result.errors.forEach(err => {
        errorLog.innerHTML += `<li><strong>${err.field}:</strong> ${err.message}</li>`;
      });
      errorLog.innerHTML += `</ul>`;
      return;
    }

    console.log('[Simulator] Ejecución exitosa:', result);

    // Obtener el snapshot actualizado con la traza de ejecución
    const finalSnapshot = result.snapshot;
    
    if (!finalSnapshot || !finalSnapshot.execution_trace) {
      throw new Error('El motor no devolvió una traza de ejecución válida');
    }

    console.log('[Simulator] Cargando snapshot con traza de ejecución...');
    
    // Cargar el snapshot en el simulador para visualizar la animación
    loadSnapshot(finalSnapshot);

    // Cambiar a la vista de cajitas para ver la animación
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if (btn.getAttribute("data-tab") === "box-view") {
        btn.click();
      }
    });

    alert("¡Éxito! Propagación calculada por el motor. Reproduciendo animación.");
    console.log('[Simulator] Cálculo completado exitosamente');

  } catch (err) {
    console.error('[Simulator] Excepción durante cálculo:', err);
    errorLog.style.display = "block";
    errorLog.innerHTML = `<strong>Error de conexión al Motor:</strong> ${err.message}<br><br><small>Verifica que el servidor FastAPI esté encendido en http://localhost:8000</small>`;
  }
}

// Función auxiliar para mostrar errores del editor
function displayEditorErrors(errors) {
  const errorLog = document.getElementById("apiErrorLog");
  if (!errorLog) return;
  
  errorLog.style.display = "block";
  errorLog.innerHTML = `<strong>Errores del Editor:</strong><ul>`;
  errors.forEach(err => {
    errorLog.innerHTML += `<li><strong>${err.field}:</strong> ${err.message} (${err.severity})</li>`;
  });
  errorLog.innerHTML += `</ul>`;
}
