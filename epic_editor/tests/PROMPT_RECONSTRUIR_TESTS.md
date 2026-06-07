# Prompt para reconstruir epic_editor/tests

Usa este prompt para reconstruir solo las pruebas del Editor.

```text
Actua como ingeniero senior de pruebas TypeScript/Jest.

Reconstruye exclusivamente epic_editor/tests. Antes de escribir codigo, inspecciona:

- epic_editor/tests/editorTests.test.ts
- epic_editor/controllers/editorController.ts
- epic_editor/domain/editorActions.ts
- epic_editor/validators/editorValidation.ts
- epic_editor/services/motorApiClient.ts
- jest.config.js
- package.json

Objetivo:

Crear pruebas unitarias y de integracion ligera que aseguren que el Editor mantiene el contrato PlaygroundSnapshot sin depender del Motor real.

Archivo esperado:

- editorTests.test.ts

Casos obligatorios:

1. Crear variable logica.
2. Crear instancia visual para variable existente.
3. Ignorar o rechazar instancia visual de variable inexistente.
4. Crear multiples instancias de la misma variable.
5. Borrar variable y limpiar instancias visuales.
6. Borrar variable y limpiar relaciones logicas y visuales.
7. Detectar variable duplicada.
8. Detectar instancia duplicada.
9. Validar snapshot correcto.
10. Detectar membership roto.
11. Detectar subset roto.
12. Detectar ciclo de subsets.
13. Detectar relation rota.
14. Detectar conectivo desconocido.
15. Detectar max_iterations fuera de rango.
16. Ejecutar con MockMotorClient.
17. Bloquear ejecucion invalida.
18. Regresar a edicion limpia trace.

Reglas:

1. No depender de servidor FastAPI real.
2. No escribir archivos.
3. No usar timers innecesarios.
4. No probar detalles privados si puede probarse comportamiento publico.
5. Usar MockMotorClient para ejecutar.
6. Mantener fixtures pequenos y legibles.

Fallos comunes a evitar:

- Mutar state.getState() directamente en demasiadas pruebas sin explicar por que.
- Hacer pruebas end-to-end reales en unit tests.
- Depender del orden accidental de errores cuando solo importa que exista el error.
```

## Prompt de correccion rapida

```text
Refactoriza las pruebas del Editor para cubrir contrato y comportamiento publico. Usa helpers para crear snapshots invalidos sin repetir demasiado, pero no ocultes la estructura del JSON.
```
