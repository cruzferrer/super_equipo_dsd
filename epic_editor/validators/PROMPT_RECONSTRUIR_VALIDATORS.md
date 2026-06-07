# Prompt para reconstruir epic_editor/validators

Usa este prompt para reconstruir solo los validadores del Editor.

```text
Actua como ingeniero TypeScript senior especializado en validacion de grafos, integridad referencial y mensajes de error utiles.

Reconstruye exclusivamente epic_editor/validators. Antes de escribir codigo, inspecciona:

- epic_editor/validators/editorValidation.ts
- epic_editor/domain/editorTypes.ts
- epic_editor/domain/editorState.ts
- epic_editor/tests/editorTests.test.ts

Objetivo:

Crear validadores puros para impedir que el Editor envie snapshots corruptos al Motor.

Archivo esperado:

- editorValidation.ts

Responsabilidades:

1. Validar valores Belnap contra meta.belnap_domain.
2. Validar conectivos contra available_connectives.
3. Validar memberships contra logic.sets.
4. Validar subsets contra logic.sets.
5. Detectar ciclos en jerarquia de subsets.
6. Validar relations.from_variable y relations.to_variable.
7. Validar visual.instances.variable_id.
8. Validar meta.max_iterations entre 1 y 500.
9. Devolver ValidationResult.
10. Generar errores con field, message, severity y entityId.

Reglas:

1. No mutar el snapshot.
2. No corregir automaticamente datos invalidos.
3. No llamar fetch.
4. No calcular propagacion.
5. No renderizar.
6. No depender de EditorController.
7. Permitir warnings en el tipo, pero errores invalidan.

Pruebas que debe soportar:

- Snapshot vacio valido.
- Membership a conjunto inexistente invalido.
- Subset inexistente invalido.
- Ciclo A -> B -> A invalido.
- Relation con origen inexistente invalida.
- Relation con destino inexistente invalida.
- Conectivo desconocido invalido.
- Instancia visual apuntando a fantasma invalida.
- max_iterations 0 invalido.
- max_iterations 501 invalido.

Fallos comunes a evitar:

- Solo validar visual y olvidar logic.
- Detectar ciclos con falsos positivos por compartir subconjuntos.
- Reportar errores sin entityId.
- Cambiar datos mientras se validan.
```

## Prompt de correccion rapida

```text
Audita validarSnapshot como funcion pura. Debe recibir snapshot y available_connectives, devolver ValidationResult y no tocar nada mas. Agrega pruebas para cada referencia rota posible.
```
