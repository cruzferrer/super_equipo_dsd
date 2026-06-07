# Prompt para reconstruir epic_motor/engine

Usa este prompt para revisar la carpeta `engine`, que puede contener una implementacion anterior de propagacion.

```text
Actua como ingeniero Python senior especializado en migracion controlada de codigo legacy.

Reconstruye o depura exclusivamente epic_motor/engine. Antes de escribir codigo, inspecciona:

- epic_motor/engine/propagation.py
- epic_motor/services/engine.py
- epic_motor/models/snapshot.py
- epic_motor/models/schemas.py
- epic_motor/tests/test_motor.py

Objetivo:

Determinar si epic_motor/engine/propagation.py sigue siendo usado. Si no esta en el flujo activo, mantenlo como legacy documentado o migra su funcionalidad a services/engine.py sin duplicar logica.

Reglas:

1. No tener dos motores activos con reglas distintas.
2. Si routes.py usa services/engine.py, entonces engine/propagation.py no debe ser la fuente de verdad.
3. Si se conserva, debe delegar o ser marcado claramente como compatibilidad.
4. No revivir MotorInput viejo si el endpoint usa PlaygroundSnapshot.
5. No borrar archivos sin revisar imports.

Pasos:

1. Buscar imports de engine.propagation.
2. Comparar comportamiento con services.engine.run_propagation.
3. Decidir: eliminar uso, delegar o migrar.
4. Ajustar tests para cubrir solo el motor activo.

Fallos comunes:

- Corregir propagation.py mientras la API usa services/engine.py.
- Mantener dos algoritmos que dan trazas diferentes.
- Importar modelos viejos accidentalmente.
```

## Prompt de correccion rapida

```text
Haz una auditoria de uso de epic_motor/engine/propagation.py. Si no se usa, no lo trates como motor activo. Si se usa, unifica su comportamiento con services/engine.py.
```
