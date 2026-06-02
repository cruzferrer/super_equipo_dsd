# Prompt para reconstruir el Motor

Este prompt sirve para reconstruir solamente la capa `epic_motor`.

El Motor es el nucleo de calculo. Recibe el estado del playground, ignora la capa visual, propaga valores de Belnap sobre el grafo logico y devuelve el snapshot con `execution_trace`.

## Prompt principal

```text
Actua como arquitecto de backend senior especializado en Python, FastAPI, Pydantic, pruebas unitarias y logica formal.

Vas a reconstruir exclusivamente la carpeta epic_motor del proyecto EPiC Playground PoC. Antes de escribir codigo, inspecciona:

- epic_motor/models/snapshot.py
- epic_motor/core/belnap.py
- epic_motor/core/connectives.py
- epic_motor/services/engine.py
- epic_motor/api/routes.py
- epic_motor/main.py
- epic_motor/tests/test_motor.py
- epic_editor/domain/editorTypes.ts
- epic_editor/services/motorApiClient.ts

Objetivo:

Crear un microservicio FastAPI que procese un PlaygroundSnapshot, calcule propagacion logica de Belnap y devuelva el mismo snapshot con execution_trace.

Responsabilidades del Motor:

1. Exponer GET /health.
2. Exponer GET /conectivos.
3. Exponer POST /calcular.
4. Validar entrada con Pydantic.
5. Leer solo la capa logic y meta.max_iterations.
6. Ignorar visual por completo y devolverlo intacto.
7. Procesar relaciones source -> target con conectivos.
8. Soportar flujo contraposicional cuando la relacion lo indique.
9. Usar k-join para acumular evidencia.
10. Generar ExecutionAction cada vez que cambie una variable.
11. Generar accion final de estabilizacion cuando ya no haya cambios.
12. Cortar por max_iterations si no estabiliza.

Reglas obligatorias:

1. No renderizar.
2. No depender del Editor ni del Simulador.
3. No interpretar coordenadas, colores o radios.
4. No modificar visual.
5. No aceptar conectivos inventados sin registrarlos en core/connectives.py.
6. No mezclar modelos antiguos si el endpoint activo usa PlaygroundSnapshot.
7. Mantener CORS para el frontend local.

Modelo conceptual:

El Motor puede usar internamente:

- LogicVariable con id y value.
- LogicRelation con source, target, connective e is_contrapositive.
- LogicGraph con variables, sets y relations como diccionarios.
- ExecutionAction con step, variable_id, old_value, new_value, description e is_stabilized.
- ExecutionTrace con actions, stabilized y total_iterations.

Algoritmo:

1. Clonar o mutar de forma controlada el snapshot recibido.
2. Inicializar execution_trace.
3. Para cada iteracion desde 1 hasta max_iterations:
   - recorrer relaciones;
   - encontrar variable origen y destino;
   - seleccionar direccion normal o contraposicional;
   - aplicar conectivo;
   - combinar evidencia con bv_kjoin;
   - si el valor cambia, actualizar variable y registrar accion.
4. Si una iteracion no produce cambios:
   - marcar stabilized true;
   - registrar accion de estabilizacion;
   - detener.
5. Si llega al limite:
   - marcar stabilized false;
   - devolver trace con total_iterations.

Pruebas minimas:

1. Belnap NOT, AND, OR y KJOIN.
2. Normalizacion de strings a V, F, N, B.
3. Conectivos validos e invalidos.
4. Una variable sin relaciones no cambia y estabiliza.
5. Propagacion directa V -> N produce V.
6. Dos fuentes V y F hacia N producen B.
7. Relacion contraposicional registra mutacion.
8. Trace registra variable_id, old_value, new_value e is_stabilized.
9. POST /calcular devuelve visual intacto.
10. max_iterations detiene ciclos no estabilizados.

Entrega codigo completo, comandos para ejecutar pytest y comando para levantar uvicorn.
```

## Prompt de compatibilidad con Editor

Usalo cuando el Motor y el Editor no se entiendan.

```text
Revisa la compatibilidad entre epic_editor/services/motorApiClient.ts y epic_motor/models/snapshot.py. El Editor publico usa truth_value/from_variable/to_variable; el Motor puede usar value/source/target. Corrige solo la frontera de adaptacion necesaria para que POST /calcular reciba lo que Pydantic espera y el Editor reciba de vuelta un PlaygroundSnapshot publico con execution_trace normalizado.
```

## Fallos comunes y como ajustar el prompt

### El Motor devuelve solo el resultado final

```text
Agrega execution_trace. Por cada cambio de valor, registra una accion con step, variable_id, old_value, new_value, description e is_stabilized false. Al estabilizar, agrega una accion final con is_stabilized true.
```

### El Motor modifica visual

```text
Corrige el Motor para tratar snapshot.visual como payload opaco. No lo leas para calcular y no lo cambies. Debe salir igual que entro.
```

### El Motor acepta payloads pero el Editor recibe 422

```text
Inspecciona el JSON real que envia MotorApiClient y comparalo con el modelo Pydantic activo. No cambies todo el contrato: ajusta el adaptador HTTP o el modelo Pydantic para que ambos hablen la misma forma en /calcular.
```

### La propagacion no estabiliza correctamente

```text
Revisa el ciclo de iteraciones. Debe contar cambios por iteracion, detenerse solo cuando cambios_en_esta_iteracion sea 0, y respetar meta.max_iterations. Agrega una prueba donde un grafo sin relaciones estabilice en la primera iteracion.
```

### Las acciones no sirven al Simulador

```text
Incluye en cada ExecutionAction suficiente informacion para animar: variable_id destino, old_value, new_value, step y descripcion. Si puedes conservar relacion_origen o relation_id sin romper el contrato, agregalo como metadata opcional; si no, el Simulador inferira la relacion desde logic.relations.
```
