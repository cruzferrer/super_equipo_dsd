# Super-Equipo-DSD

Nuevo Contrato y Arquitectura EPiC Playground
(README TEMPORAL)
Para los cambios (ej. “si una bolita aparece en una cosa, todas las cosas con ese nombre también deben tener la bolita - Diego” y “que se muestre paso a paso - Gonzalo”), la arquitectura ha cambiado.

El Editor es donde se van a basar los demas equipos. Hemos rediseñado el JSON principal (PlaygroundSnapshot) para separar estrictamente la lógica matemática de las coordenadas visuales. Esto permite que una misma variable lógica (ej. "p") pueda estar dibujada en 5 cajas distintas al mismo tiempo y actúe igual en todas.

# 1. Flujo de Comunicación

Como deberia ser el flujo para la aplicacion.

Editor (UI): El usuario dibuja, conecta y configura.

Editor -> Motor: El Editor empaqueta el estado en un JSON (PlaygroundSnapshot) y le hace un POST /calcular al Motor.

Motor -> Editor: El Motor hace sus cálculos matriciales y nos responde con el mismo JSON intacto, pero inyectándole un bloque nuevo llamado execution_trace (el rastro paso a paso).

Editor -> Simulador: El Editor recibe la respuesta del Motor, actualiza su estado y le pasa este JSON final (con el trace incluido) al Simulador para que reproduzca la animación visual.

# 2. Guía para el Equipo MOTOR

Su API debe recibir el PlaygroundSnapshot y devolverlo modificado.

Qué archivo deben revisar: Abran domain/editorTypes.ts.

Qué interfaces les importan: PlaygroundSnapshot, PlaygroundMeta, LogicGraph y ExecutionTrace.

Qué deben hacer:

Ignoren la capa visual: Al recibir el JSON, ignoren por completo la llave visual. A ustedes no les importa dónde están dibujadas las cosas (coordenadas x, y, colores).

Lean la capa lógica: Entren a logic.variables, logic.sets y logic.relations. Ahí está el grafo puro.

Lean los metadatos: En meta.max_iterations viene su límite de iteraciones.

Generen la respuesta: Procesen la propagación. Su respuesta HTTP debe devolver el JSON que les mandamos, pero deben agregarle el nodo execution_trace. En ese trace van a listar el arreglo secuencial de acciones (quién cambió, a qué valor y en qué iteración) y si el sistema se estabilizó o no.

# 3. Guía para el Equipo SIMULADOR / VISUALIZADOR

Van a recibir el PlaygroundSnapshot final estabilizado.

Qué archivo deben revisar: Abran domain/editorTypes.ts.

Qué interfaces les importan: PlaygroundSnapshot, VisualLayer, VisualInstance y ExecutionTrace.

Qué deben hacer:

Lean la capa visual para posicionar: En visual.sets y visual.instances vienen todas las coordenadas (x, y, radius, shape). Úsenlas para pintar el lienzo inicial.

Entiendan el mapeo lógico-visual (El requerimiento del profesor): En visual.instances, cada bolita dibujada tiene un variable_id. Si tres bolitas distintas tienen variable_id: "p", significa que son copias de la misma variable.

Reproduzcan el paso a paso: Entren al bloque execution_trace.actions. Ahí viene el arreglo secuencial que generó el Motor. Si la acción 1 dice “la variable 'p' cambió a V”, ustedes deben buscar TODAS las instancias visuales que tengan variable_id: "p" y pintarlas de verde en la pantalla al mismo tiempo. Así logramos el "movimiento por movimiento".

# # QUE CAMBIAMOS EN EL EDITOR

## 4. Arquitectura Interna del Editor (Refactorización 3.0)

### Directorio: `domain/`

- **`editorTypes.ts`**: Define el contrato `PlaygroundSnapshot`.
  - _Cambio clave:_ Separamos `LogicVariable` (la identidad matemática) de `VisualInstance` (los círculos en el lienzo). Esto permite que una variable tenga `N` representaciones visuales.
  - _Cambio clave:_ Definimos el `ExecutionTrace`, que es el lenguaje en el que el Motor nos cuenta la historia de la propagación.
- **`editorState.ts`**: Define el estado inicial y la estructura de la memoria del Editor.
- **`editorActions.ts`**: Contiene la lógica pura de modificación.
  - _Cambio clave:_ Implementamos **Borrado en Cascada**. Si el usuario borra una variable del inventario, el sistema barre automáticamente todas sus copias visuales en el lienzo para evitar "bolitas fantasmales" sin lógica detrás.

### Directorio: `services/`

- **`motorApiClient.ts`**: Se encarga de la comunicación exterior.
  - _Cambio clave:_ Se eliminaron los adaptadores intermedios. Ahora enviamos el Snapshot directo.
  - _Aporte técnico:_ Incluimos un `MockMotorClient` que simula una respuesta exitosa con un rastro de ejecución. Esto permite al equipo del Simulador trabajar aunque el Motor no esté encendido.

### Directorio: `validators/`

- **`editorValidation.ts`**: El guardián de la integridad.
  - _Cambio clave:_ Ahora valida la **Integridad Referencial**. Asegura que ninguna "bolita" visual apunte a una variable lógica inexistente y que no existan ciclos infinitos en la jerarquía de cajas antes de enviar los datos al Motor.

### Directorio: `controllers/`

- **`editorController.ts`**: El orquestador único.
  - _Responsabilidad:_ Es la única clase que la Interfaz de Usuario (UI) debe tocar. Coordina las acciones, dispara las validaciones y gestiona el paso de modo "Edición" a modo "Ejecución".

---

## 5. Resolución de Requerimientos Específicos

- **"Mismo nombre, misma bolita"**:
  Logrado mediante el mapeo `VisualInstance.variable_id -> LogicVariable.id`. El Motor solo procesa la variable una vez, y el Simulador actualiza todas las instancias visuales que compartan ese ID.

- **"Paso a paso (Movimiento por movimiento)"**:
  Logrado mediante la interfaz `ExecutionTrace`. El Motor ya no devuelve solo el resultado final, sino un arreglo de `ExecutionAction`. Cada acción tiene un `step` (paso) que el Simulador usa para cronometrar la animación.

- **"Poner donde sea"**:
  La capa visual es ahora un diccionario (`Record<string, ...>`). Esto permite libertad total de coordenadas `X`, `Y` sin restricciones de rejilla, permitiendo al Simulador total flexibilidad para renderizar.

---

- **Eliminado:** `editorToMotorInput.ts`. Ya no necesitamos adaptar nuestro lenguaje al del Motor; ahora ellos hablan nuestro idioma.
- **Refactorizado:** `editorTests.test.ts`. Se borraron las pruebas de contratos viejos y se añadieron pruebas de integridad de grafos y borrado en cascada.
