# Prompts de reconstruccion por capas

Este archivo funciona como guia maestra para reconstruir el proyecto EPiC Playground PoC con ayuda de una IA. La reconstruccion debe hacerse por capas, desde el contrato interno hasta la visualizacion.

Usa estos prompts en este orden por capas:

1. Este archivo para fijar contrato, responsabilidades y flujo.
2. `epic_motor/PROMPT_RECONSTRUIR_MOTOR.md`
3. `epic_editor/PROMPT_RECONSTRUIR_EDITOR.md`
4. `epic_simulador/PROMPT_RECONSTRUIR_SIMULADOR.md`
5. Este archivo otra vez para validar la integracion completa.

## Prompts especificos por carpeta

Editor:

- `epic_editor/domain/PROMPT_RECONSTRUIR_DOMAIN.md`
- `epic_editor/controllers/PROMPT_RECONSTRUIR_CONTROLLERS.md`
- `epic_editor/services/PROMPT_RECONSTRUIR_SERVICES.md`
- `epic_editor/validators/PROMPT_RECONSTRUIR_VALIDATORS.md`
- `epic_editor/tests/PROMPT_RECONSTRUIR_TESTS.md`

Motor:

- `epic_motor/models/PROMPT_RECONSTRUIR_MODELS.md`
- `epic_motor/core/PROMPT_RECONSTRUIR_CORE.md`
- `epic_motor/logic/PROMPT_RECONSTRUIR_LOGIC.md`
- `epic_motor/services/PROMPT_RECONSTRUIR_SERVICES.md`
- `epic_motor/engine/PROMPT_RECONSTRUIR_ENGINE.md`
- `epic_motor/api/PROMPT_RECONSTRUIR_API.md`
- `epic_motor/tests/PROMPT_RECONSTRUIR_TESTS.md`

Simulador:

- `epic_simulador/PROMPT_RECONSTRUIR_HTML.md`
- `epic_simulador/PROMPT_RECONSTRUIR_STYLES.md`
- `epic_simulador/PROMPT_RECONSTRUIR_RUNTIME.md`
- `epic_simulador/PROMPT_RECONSTRUIR_DATOS.md`

Antes de pedir codigo, la IA debe leer los archivos reales del repositorio. Si hay contradiccion entre documentacion antigua y codigo, debe priorizar el codigo activo.

## Contrato arquitectonico que no se debe romper

El sistema se divide en tres equipos:

- Editor: recibe acciones del usuario, crea el `PlaygroundSnapshot`, valida referencias y envia el snapshot al Motor.
- Motor: ignora la capa visual, calcula propagacion logica de Belnap y devuelve el mismo snapshot con `execution_trace`.
- Simulador: no calcula logica, solo lee `visual` y `execution_trace` para animar el resultado.

El flujo esperado es:

```text
Usuario -> Editor -> PlaygroundSnapshot -> POST /calcular -> Motor
Motor -> PlaygroundSnapshot con execution_trace -> Editor -> Simulador
```

## Fuente de verdad actual

La fuente de verdad publica del Editor esta en:

```text
epic_editor/domain/editorTypes.ts
```

Interfaces clave:

- `PlaygroundSnapshot`
- `PlaygroundMeta`
- `LogicGraph`
- `LogicVariable`
- `LogicSet`
- `LogicRelation`
- `VisualLayer`
- `VisualInstance`
- `ExecutionTrace`
- `ExecutionAction`

El Motor Python tambien tiene un modelo interno en:

```text
epic_motor/models/snapshot.py
```

Ese modelo usa diccionarios y nombres internos como `value`, `source`, `target`. El Editor puede adaptarse a ese formato en `MotorApiClient`, pero no se debe confundir ese payload interno con el contrato publico que consume el Simulador.

Nota importante: `epic_motor/models/schemas.py` conserva el contrato viejo `ElementoIn`/`ConjuntoIn`. Si el endpoint activo usa `models/snapshot.py`, no reconstruyas el sistema desde `schemas.py` salvo que el equipo decida volver explicitamente a ese contrato.

## Prompt maestro para reconstruir el proyecto

Copia este prompt cuando quieras que una IA reconstruya todo el proyecto por capas.

