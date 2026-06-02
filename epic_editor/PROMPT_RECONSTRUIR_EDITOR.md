# Prompt para reconstruir el Editor

Este prompt sirve para pedirle a una IA que reconstruya solamente la capa `epic_editor`.

El Editor es la fuente de verdad publica del contrato `PlaygroundSnapshot`. Su trabajo es capturar acciones del usuario, modificar datos estructurales y coordinar la ejecucion contra el Motor. No renderiza, no anima y no calcula Belnap.

## Prompt principal

```text
Actua como arquitecto de software senior especializado en TypeScript, contratos de datos, SOLID e integracion HTTP.

Vas a reconstruir exclusivamente la carpeta epic_editor del proyecto EPiC Playground PoC. Antes de escribir codigo, inspecciona:

- epic_editor/domain/editorTypes.ts
- epic_editor/domain/editorState.ts
- epic_editor/domain/editorActions.ts
- epic_editor/validators/editorValidation.ts
- epic_editor/controllers/editorController.ts
- epic_editor/services/motorApiClient.ts
- epic_editor/tests/editorTests.test.ts
- epic_motor/models/snapshot.py
- epic_motor/api/routes.py
- epic_simulador/simulator.js

Objetivo:

Crear un Editor desacoplado que produzca y mantenga un PlaygroundSnapshot con separacion estricta entre capa logica y capa visual.

Responsabilidades del Editor:

1. Crear variables logicas.
2. Eliminar variables logicas y limpiar en cascada sus instancias visuales y relaciones.
3. Crear instancias visuales asociadas a variables logicas existentes.
4. Eliminar una instancia visual sin borrar necesariamente la variable logica.
5. Crear contextos o conjuntos logicos.
6. Eliminar contextos y limpiar membresias o subconjuntos rotos.
7. Crear relaciones logicas entre variables.
8. Eliminar relaciones.
9. Asignar valores Belnap: V, F, N, B.
10. Asignar membresias de variables a conjuntos.
11. Validar integridad referencial antes de ejecutar.
12. Enviar el snapshot al Motor por HTTP.
13. Recibir el snapshot con execution_trace.
14. Cambiar modo de edicion a ejecucion cuando exista trace.

Contrato TypeScript esperado:

- PlaygroundSnapshot contiene meta, logic, visual y execution_trace opcional.
- logic.variables es un arreglo de LogicVariable.
- logic.sets es un arreglo de LogicSet.
- logic.relations es un arreglo de LogicRelation.
- visual.instances es un Record<string, VisualInstance>.
- visual.sets es un Record<string, VisualSet>.
- visual.relations es un Record<string, VisualRelation>.

Reglas obligatorias:

1. El Editor no debe calcular propagaciones.
2. El Editor no debe importar funciones internas del Motor.
3. El Editor no debe dibujar canvas, SVG o D3.
4. El Editor no debe animar.
5. El Editor no debe duplicar matrices de conectivos.
6. El Editor puede tener un MockMotorClient para pruebas.
7. Si el Motor Python usa un formato interno distinto, adapta solo en MotorApiClient.
8. Nada en visual puede apuntar a una variable logica inexistente.
9. Nada en logic.relations puede apuntar a variables inexistentes.
10. meta.max_iterations debe estar entre 1 y 500.

Estructura esperada:

epic_editor/
  domain/
    editorTypes.ts
    editorState.ts
    editorActions.ts
  validators/
    editorValidation.ts
  services/
    motorApiClient.ts
  controllers/
    editorController.ts
  tests/
    editorTests.test.ts
  index.ts

Implementa con estilo funcional e inmutable para acciones de estado. El controlador puede encapsular el estado y exponer metodos de alto nivel para que una UI lo use.

Validaciones minimas:

- Valores Belnap validos.
- Conectivos validos.
- Referencias de memberships a conjuntos existentes.
- Referencias de subsets a conjuntos existentes.
- Ausencia de ciclos en jerarquia de subsets.
- Relaciones con origen y destino existentes.
- Instancias visuales con variable_id existente.
- max_iterations en rango.

Pruebas minimas:

1. Crear variable logica sin instancia visual.
2. Bloquear o ignorar instancia visual que apunta a variable inexistente.
3. Crear multiples instancias visuales para una misma variable.
4. Eliminar variable y limpiar instancias y relaciones.
5. Detectar IDs duplicados.
6. Detectar membresia rota.
7. Detectar ciclo de subconjuntos.
8. Ejecutar con MockMotorClient y guardar execution_trace.
9. Bloquear ejecucion si el snapshot no es valido.
10. Regresar a modo edicion limpiando execution_trace.

Entrega codigo completo y comandos para probar.
```

## Prompt de endurecimiento

Usa este prompt despues de una primera implementacion para obligar a la IA a revisar fallos finos.

```text
Revisa criticamente el Editor que generaste. Busca acoplamientos indebidos con Motor o Simulador, mutaciones accidentales del estado, referencias rotas, errores de contrato y casos donde el controlador devuelva ok aunque la accion no haya ocurrido. Corrige sin cambiar la arquitectura. Agrega o ajusta pruebas para cubrir cada fallo encontrado.
```

## Fallos comunes y como ajustar el prompt

### La IA crea renderizado dentro del Editor

```text
Elimina todo renderizado del Editor. El Editor solo produce datos visuales como x, y, radius, shape, color, alias o metadata. Si necesitas demostrar uso visual, hazlo en pruebas de snapshot o en el Simulador, no en epic_editor.
```

### La IA borra solo la variable y deja bolitas fantasma

```text
Corrige eliminarVariableLogica. Al borrar una variable logica, tambien deben borrarse todas las visual.instances con ese variable_id y todas las relaciones logicas o visuales donde participe esa variable.
```

### La IA envia el contrato incorrecto al Motor

```text
Lee epic_motor/models/snapshot.py y epic_motor/api/routes.py. Si el endpoint /calcular espera diccionarios con value/source/target, realiza la conversion dentro de MotorApiClient. El resto del Editor debe seguir exponiendo PlaygroundSnapshot con variables, sets y relations como arreglos segun editorTypes.ts.
```

### La IA devuelve errores poco utiles

```text
Estandariza los errores como ValidationResult con field, message, severity y entityId opcional. Cada error debe indicar que referencia esta rota y que entidad la produjo.
```

### La IA modifica el Motor o el Simulador sin permiso

```text
Limita el cambio a epic_editor. Puedes leer archivos del Motor y Simulador para respetar contratos, pero no debes modificar esas carpetas en esta tarea.
```
