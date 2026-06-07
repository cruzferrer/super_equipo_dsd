# Prompt para reconstruir epic_motor/logic

Usa este prompt si debes mantener o depurar la carpeta `logic`.

Nota: en el estado actual del proyecto, el Motor activo importa principalmente desde `core`. La carpeta `logic` parece conservar una version anterior usada por modelos viejos como `schemas.py`.

```text
Actua como ingeniero Python senior especializado en mantenimiento de compatibilidad.

Reconstruye exclusivamente epic_motor/logic solo si el proyecto todavia necesita compatibilidad con modelos viejos. Antes de escribir codigo, inspecciona:

- epic_motor/logic/belnap.py
- epic_motor/logic/connectives.py
- epic_motor/core/belnap.py
- epic_motor/core/connectives.py
- epic_motor/models/schemas.py
- epic_motor/models/snapshot.py
- epic_motor/tests/test_motor.py

Objetivo:

Mantener logic compatible con core o convertirlo en una capa delegada para evitar dos verdades matematicas.

Responsabilidades:

1. Revisar si schemas.py todavia importa logic.
2. Si se conserva schemas.py, mantener logic funcional.
3. Si core es la fuente de verdad, hacer que logic delegue a core o documentar la razon de la duplicidad.
4. Evitar que las matrices de Belnap diverjan entre core y logic.

Reglas:

1. No modificar API activa salvo necesidad.
2. No crear una tercera implementacion de Belnap.
3. No mezclar contratos viejos con PlaygroundSnapshot.
4. No usar logic como fuente principal si services/engine.py usa core.

Pruebas:

- Las funciones equivalentes de logic y core devuelven lo mismo.
- schemas.py puede importarse sin romper.
- Los tests activos siguen pasando.

Fallos comunes:

- Arreglar core pero olvidar logic.
- Cambiar logic y pensar que el Motor activo cambio.
- Reintroducir ElementoIn/ConjuntoIn en el flujo nuevo sin decision explicita.
```

## Prompt de correccion rapida

```text
Resuelve la duplicidad core/logic. Elige core como fuente de verdad activa si engine.py lo usa. Mantiene logic como compatibilidad delegando a core o elimina su uso desde modelos viejos solo si todo el repo queda actualizado.
```
