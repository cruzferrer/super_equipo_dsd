/**
 * EPiC Editor Bridge - Módulo de Integración
 * 
 * Este módulo actúa como puente entre el EditorController de TypeScript
 * y el simulador JavaScript, proporcionando una API unificada para
 * la gestión del estado del editor y la comunicación con el motor.
 */

import { EditorController } from './dist/controllers/editorController.js';
import { MotorApiClient } from './dist/services/motorApiClient.js';
import { validarSnapshot } from './dist/validators/editorValidation.js';

// ==========================================
// Estado Global del Bridge
// ==========================================
let editorController = null;
let motorClient = null;
let currentSnapshot = null;
let renderCallback = null;
let errorCallback = null;

// ==========================================
// Inicialización
// ==========================================

/**
 * Inicializa el bridge con el EditorController y el MotorApiClient
 * @param {string} motorUrl - URL del motor API (default: http://localhost:8000)
 */
export function initializeEditorBridge(motorUrl = 'http://localhost:8000') {
  console.log('[EditorBridge] Inicializando bridge con motor en:', motorUrl);
  
  // Crear instancia del cliente del motor
  motorClient = new MotorApiClient(motorUrl);
  
  // Crear instancia del controlador del editor
  editorController = new EditorController(motorClient);
  
  // Suscribirse a cambios de estado
  editorController.subscribe((state) => {
    console.log('[EditorBridge] Estado actualizado:', state);
    currentSnapshot = state.snapshot;
    
    // Notificar al simulador si hay callback registrado
    if (renderCallback) {
      renderCallback(state.snapshot);
    }
  });
  
  console.log('[EditorBridge] Bridge inicializado correctamente');
  return editorController;
}

/**
 * Registra un callback para renderizar cuando cambie el estado
 * @param {Function} callback - Función que recibe el snapshot actualizado
 */
export function onStateChange(callback) {
  renderCallback = callback;
}

/**
 * Registra un callback para manejar errores
 * @param {Function} callback - Función que recibe los errores
 */
export function onError(callback) {
  errorCallback = callback;
}

// ==========================================
// API de Gestión de Conjuntos
// ==========================================

/**
 * Crea un nuevo conjunto (set) en el editor
 * @param {string} id - ID único del conjunto
 * @param {string} connective - Conectivo lógico del conjunto
 * @param {number} x - Posición X visual
 * @param {number} y - Posición Y visual
 * @param {number} radius - Radio del conjunto
 * @returns {Object} Resultado de la operación
 */
export function createSet(id, connective, x, y, radius = 65) {
  if (!editorController) {
    return { ok: false, error: 'Bridge no inicializado' };
  }
  
  const result = editorController.crearContexto(id, connective, x, y, radius);
  
  if (!result.ok && errorCallback) {
    errorCallback(result.errors);
  }
  
  return result;
}

/**
 * Elimina un conjunto del editor
 * @param {string} id - ID del conjunto a eliminar
 * @returns {Object} Resultado de la operación
 */
export function deleteSet(id) {
  if (!editorController) {
    return { ok: false, error: 'Bridge no inicializado' };
  }
  
  return editorController.eliminarContexto(id);
}

// ==========================================
// API de Gestión de Variables
// ==========================================

/**
 * Crea una nueva variable lógica
 * @param {string} id - ID único de la variable
 * @param {string} truthValue - Valor de verdad inicial (V, F, N, B)
 * @returns {Object} Resultado de la operación
 */
export function createVariable(id, truthValue = 'N') {
  if (!editorController) {
    return { ok: false, error: 'Bridge no inicializado' };
  }
  
  const result = editorController.crearVariable(id, truthValue);
  
  if (!result.ok && errorCallback) {
    errorCallback(result.errors);
  }
  
  return result;
}

/**
 * Crea una instancia visual de una variable
 * @param {string} instanceId - ID único de la instancia visual
 * @param {string} variableId - ID de la variable lógica
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @returns {Object} Resultado de la operación
 */
export function createVariableInstance(instanceId, variableId, x, y) {
  if (!editorController) {
    return { ok: false, error: 'Bridge no inicializado' };
  }
  
  const result = editorController.dibujarInstancia(instanceId, variableId, x, y);
  
  if (!result.ok && errorCallback) {
    errorCallback(result.errors);
  }
  
  return result;
}

/**
 * Elimina una variable del editor
 * @param {string} id - ID de la variable a eliminar
 * @returns {Object} Resultado de la operación
 */
export function deleteVariable(id) {
  if (!editorController) {
    return { ok: false, error: 'Bridge no inicializado' };
  }
  
  return editorController.eliminarVariable(id);
}

// ==========================================
// API de Gestión de Relaciones
// ==========================================

