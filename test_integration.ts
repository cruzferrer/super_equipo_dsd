/**
 * Test de Integración - EPiC Playground
 * 
 * Este archivo contiene pruebas de integración para verificar que
 * el EditorController, MotorApiClient y el validador funcionan correctamente.
 */

import { EditorController } from './epic_editor/controllers/editorController';
import { MockMotorClient } from './epic_editor/services/motorApiClient';
import { validarSnapshot } from './epic_editor/validators/editorValidation';
import type { PlaygroundSnapshot } from './epic_editor/domain/editorTypes';

describe('Integración Editor + Motor', () => {
  let controller: EditorController;
  let mockMotor: MockMotorClient;

  beforeEach(() => {
    mockMotor = new MockMotorClient();
    controller = new EditorController(mockMotor);
  });

  test('Crear conjunto y variable', () => {
    // Crear conjunto
    const setResult = controller.crearContexto('set_A', 'PROPAGATION', 100, 100);
    expect(setResult.ok).toBe(true);

    // Crear variable
    const varResult = controller.crearVariable('p', 'V');
    expect(varResult.ok).toBe(true);

    // Crear instancia visual
    const instResult = controller.dibujarInstancia('inst_p', 'p', 100, 100);
    expect(instResult.ok).toBe(true);

    // Verificar estado
    const state = controller.getState();
    expect(state.snapshot.logic.sets).toHaveLength(1);
    expect(state.snapshot.logic.variables).toHaveLength(1);
    expect(Object.keys(state.snapshot.visual.instances)).toHaveLength(1);
  });

  test('Validar snapshot correctamente', () => {
    // Crear escenario válido
    controller.crearContexto('set_A', 'PROPAGATION', 100, 100);
    controller.crearVariable('p', 'V');
    controller.dibujarInstancia('inst_p', 'p', 100, 100);

    // Validar
    const validation = controller.validar();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('Detectar errores de validación', () => {
    // Crear variable sin instancia visual
    controller.crearVariable('p', 'V');

    // Validar
    const validation = controller.validar();
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('Ejecutar con motor mock', async () => {
    // Crear escenario
    controller.crearContexto('set_A', 'PROPAGATION', 100, 100);
    controller.crearContexto('set_B', 'PROPAGATION', 200, 100);
    controller.crearVariable('p', 'V');
    controller.crearVariable('q', 'N');
    controller.dibujarInstancia('inst_p', 'p', 100, 100);
    controller.dibujarInstancia('inst_q', 'q', 200, 100);
    controller.conectar('rel1', 'p', 'q', 'PROPAGATION');

    // Ejecutar
    const result = await controller.ejecutar();
    expect(result.ok).toBe(true);
    
    if (result.ok) {
      expect(result.data).toBeDefined();
      expect(result.data.stabilized).toBe(true);
    }
  });

  test('Snapshot tiene estructura correcta', () => {
    controller.crearContexto('set_A', 'PROPAGATION', 100, 100);
    controller.crearVariable('p', 'V');
    controller.dibujarInstancia('inst_p', 'p', 100, 100);

    const state = controller.getState();
    const snapshot = state.snapshot;

    // Verificar estructura
    expect(snapshot.meta).toBeDefined();
    expect(snapshot.logic).toBeDefined();
    expect(snapshot.visual).toBeDefined();
    expect(snapshot.meta.schema_version).toBe('3.0');
    expect(snapshot.meta.editor_mode).toBe('edicion');
  });
});

describe('Validador de Snapshots', () => {
  test('Validar snapshot vacío', () => {
    const snapshot: PlaygroundSnapshot = {
      meta: {
        schema_version: '3.0',
        editor_mode: 'edicion',
        belnap_domain: ['V', 'F', 'N', 'B'],
        max_iterations: 100
      },
      logic: {
        variables: [],
        sets: [],
        relations: []
      },
      visual: {
        instances: {},
        sets: {},
        relations: {}
      }
    };

    const validation = validarSnapshot(snapshot, []);
    expect(validation.valid).toBe(true);
  });

  test('Detectar variable sin instancia visual', () => {
    const snapshot: PlaygroundSnapshot = {
      meta: {
        schema_version: '3.0',
        editor_mode: 'edicion',
        belnap_domain: ['V', 'F', 'N', 'B'],
        max_iterations: 100
      },
      logic: {
        variables: [
          { id: 'p', truth_value: 'V', memberships: [] }
        ],
        sets: [],
        relations: []
      },
      visual: {
        instances: {},
        sets: {},
        relations: {}
      }
    };

    const validation = validarSnapshot(snapshot, []);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.field === 'visual.instances')).toBe(true);
  });

  test('Detectar relación con variable inexistente', () => {
    const snapshot: PlaygroundSnapshot = {
      meta: {
        schema_version: '3.0',
        editor_mode: 'edicion',
        belnap_domain: ['V', 'F', 'N', 'B'],
        max_iterations: 100
      },
      logic: {
        variables: [
          { id: 'p', truth_value: 'V', memberships: [] }
        ],
        sets: [],
        relations: [
          { id: 'rel1', from_variable: 'p', to_variable: 'q', connective: 'PROPAGATION' }
        ]
      },
      visual: {
        instances: {
          inst_p: { id: 'inst_p', variable_id: 'p', x: 100, y: 100 }
        },
        sets: {},
        relations: {
          rel1: { color: '#000', thickness: 2 }
        }
      }
    };

    const validation = validarSnapshot(snapshot, []);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.message.includes('q'))).toBe(true);
  });
});

// Made with Bob
