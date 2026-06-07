# Prompt para reconstruir epic_motor/core

Usa este prompt para reconstruir el nucleo matematico activo del Motor.

```text
Actua como ingeniero Python senior especializado en logica formal y codigo puro testeable.

Reconstruye exclusivamente epic_motor/core. Antes de escribir codigo, inspecciona:

- epic_motor/core/belnap.py
- epic_motor/core/connectives.py
- epic_motor/services/engine.py
- epic_motor/models/snapshot.py
- epic_motor/tests/test_motor.py
- epic_motor/logic/belnap.py
- epic_motor/logic/connectives.py

Objetivo:

Implementar la logica pura de Belnap y el registro de conectivos que usa el Motor activo.

Archivos esperados:

- belnap.py
- connectives.py
- __init__.py

Responsabilidades de belnap.py:

1. Definir enum BV con V, F, N, B.
2. Normalizar strings a BV.
3. Implementar bv_not.
4. Implementar bv_and.
5. Implementar bv_or.
6. Implementar bv_kjoin.

Responsabilidades de connectives.py:

1. Definir clase o estructura de conectivo.
2. Registrar AND, OR, IMPLIES, BICONDITIONAL, PROPAGATION, CONTRAPOSITIONAL y KJOIN.
3. Exponer get_connective.
4. Exponer REGISTRY.

Reglas:

1. Codigo puro, sin FastAPI.
2. Sin Pydantic.
3. Sin leer visual.
4. Sin estado global mutable salvo REGISTRY controlado.
5. Si existe duplicado en epic_motor/logic, evita divergencia.
6. Las matrices deben ser faciles de probar.

Pruebas:

- NOT V = F.
- NOT F = V.
- NOT N = N.
- NOT B = B.
- KJOIN V + F = B.
- KJOIN N + V = V.
- get_connective valido.
- get_connective invalido lanza KeyError o error claro.
- IMPLIES V F produce F segun regla del proyecto.

Fallos comunes:

- Cambiar semantica sin ajustar tests.
- Hacer que connectives dependa de servicios.
- Tener core y logic con implementaciones distintas sin documentarlo.
```

## Prompt de correccion rapida

```text
Audita core como biblioteca pura. Si importa FastAPI, Pydantic, modelos visuales o servicios, separalo. Si logic duplica core, decide una fuente de verdad y evita divergencia.
```
