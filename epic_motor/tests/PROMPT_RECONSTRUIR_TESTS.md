# Prompt para reconstruir epic_motor/tests

Usa este prompt para reconstruir solo las pruebas del Motor.

```text
Actua como ingeniero senior de pruebas Python con pytest.

Reconstruye exclusivamente epic_motor/tests. Antes de escribir codigo, inspecciona:

- epic_motor/tests/test_motor.py
- epic_motor/core/belnap.py
- epic_motor/core/connectives.py
- epic_motor/models/snapshot.py
- epic_motor/services/engine.py
- epic_motor/api/routes.py

Objetivo:

Crear pruebas de unidad e integracion ligera para asegurar que el Motor calcula correctamente y genera trace util para el Simulador.

Casos obligatorios:

1. bv_not para V, F, N, B.
2. bv_and casos base.
3. bv_or casos base.
4. bv_kjoin V/F produce B.
5. bv_from_str normaliza entradas.
6. get_connective valido.
7. get_connective invalido.
8. Variable sin relaciones no cambia.
9. Propagacion V -> N.
10. Propagacion F segun conectivo esperado.
11. Dos fuentes a un destino producen B.
12. Contraposicional registra mutacion.
13. Trace registra old_value y new_value.
14. Trace final marca estabilizacion.
15. visual se preserva intacto.
16. max_iterations se respeta.

Reglas:

1. Pruebas de core sin FastAPI.
2. Pruebas de service sin servidor real.
3. Pruebas de API con TestClient si se agrega FastAPI integration.
4. Fixtures pequenos.
5. No depender de orden de diccionarios salvo que el servicio lo garantice.

Fallos comunes:

- Probar modelos viejos y nuevos mezclados.
- Esperar campos target_id/result_value en Motor cuando su trace interno usa variable_id/new_value.
- Omitir visual-preservation.
```

## Prompt de correccion rapida

```text
Reorganiza test_motor.py por capas: Belnap, conectivos, modelos, propagacion y API. Cada bloque debe fallar con una causa clara.
```
