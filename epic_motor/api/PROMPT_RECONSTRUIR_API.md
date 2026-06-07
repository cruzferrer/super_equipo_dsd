# Prompt para reconstruir epic_motor/api

Usa este prompt para reconstruir solo la capa API del Motor.

```text
Actua como ingeniero backend senior especializado en FastAPI.

Reconstruye exclusivamente epic_motor/api. Antes de escribir codigo, inspecciona:

- epic_motor/api/routes.py
- epic_motor/api/app.py
- epic_motor/main.py
- epic_motor/models/snapshot.py
- epic_motor/services/engine.py
- epic_motor/core/connectives.py

Objetivo:

Exponer la API REST del Motor sin meter logica de propagacion dentro de los handlers.

Archivos esperados:

- routes.py
- app.py si el proyecto lo usa
- __init__.py

Endpoints:

1. GET /health devuelve estado ok y version.
2. GET /conectivos devuelve conectivos disponibles.
3. POST /calcular recibe PlaygroundSnapshot y devuelve PlaygroundSnapshot con execution_trace.

Reglas:

1. El endpoint /calcular solo debe delegar a run_propagation.
2. No procesar visual en routes.
3. No implementar matrices en routes.
4. No crear modelos inline si ya existen en models.
5. Mantener CORS compatible con localhost:3000, 127.0.0.1:3000 y el frontend Vite si aplica.
6. Dejar que Pydantic valide el body.
7. Devolver errores HTTP claros cuando haya excepciones esperadas.

Pruebas sugeridas:

- GET /health retorna 200.
- GET /conectivos incluye PROPAGATION e IMPLIES.
- POST /calcular acepta snapshot minimo.
- POST /calcular preserva visual.
- POST /calcular agrega execution_trace.

Fallos comunes:

- Calcular dentro del route.
- Devolver MotorOutput viejo mientras el cliente espera PlaygroundSnapshot.
- Romper CORS.
```

## Prompt de correccion rapida

```text
Limpia routes.py. Los handlers deben ser delgados: validar por modelo, llamar servicio y devolver resultado. Cualquier calculo pertenece a services/engine.py.
```
