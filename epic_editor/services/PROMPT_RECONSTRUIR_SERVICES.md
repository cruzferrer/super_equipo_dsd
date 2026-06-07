# Prompt para reconstruir epic_editor/services

Usa este prompt para reconstruir solo los servicios del Editor.

```text
Actua como ingeniero TypeScript senior especializado en clientes HTTP, adaptadores de contrato y manejo de errores.

Reconstruye exclusivamente epic_editor/services. Antes de escribir codigo, inspecciona:

- epic_editor/services/motorApiClient.ts
- epic_editor/domain/editorTypes.ts
- epic_motor/models/snapshot.py
- epic_motor/api/routes.py
- epic_motor/services/engine.py
- epic_simulador/simulator.js

Objetivo:

Crear un cliente de Motor desacoplado que permita al Editor enviar PlaygroundSnapshot al endpoint /calcular y recibir un PlaygroundSnapshot publico con execution_trace normalizado.

Archivo esperado:

- motorApiClient.ts

Responsabilidades:

1. Definir IMotorClient con health, getConectivos y calcular.
2. Definir MotorApiClient real basado en fetch.
3. Definir MotorApiError con statusCode, detail y raw.
4. Definir MockMotorClient para pruebas.
5. Consultar GET /health.
6. Consultar GET /conectivos.
7. Enviar POST /calcular.
8. Adaptar contrato publico del Editor al formato que espera el Motor si difieren.
9. Normalizar respuesta del Motor al contrato publico del Editor.
10. Preservar visual intacto.

Reglas:

1. Esta es la unica capa del Editor que puede usar fetch.
2. No calcular Belnap.
3. No renderizar.
4. No validar todo el snapshot aqui; eso pertenece a validators.
5. No filtrar silenciosamente errores 422 o 500.
6. No exponer el formato interno Python al resto del Editor.
7. Si el Motor usa variables como diccionario con value, adaptalo aqui.
8. Si el Editor usa arrays con truth_value, conserva esa forma hacia afuera.

Normalizacion minima:

Entrada publica:

- truth_value -> value
- from_variable -> source
- to_variable -> target
- max_iterations -> meta.max_iterations

Salida publica:

- value -> truth_value
- source -> from_variable
- target -> to_variable
- execution_trace.actions con variable_id/new_value -> target_id/result_value si el resto del Editor lo espera asi.

Pruebas que debe soportar:

- health true cuando status es ok.
- getConectivos devuelve arreglo.
- calcular envia payload correcto.
- calcular mapea respuesta a PlaygroundSnapshot publico.
- 422 devuelve MotorApiError legible.
- 500 devuelve MotorApiError legible.
- MockMotorClient permite ejecutar sin servidor real.

Fallos comunes a evitar:

- Hacer que domain dependa del formato interno del Motor.
- Devolver diccionarios Python al Simulador cuando espera arrays.
- Perder execution_trace durante la normalizacion.
- Sobrescribir visual.
```

## Prompt de correccion rapida

```text
Corrige MotorApiClient para que sea una frontera limpia. El resto del Editor debe hablar PlaygroundSnapshot publico. Si /calcular necesita otro shape, convierte antes de fetch y reconvierte despues de recibir la respuesta.
```
