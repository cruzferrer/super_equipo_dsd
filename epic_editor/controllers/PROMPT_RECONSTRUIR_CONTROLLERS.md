# Prompt para reconstruir epic_editor/controllers

Usa este prompt para reconstruir solo el controlador del Editor.

```text
Actua como arquitecto TypeScript senior especializado en orquestacion de estado, controladores finos y dependencias invertidas.

Reconstruye exclusivamente epic_editor/controllers. Antes de escribir codigo, inspecciona:

- epic_editor/controllers/editorController.ts
- epic_editor/domain/editorTypes.ts
- epic_editor/domain/editorState.ts
- epic_editor/domain/editorActions.ts
- epic_editor/validators/editorValidation.ts
- epic_editor/services/motorApiClient.ts
- epic_editor/tests/editorTests.test.ts

Objetivo:

Crear un EditorController que sea el unico punto de entrada para la UI. Debe coordinar acciones de dominio, validacion y comunicacion con el Motor sin asumir responsabilidades internas de esas capas.

Archivo esperado:

- editorController.ts

Responsabilidades:

1. Mantener el EditorState actual.
2. Exponer getState como lectura.
3. Exponer subscribe para UI o pruebas.
4. Exponer metodos de alto nivel: crearVariable, eliminarVariable, dibujarInstancia, eliminarInstancia, crearContexto, eliminarContexto, conectar, validar, ejecutar y regresarAEdicion.
5. Validar duplicados obvios antes de acciones cuando ayude a devolver errores claros.
6. Delegar validacion completa a validarSnapshot.
7. Delegar comunicacion HTTP a IMotorClient.
8. Recibir execution_trace y guardarlo en el estado.
9. Devolver ControllerResult uniforme.
10. Permitir inyectar MockMotorClient en pruebas.

Reglas:

1. No calcular Belnap.
2. No construir SVG ni DOM.
3. No usar fetch directamente.
4. No mutar el estado desde fuera del controlador.
5. No ocultar errores del Motor; conviertelos en errores estructurados.
6. No duplicar validaciones complejas que pertenecen a validators.
7. No crear dependencias concretas dificiles de sustituir; depender de IMotorClient.

Contrato de salida:

Usa ControllerResult:

{
  ok: true,
  data: T
}

o:

{
  ok: false,
  errors: EditorValidationError[]
}

Pruebas que debe soportar:

- Crear variable con ok true.
- Duplicado devuelve ok false.
- Instancia duplicada devuelve ok false.
- Ejecutar bloquea si validarSnapshot falla.
- Ejecutar con MockMotorClient guarda trace.
- Si el Motor no devuelve trace, devolver error claro.
- regresarAEdicion borra execution_trace.

Fallos comunes a evitar:

- El controlador modifica directamente arrays internos en vez de usar actions.
- El controlador llama fetch directamente.
- El controlador acepta snapshots invalidos.
- El controlador devuelve ok true aunque la accion no haya cambiado nada importante.
```

## Prompt de correccion rapida

```text
Audita EditorController. Debe ser orquestador, no motor logico ni renderizador. Extrae cualquier calculo a Motor, cualquier validacion profunda a validators y cualquier transformacion pura a domain/editorActions.ts.
```
