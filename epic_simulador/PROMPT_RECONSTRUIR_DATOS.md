# Prompt para reconstruir datos de ejemplo del Simulador

Usa este prompt para reconstruir presets y archivos JSON de ejemplo.

```text
Actua como ingeniero de QA frontend especializado en fixtures de datos.

Reconstruye exclusivamente los datos de ejemplo de epic_simulador, especialmente e2e-real-trace.json y presets dentro de simulator.js. Antes de escribir datos, inspecciona:

- epic_simulador/e2e-real-trace.json
- epic_simulador/simulator.js
- epic_editor/domain/editorTypes.ts
- epic_motor/models/snapshot.py

Objetivo:

Crear snapshots pequenos pero representativos para probar visualizacion, cajitas y animacion.

Fixtures obligatorios:

1. Implicacion simple: p(V) -> q(N), q termina V.
2. Contraposicion: q(F) obliga movimiento inverso hacia p.
3. Contradiccion: p(V) y r(F) llegan a q(B).
4. Cadena: A -> B -> C para verificar cajitas repetidas.
5. Ciclo controlado para verificar que no aparecen bolitas del lado incorrecto.
6. Variable repetida en varias instancias visuales para verificar sincronizacion.

Reglas:

1. Usar PlaygroundSnapshot publico como base.
2. Incluir meta, logic, visual y execution_trace.
3. Las coordenadas deben ubicar instancias dentro de sus sets.
4. Cada relation debe tener visual.relations compatible.
5. Actions deben poder normalizarse a variable_id/new_value.
6. No crear datos gigantes.

Validaciones manuales:

- Cargar cada fixture no lanza error.
- Se dibujan todas las circunferencias.
- Se dibujan todas las flechas.
- Play termina.
- Siguiente avanza solo un movimiento.
- Variables repetidas se sincronizan.

Fallos comunes:

- Action apunta a variable inexistente.
- visual.instance apunta a fantasma.
- Coordenadas fuera del set y cajitas mal calculadas.
- Trace final no coincide con final_logic.
```

## Prompt de correccion rapida

```text
Revisa todos los fixtures contra editorTypes.ts. Corrige referencias rotas antes de tocar el renderizador.
```