/**
 * Crea una relación (implicación) entre dos variables
 * @param {string} id - ID único de la relación
 * @param {string} fromVariable - ID de la variable origen
 * @param {string} toVariable - ID de la variable destino
 * @param {string} connective - Conectivo de la relación
 * @returns {Object} Resultado de la operación
 */
export function createRelation(id, fromVariable, toVariable, connective) {
  if (!editorController) {
    return { ok: false, error: 'Bridge no inicializado' };
  }
  
  const result = editorController.conectar(id, fromVariable, toVariable, connective);
  
  if (!result.ok && errorCallback) {
    errorCallback(result.errors);
  }
  
  return result;
}

// ==========================================
// API de Validación y Ejecución
// ==========================================

/**
 * Valida el snapshot actual antes de enviarlo al motor
 * @returns {Object} Resultado de la validación
 */
export function validateSnapshot() {
  if (!editorController) {
    return { valid: false, errors: [{ field: 'bridge', message: 'Bridge no inicializado', severity: 'error' }] };
  }
  
  return editorController.validar();
}

/**
 * Ejecuta el cálculo con el motor API
 * @returns {Promise<Object>} Resultado de la ejecución con la traza
 */
export async function executeWithMotor() {
  if (!editorController) {
    throw new Error('Bridge no inicializado');
  }
  
  console.log('[EditorBridge] Validando snapshot antes de ejecutar...');
  const validation = validateSnapshot();
  
  if (!validation.valid) {
    console.error('[EditorBridge] Validación fallida:', validation.errors);
    if (errorCallback) {
      errorCallback(validation.errors);
    }
    return { ok: false, errors: validation.errors };
  }
  
  console.log('[EditorBridge] Snapshot válido, ejecutando con motor...');
  
  try {
    const result = await editorController.ejecutar();
    
    if (result.ok) {
      console.log('[EditorBridge] Ejecución exitosa:', result.data);
      return { ok: true, data: result.data, snapshot: currentSnapshot };
    } else {
      console.error('[EditorBridge] Error en ejecución:', result.errors);
      if (errorCallback) {
        errorCallback(result.errors);
      }
      return result;
    }
  } catch (error) {
    console.error('[EditorBridge] Excepción durante ejecución:', error);
    const errorObj = {
      ok: false,
      errors: [{
        field: 'motor',
        message: error.message || 'Error desconocido al ejecutar',
        severity: 'error'
      }]
    };
    
    if (errorCallback) {
      errorCallback(errorObj.errors);
    }
    
    return errorObj;
  }
}

// ==========================================
// API de Estado
// ==========================================

/**
 * Obtiene el estado actual del editor
 * @returns {Object} Estado actual
 */
export function getEditorState() {
  if (!editorController) {
    return null;
  }
  
  return editorController.getState();
}

/**
 * Obtiene el snapshot actual
 * @returns {Object} Snapshot actual
 */
export function getCurrentSnapshot() {
  return currentSnapshot;
}

/**
 * Reinicia el editor a su estado inicial
 */
export function resetEditor() {
  if (!motorClient) {
    console.warn('[EditorBridge] Motor client no inicializado, usando URL por defecto');
    motorClient = new MotorApiClient('http://localhost:8000');
  }
  
  editorController = new EditorController(motorClient);
  
  // Re-suscribirse a cambios
  editorController.subscribe((state) => {
    currentSnapshot = state.snapshot;
    if (renderCallback) {
      renderCallback(state.snapshot);
    }
  });
  
  console.log('[EditorBridge] Editor reiniciado');
}

/**
 * Carga conectivos disponibles desde el motor
 * @returns {Promise<void>}
 */
export async function loadConnectives() {
  if (!editorController) {
    throw new Error('Bridge no inicializado');
  }
  
  await editorController.cargarConectivos();
}

// ==========================================
// Utilidades
// ==========================================

/**
 * Verifica si el bridge está inicializado
 * @returns {boolean}
 */
export function isInitialized() {
  return editorController !== null && motorClient !== null;
}

/**
 * Obtiene información de debug del bridge
 * @returns {Object}
 */
export function getDebugInfo() {
  return {
    initialized: isInitialized(),
    hasController: editorController !== null,
    hasMotorClient: motorClient !== null,
    hasSnapshot: currentSnapshot !== null,
    hasRenderCallback: renderCallback !== null,
    hasErrorCallback: errorCallback !== null,
    snapshotPreview: currentSnapshot ? {
      variables: currentSnapshot.logic?.variables?.length || 0,
      sets: currentSnapshot.logic?.sets?.length || 0,
      relations: currentSnapshot.logic?.relations?.length || 0
    } : null
  };
}

// Exportar el controlador para acceso directo si es necesario
export { editorController, motorClient };


