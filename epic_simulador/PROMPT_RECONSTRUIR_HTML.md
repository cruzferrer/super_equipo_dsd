# Prompt para reconstruir epic_simulador/index.html

Usa este prompt para reconstruir solo la estructura HTML del Simulador.

```text
Actua como desarrollador frontend senior especializado en HTML semantico y aplicaciones de herramientas visuales.

Reconstruye exclusivamente epic_simulador/index.html. Antes de escribir codigo, inspecciona:

- epic_simulador/index.html
- epic_simulador/style.css
- epic_simulador/simulator.js

Objetivo:

Crear la estructura de la SPA del Simulador sin meter logica inline. El HTML debe exponer IDs estables para que simulator.js conecte eventos y renderice vistas.

Secciones esperadas:

1. Header con nombre de la app.
2. Sidebar de carga de snapshot.
3. Dropzone para JSON.
4. Textarea para pegar JSON.
5. Boton para validar/cargar.
6. Presets de ejemplo.
7. Historial de propagacion.
8. Barra de controles con anterior, play/pause, siguiente, reiniciar.
9. Control de velocidad.
10. Indicador de paso.
11. Tabs para vista de cajitas, vista global y editor interactivo.
12. Contenedores vacios para render SVG.
13. Formularios del editor interactivo temporal si se conserva.

Reglas:

1. No poner calculos inline.
2. No duplicar estado en atributos HTML innecesarios.
3. IDs deben coincidir con simulator.js.
4. Mantener accesibilidad basica: botones reales, labels o placeholders claros.
5. No crear landing page; la herramienta debe aparecer como primera pantalla.

Fallos comunes:

- Cambiar IDs sin actualizar simulator.js.
- Poner scripts inline complejos.
- Quitar inputs necesarios para usuario no tecnico.
```

## Prompt de correccion rapida

```text
Revisa index.html contra simulator.js. Todo getElementById usado en JS debe existir exactamente una vez en HTML.
```
