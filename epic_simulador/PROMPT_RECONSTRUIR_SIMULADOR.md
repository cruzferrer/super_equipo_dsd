# Prompt para reconstruir el Simulador

Este prompt sirve para reconstruir solamente la capa `epic_simulador`.

El Simulador es el visualizador. Recibe un `PlaygroundSnapshot` final, lee la capa visual para dibujar y lee `execution_trace` para animar. No debe calcular la logica de Belnap.

## Prompt principal

```text
Actua como desarrollador frontend senior especializado en SVG, animaciones, UI interactiva y visualizacion de grafos.

Vas a reconstruir exclusivamente la carpeta epic_simulador del proyecto EPiC Playground PoC. Antes de escribir codigo, inspecciona:

- epic_simulador/index.html
- epic_simulador/style.css
- epic_simulador/simulator.js
- epic_simulador/e2e-real-trace.json
- epic_editor/domain/editorTypes.ts
- epic_motor/models/snapshot.py
- epic_motor/services/engine.py

Objetivo:

Crear una SPA con Vite, HTML, CSS y JavaScript que pueda cargar un PlaygroundSnapshot, dibujar conjuntos como circunferencias, dibujar variables como bolitas, dibujar relaciones como flechas y reproducir el execution_trace paso a paso o de forma continua.

Responsabilidades del Simulador:

1. Cargar JSON desde archivo.
2. Cargar JSON pegado en un textarea.
3. Cargar presets de ejemplo.
4. Normalizar snapshots que vengan del contrato publico TypeScript o del contrato interno Python.
5. Dibujar visual.sets como circunferencias.
6. Dibujar visual.instances como bolitas asociadas a variable_id.
7. Dibujar logic.relations como flechas.
8. Construir historial de valores por step usando execution_trace.actions.
9. Mostrar una vista global del grafo.
10. Mostrar una vista por cajitas con pares consecutivos de conjuntos.
11. Reproducir toda la secuencia con un boton Play/Pause.
12. Avanzar exactamente un movimiento con un boton Siguiente.
13. Permitir regresar o reiniciar.
14. Mostrar log de acciones.
15. Incluir un sandbox de Editor Interactivo solo como herramienta temporal, no como reemplazo del Editor real.

Reglas visuales obligatorias:

1. Las circunferencias representan conjuntos.
2. Las flechas representan implicaciones o relaciones de propagacion.
3. Si hay A -> B -> C, la vista por cajitas debe mostrar A/B y luego B/C.
4. La segunda circunferencia de una cajita debe repetirse como primera en la siguiente cuando forme parte de la cadena.
5. Si una variable tiene varias instancias visuales con el mismo variable_id, todas deben sincronizar valor y visibilidad.
6. Valor V: bolita/particula verde.
7. Valor F: bolita/particula roja.
8. Valor N: bolita neutra o invisible segun el paso.
9. Valor B: representacion de contradiccion o combinacion.
10. El Simulador no debe calcular valores finales; solo reproduce el trace.

Reglas de movimiento:

1. Al ejecutar una accion de cambio, identifica la variable destino.
2. Busca una relacion en logic.relations que explique ese cambio.
3. Para V, anima la particula en direccion from_variable -> to_variable.
4. Para F, anima la particula en direccion contraria.
5. La bolita no debe quedarse estatica en origen y destino durante toda la animacion.
6. Usa el DOM del paso anterior para iniciar la animacion.
7. Oculta o desvanece la bolita de origen cuando la particula sale, si ese origen pierde visibilidad en ese paso.
8. Al terminar el recorrido, actualiza valor y visibilidad del destino.
9. Despues de terminar la animacion, vuelve a renderizar el step completo.
10. En ciclos, evita que una bolita desaparezca y reaparezca en la circunferencia incorrecta.

Normalizacion de contratos:

Debes soportar acciones con esta forma publica:

- step
- action_type
- target_id
- result_value
- description

Y tambien acciones del Motor Python:

- step
- variable_id
- old_value
- new_value
- description
- is_stabilized

Normaliza internamente a:

- step
- variable_id
- old_value
- new_value
- is_stabilized
- description

Tambien debes soportar variables con:

- id + truth_value
- id + value

Y relaciones con:

- from_variable + to_variable
- source + target

Estructura esperada:

epic_simulador/
  index.html
  style.css
  simulator.js
  e2e-real-trace.json
  package.json

Pruebas/verificacion:

1. npm run build debe pasar.
2. El preset simple debe mostrar p(V) moviendose hacia q.
3. El preset contraposicional debe mostrar F en movimiento inverso.
4. El preset de contradiccion debe mostrar acumulacion hacia B.
5. El preset de ciclo no debe mostrar apariciones del lado contrario.
6. El boton Siguiente avanza solo un step.
7. El boton Play reproduce hasta el final.
8. Cargar e2e-real-trace.json debe dibujar y animar sin errores.

Entrega codigo completo, comandos de ejecucion y cualquier limitacion encontrada.
```

