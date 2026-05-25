# EPiC Playground: Motor de Inferencia Lógica

Este repositorio contiene el microservicio del Motor para EPiC Playground. Actúa como el núcleo de cálculo matricial de propagaciones lógicas, fundamentado en la lógica de Belnap de cuatro valores ($V, F, N, B$).

Su arquitectura está construida sobre **FastAPI** y **Pydantic**, operando bajo un modelo de procesamiento topológico estricto: recibe el estado global del sistema, calcula la estabilización del grafo lógico iteración por iteración, y devuelve el rastro de ejecución paso a paso. El Motor garantiza una total independencia de la interfaz gráfica y de las coordenadas espaciales.

---

## 🚀 Requisitos y Despliegue Local

Para levantar el servidor de desarrollo en tu entorno local, sigue estos pasos:

1. Asegúrate de tener **Python 3.10+** instalado en tu sistema.
2. Instala las dependencias del proyecto ejecutando:
   ```bash
   pip install -r requirements.txt

Ejecuta el servidor mediante Uvicorn:
uvicorn main:app --reload

El endpoint principal estará disponible y escuchando peticiones en http://127.0.0.1:8000/calcular.

📝 Guía de Integración para el Equipo: EDITOR (UI)
El Motor funciona como un servicio pasivo. Espera recibir el estado completo del 
lienzo empaquetado en el contrato PlaygroundSnapshot a través de una petición HTTP.

Reglas Críticas de Integración:Endpoint de Comunicación: 

Realizar un método POST a la ruta /calcular enviando el JSON del estado actual en 
el cuerpo de la petición.Ceguera Espacial (Aislamiento Visual): El Motor ignora por 
completo el nodo visual del JSON. No procesamos coordenadas ($x, y$), radios, 
colores ni formas geométricas. Nuestra única fuente de verdad son las variables 
y conexiones definidas dentro del nodo logic.

Integridad Referencial: Antes de enviar el JSON, el Editor debe validar y garantizar 
que todas las aristas (logic.relations) apunten a source y target (logic.variables) 
que realmente existan. El Motor asume que el grafo entrante ya fue purgado de elemento
s "fantasma" o eliminados.Límite de Iteraciones (Safety Check): El Motor respetará el
valor numérico configurado en meta.max_iterations para evitar bucles de cálculo infinitos
en caso de que el usuario construya una retroalimentación cíclica sin resolución en el
lienzo.


🎨 Guía de Integración para el Equipo: SIMULADOR / VISUALIZADOR
Al finalizar el cálculo, el Motor devolverá el mismo PlaygroundSnapshot intacto que 
envió el Editor, pero con los valores lógicos actualizados y la inyección de un nuevo
nodo llamado execution_trace. Este nodo funciona como la partitura para orquestar la
animación en pantalla.

Cómo procesar la respuesta:
Separación de Lógica y Visualización: El Motor solo muta los atributos matemáticos 
(value dentro de LogicVariable). Es responsabilidad absoluta del Visualizador mapear 
los valores calculados de vuelta a sus representaciones gráficas en el lienzo, 
utilizando la llave de relación (ej. VisualInstance.variable_id).

Reproducción Paso a Paso: 1. Accede al nodo execution_trace.actions.
2. Itera sobre el arreglo cronológico. Cada elemento tiene la propiedad step 
(número de iteración en la que ocurrió el cambio) y variable_id (la entidad matemática que mutó).
3. Ejecuta los cambios visuales agrupando todas las acciones que compartan el 
mismo step para lograr el efecto de "movimiento por movimiento" de forma simultánea.

Estado de Estabilización: Revisa el flag booleano execution_trace.stabilized. 
Si es true, el grafo alcanzó un estado de reposo lógico; si es false, el sistema 
cortó la evaluación abruptamente porque se alcanzó el límite de max_iterations de 
seguridad sin lograr estabilizar la red.

🛠 Estructura Interna del Proyecto
El proyecto sigue el principio de Responsabilidad Única (SRP) dividiendo el código en los siguientes módulos:

api/: Controladores y definición del endpoint REST. Único punto de entrada/salida de datos.

core/: Lógica matemática pura de Belnap y definición de las matrices 4x4 de conectivos (AND, OR, IMPLIES, etc.). No tiene dependencias externas.

models/: Contratos estrictos de datos utilizando Pydantic que mapean la estructura del Shared Domain.json. Garantiza que las entradas y salidas sean correctas.

services/: Orquestador principal (engine.py). Se encarga de la propagación topológica del grafo y es el responsable de generar el historial de acciones (ExecutionTrace).

tests/: Batería de pruebas unitarias y de integración. Ejecutables vía pytest para garantizar que la lógica matemática y estructural no se rompa en futuras actualizaciones.