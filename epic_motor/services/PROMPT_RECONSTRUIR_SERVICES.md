# Prompt para reconstruir epic_motor/services

Usa este prompt para reconstruir solo los servicios activos del Motor.

```text
Actua como ingeniero Python senior especializado en motores de propagacion y separacion de capas.

Reconstruye exclusivamente epic_motor/services. Antes de escribir codigo, inspecciona:

- epic_motor/services/engine.py
- epic_motor/models/snapshot.py
- epic_motor/core/belnap.py
- epic_motor/core/connectives.py
- epic_motor/api/routes.py
- epic_motor/tests/test_motor.py

Objetivo:

Implementar el servicio run_propagation que recibe PlaygroundSnapshot y devuelve el mismo snapshot con execution_trace.

Archivo esperado:

- engine.py

Responsabilidades:

1. Inicializar ExecutionTrace.
2. Recorrer iteraciones hasta max_iterations.
3. Recorrer relations en orden estable.
4. Buscar variables origen y destino.
5. Aplicar conectivo normal o contraposicional.
6. Combinar evidencia con bv_kjoin.
7. Mutar valor de destino si cambia.
8. Registrar ExecutionAction por cada cambio.
9. Registrar estabilizacion cuando una iteracion no cambia nada.
10. Marcar stabilized y total_iterations.
11. Devolver snapshot con visual intacto.

Reglas:

1. No usar FastAPI aqui.
2. No usar fetch.
3. No renderizar ni leer coordenadas.
4. No crear modelos HTTP.
5. No ocultar relaciones invalidas; si se decide ignorarlas, documentarlo y probarlo.
6. No agregar acciones para pasos que no cambiaron salvo estabilizacion.

Pruebas:

- Sin relaciones estabiliza.
- V propaga a N.
- F puede viajar por regla contraria si corresponde.
- Dos fuentes V y F producen B.
- Contraposicional invierte direccion logica.
- Trace contiene una accion por mutacion.
- Trace final tiene estabilizacion.
- visual sale igual que entro.

Fallos comunes:

- Crear trace pero no asignarlo a snapshot.
- Actualizar value pero no registrar old_value.
- Usar max_iterations incorrecto.
- Animar o decidir detalles visuales desde el Motor.
```

## Prompt de correccion rapida

```text
Audita run_propagation. Debe ser puro respecto a visual y concentrarse en logic. Agrega pruebas donde visual tenga metadata arbitraria para garantizar que no se toca.
```