```text
Actua como arquitecto de software senior y desarrollador full-stack. Vas a reconstruir el proyecto EPiC Playground PoC por capas, respetando la arquitectura real del repositorio.

Primero inspecciona estos archivos:

- README.md
- epic_editor/domain/editorTypes.ts
- epic_editor/domain/editorState.ts
- epic_editor/domain/editorActions.ts
- epic_editor/validators/editorValidation.ts
- epic_editor/controllers/editorController.ts
- epic_editor/services/motorApiClient.ts
- epic_motor/models/snapshot.py
- epic_motor/services/engine.py
- epic_motor/api/routes.py
- epic_simulador/simulator.js
- epic_simulador/index.html
- epic_simulador/style.css

Objetivo general:

Reconstruir un sistema modular donde el usuario crea un grafo visual en el Editor, el Editor produce un PlaygroundSnapshot, el Motor calcula la propagacion logica y agrega execution_trace, y el Simulador reproduce visualmente la secuencia.

Reglas obligatorias:

1. No mezcles responsabilidades.
2. El Editor no calcula Belnap ni anima.
3. El Motor no lee coordenadas ni renderiza.
4. El Simulador no calcula valores finales.
5. La capa logic representa identidad matematica.
6. La capa visual representa coordenadas, radios, formas e instancias.
7. Una variable logica puede tener muchas instancias visuales.
8. Si varias instancias tienen el mismo variable_id, son copias visuales de la misma variable.
9. El Motor devuelve un execution_trace cronologico.
10. El Simulador debe poder reproducir toda la secuencia continua y tambien paso a paso.

Contrato esperado:

El snapshot publico debe tener esta forma conceptual:

{
  "meta": {
    "schema_version": "3.0",
    "editor_mode": "edicion | ejecucion",
    "belnap_domain": ["V", "F", "N", "B"],
    "max_iterations": 100
  },
  "logic": {
    "variables": [],
    "sets": [],
    "relations": []
  },
  "visual": {
    "instances": {},
    "sets": {},
    "relations": {}
  },
  "execution_trace": {
    "iterations": 0,
    "stabilized": true,
    "actions": [],
    "final_logic": {}
  }
}

Reconstruye por capas:

1. Contrato compartido y reglas de frontera.
2. Motor y API.
3. Editor y cliente HTTP.
4. Simulador y visualizacion.
5. Pruebas unitarias y flujo end-to-end.

Al terminar cada capa, ejecuta sus pruebas o build correspondiente. Si una prueba falla, no parches al azar: identifica si el fallo es de contrato, adaptacion, logica o visualizacion.

Entrega:

- Lista de archivos creados o modificados.
- Explicacion breve de la responsabilidad de cada capa.
- Comandos para ejecutar pruebas.
- Riesgos pendientes si alguna parte no pudo verificarse.
```

Cuando una capa grande falle, no vuelvas a pedir "reconstruye todo". Usa el prompt especifico de la subcarpeta responsable. Por ejemplo: si falla una referencia visual fantasma, usa `epic_editor/validators/PROMPT_RECONSTRUIR_VALIDATORS.md`; si falla el movimiento de bolitas, usa `epic_simulador/PROMPT_RECONSTRUIR_RUNTIME.md`.

## Reglas visuales del Simulador que deben sobrevivir

El visualizador debe pintar circunferencias que representan conjuntos y flechas que representan implicaciones o propagaciones.

La vista por cajitas debe mostrar pares consecutivos de circunferencias:

```text
Cajita 1: A -> B
Cajita 2: B -> C
Cajita 3: C -> D
```

La segunda circunferencia de una cajita debe aparecer tambien como primera circunferencia de la siguiente cuando forme parte de la cadena. Si un movimiento ocurre en una variable `q`, todas las instancias visuales con `variable_id: "q"` deben sincronizar su valor.

Reglas de movimiento:

- Valor `V`: particula verde viaja en direccion de la flecha.
- Valor `F`: particula roja viaja en direccion contraria.
- Valor `N`: no debe mostrarse como bolita activa.
- Valor `B`: debe representarse como contradiccion o estado combinado.
- La bolita debe moverse visualmente; no debe quedarse estatica en origen y destino durante toda la animacion.
- Durante la animacion, se puede ocultar el origen despues de que la particula sale y revelar el destino al completar el recorrido.
- En ciclos o cadenas, no debe desaparecer una bolita y aparecer magicamente del lado incorrecto.

## Prompts de rescate ante fallos comunes

Usa estos fragmentos si la IA genera una implementacion incompleta.

### Si mezcla contrato viejo con contrato nuevo

```text
Corrige la implementacion. Estas mezclando el contrato viejo ElementoIn/ConjuntoIn con el contrato actual PlaygroundSnapshot. Lee epic_editor/domain/editorTypes.ts y usa ese contrato como interfaz publica. Si el Motor necesita otro formato interno, encapsula la adaptacion en MotorApiClient o en la frontera HTTP, no en el Simulador ni en las acciones del Editor.
```

### Si el Motor intenta procesar coordenadas visuales

```text
Corrige el Motor. El Motor debe ignorar por completo snapshot.visual. Solo puede leer snapshot.logic.variables, snapshot.logic.sets, snapshot.logic.relations y snapshot.meta.max_iterations. La capa visual debe devolverse intacta.
```

### Si el Simulador calcula valores logicos

```text
Corrige el Simulador. No debe calcular Belnap ni decidir resultados finales. Debe leer execution_trace.actions y final_logic. Su trabajo es normalizar el trace, construir una linea de tiempo visual y animar las instancias que comparten variable_id.
```

### Si la animacion salta o aparece del lado contrario

```text
Corrige la animacion de movimiento. Para cada accion, busca una relacion que explique el cambio de la variable destino. Si result_value o new_value es V, anima desde origen hacia destino. Si es F, anima desde destino hacia origen. Antes de renderizar el nuevo paso, ejecuta la particula sobre el path del paso anterior; despues de completar el recorrido, actualiza la visibilidad y el valor de todas las instancias con el mismo variable_id. Evita mostrar la misma bolita fija en origen y destino durante toda la transicion.
```

### Si los botones de reproduccion no cumplen el requisito

```text
Agrega dos controles separados: uno para reproducir toda la secuencia automaticamente y otro para avanzar exactamente un movimiento. El boton de siguiente paso debe ejecutar solo las acciones del siguiente step y detenerse. El boton de reproducir debe llamar repetidamente al avance hasta terminar o hasta que el usuario pause.
```

### Si el usuario no puede meter datos sin scripts

```text
Agrega o conserva una ruta de uso para usuario no tecnico. Debe poder crear datos desde la interfaz del Editor Interactivo o cargar/pegar un JSON desde el Simulador. No dependas exclusivamente de scripts de consola. Si hay un flujo de prueba con scripts, documentalo como opcion tecnica, no como flujo principal del usuario.
```
