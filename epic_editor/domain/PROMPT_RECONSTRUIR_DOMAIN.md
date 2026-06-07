# Prompt para reconstruir epic_editor/domain

Usa este prompt para reconstruir solo la capa de dominio del Editor.

```text
Actua como arquitecto TypeScript senior especializado en contratos de datos y estado inmutable.

Reconstruye exclusivamente epic_editor/domain. Antes de escribir codigo, inspecciona:

- epic_editor/domain/editorTypes.ts
- epic_editor/domain/editorState.ts
- epic_editor/domain/editorActions.ts
- epic_motor/models/snapshot.py
- epic_simulador/simulator.js

Objetivo:

Definir el contrato publico PlaygroundSnapshot y las acciones puras que modifican el estado del Editor sin calcular logica, sin llamar HTTP y sin renderizar.

Archivos esperados:

- editorTypes.ts
- editorState.ts
- editorActions.ts

Responsabilidades:

1. Definir BelnapValue como "V" | "F" | "N" | "B".
2. Definir PlaygroundMeta con schema_version, editor_mode, belnap_domain y max_iterations.
3. Definir LogicVariable con id, truth_value y memberships.
4. Definir LogicSet con id, connective, subsets y result_alias.
5. Definir LogicRelation con id, from_variable, to_variable y connective.
6. Definir VisualInstance con id, variable_id, x, y y metadata opcional.
7. Definir VisualSet con x, y, radius, shape y metadata opcional.
8. Definir VisualRelation con color, thickness y metadata opcional.
9. Definir ExecutionTrace y ExecutionAction para reproducir el resultado del Motor.
10. Crear estado inicial vacio y conectivos fallback.
11. Implementar acciones puras para crear, editar y eliminar entidades.

Reglas:

1. No usar fetch.
2. No importar MotorApiClient.
3. No importar funciones Python ni logica Belnap.
4. No renderizar canvas, SVG ni DOM.
5. Las acciones deben devolver un nuevo estado o snapshot; evita mutacion accidental.
6. Si se elimina una variable logica, limpia instancias visuales y relaciones relacionadas.
7. Si se elimina una instancia visual, no borres la variable logica.
8. Si se elimina un contexto, limpia memberships y subsets rotos.
9. Mantener logic y visual separados.
10. No crear campos incompatibles con editorTypes.ts sin justificar extension.

Pruebas que debe soportar esta capa:

- Crear variable logica sin instancia.
- Crear varias instancias para la misma variable.
- Rechazar o ignorar instancia visual con variable inexistente.
- Borrar variable y limpiar cascada.
- Borrar contexto y limpiar referencias.
- Guardar execution_trace cambia modo a ejecucion.
- Limpiar execution_trace regresa modo a edicion.

Fallos comunes a evitar:

- Mezclar el contrato viejo ElementoIn/ConjuntoIn dentro del dominio publico.
- Guardar coordenadas dentro de logic.
- Guardar truth_value dentro de visual.instances.
- Mutar arrays internos desde acciones.
- Crear acciones que tambien validan o llaman al Motor.
```

## Prompt de correccion rapida

```text
Revisa epic_editor/domain y separa responsabilidades. editorTypes.ts solo declara tipos, editorState.ts solo crea el estado inicial, editorActions.ts solo contiene transformaciones puras. Si alguna funcion calcula propagacion, valida todo el snapshot, llama HTTP o toca DOM, muevela fuera de domain.
```