## Prompt especifico para corregir movimiento

Usa este prompt si la visualizacion ya existe pero el movimiento esta mal.

```text
Corrige solamente la logica de animacion del Simulador.

Fallo observado:

En una cadena o ciclo, el primer paso funciona, pero en el siguiente la bolita desaparece y aparece en otra circunferencia sin recorrer el camino correcto. Tambien puede pasar que la bolita se quede estatica en origen y destino en lugar de moverse.

Requisitos:

1. Antes de cambiar el step, anima sobre el SVG actual.
2. Encuentra la relacion que conecta el origen y destino del cambio.
3. Para new_value V, usa direccion source -> target.
4. Para new_value F, usa direccion target -> source.
5. Crea una particula temporal sobre el path.
6. Si corresponde, baja la opacidad de la instancia origen despues de iniciar la particula.
7. Al completar la animacion, actualiza todas las instancias visuales con el variable_id destino.
8. Despues re-renderiza el step completo.
9. No dejes dos bolitas identicas visibles durante toda la transicion.
10. No calcules Belnap; usa solo execution_trace.

Agrega pruebas manuales o presets que demuestren:

- V avanza.
- F retrocede.
- B se representa sin romper la animacion.
- Una variable repetida en varias cajitas se sincroniza.
```

## Prompt para usuario no tecnico

Usa este prompt si la app solo funciona con scripts.

```text
Agrega una ruta de uso para usuario no tecnico. El usuario debe poder ingresar datos desde el navegador sin ejecutar scripts. Conserva tres vias:

1. Presets de ejemplo.
2. Carga de archivo JSON.
3. Editor Interactivo temporal con formularios para conjuntos, variables y relaciones, boton para llamar POST /calcular y carga automatica del resultado en el Simulador.

Documenta en README que los scripts son solo una opcion tecnica y que el flujo principal es desde la interfaz.
```

## Fallos comunes y como ajustar el prompt

### Las cajitas no repiten el conjunto intermedio

```text
Reescribe extractBoxPairs. Debe construir pares desde las relaciones entre conjuntos. Para una secuencia A -> B -> C, el resultado debe ser [[A, B], [B, C]]. No agrupes todos los sets en una sola tarjeta.
```

### Solo se actualiza una copia visual de la variable

```text
Corrige la seleccion de instancias. Siempre que una accion cambie variable_id q, busca todas las visual.instances donde instance.variable_id === "q" y actualiza todas en la vista global y en cada cajita.
```

### La accion de estabilizacion intenta animarse

```text
Filtra acciones con is_stabilized true, target_id "*", variable_id "*" o result_value "*". Esas acciones solo deben pulsar o marcar el estado estabilizado, no crear particulas.
```

### La animacion usa el lado contrario

```text
Normaliza la relacion antes de animar. Si la accion cambia la variable target y el valor nuevo es V, anima desde from_variable hacia to_variable. Si el valor nuevo es F, anima en sentido inverso sobre el mismo path. Si la relacion es contrapositional o is_contrapositive, invierte la interpretacion solo una vez y documenta la regla.
```

### El build falla por dependencias de CDN

```text
Revisa index.html y package.json. Si el build de Vite falla por librerias externas, usa import local cuando sea necesario o conserva el CDN solo si no rompe build. No agregues frameworks pesados si la app actual es HTML/CSS/JS vanila.
```
