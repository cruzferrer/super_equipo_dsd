import { EditorController } from "./epic_editor/controllers/editorController";
import { MotorApiClient } from "./epic_editor/services/motorApiClient";
import * as fs from "fs";
import * as path from "path";

async function runEndToEndSimulation() {
  console.log("=== Iniciando Flujo de Prueba E2E (Usuario Común) ===");

  // 1. Inicializar el Editor Controller apuntando al Motor API real (localhost:8000)
  const motorClient = new MotorApiClient("http://localhost:8000");
  const controller = new EditorController(motorClient);

  console.log("1. Cargando conectivos desde el Motor...");
  try {
    await controller.cargarConectivos();
    console.log("   Conectivos disponibles:", controller.getState().available_connectives);
  } catch (err) {
    console.error("❌ ERROR: No se pudo conectar con el Motor. ¿Está encendido en http://localhost:8000?");
    console.log("   Por favor levanta el servidor ejecutando: cd epic_motor && uvicorn main:app --reload");
    process.exit(1);
  }

  // 2. Simular al usuario interactuando y dibujando en el Editor (Capa Lógica + Capa Visual)
  console.log("2. Dibujando elementos en el lienzo del Editor...");
  
  // Crear conjuntos (circunferencias)
  controller.crearContexto("set_X", "PROPAGATION", 150, 200);
  controller.crearContexto("set_Y", "PROPAGATION", 450, 200);

  // Crear variables lógicas
  controller.crearVariable("p", "V"); // p empieza positiva (Verde)
  controller.crearVariable("q", "N"); // q empieza neutra (Gris)

  // Dibujar instancias visuales de las variables dentro de sus respectivos conjuntos
  controller.dibujarInstancia("inst_p", "p", 150, 200); // inst_p posicionada en set_X (150, 200)
  controller.dibujarInstancia("inst_q", "q", 450, 200); // inst_q posicionada en set_Y (450, 200)

  // Asignar membresías lógicas
  // (El controlador lo hace internamente al dibujar la instancia y/o asociarla)
  // Agregamos manualmente para asegurar consistencia
  const state = controller.getState();
  state.snapshot.logic.variables.find(v => v.id === "p")?.memberships.push("set_X");
  state.snapshot.logic.variables.find(v => v.id === "q")?.memberships.push("set_Y");

  // Conectar con una flecha de implicación p -> q
  controller.conectar("rel_p_to_q", "p", "q", "PROPAGATION");

  console.log("   Lienzo dibujado con éxito.");
  console.log("   Snapshot antes de enviar:");
  console.log(JSON.stringify(controller.getState().snapshot, null, 2));

  // 3. Validar el Snapshot antes de enviar al motor (Safety check)
  console.log("3. Validando integridad referencial del snapshot...");
  const validation = controller.validar();
  if (!validation.valid) {
    console.error("❌ Errores de validación:", validation.errors);
    process.exit(1);
  }
  console.log("   Validación exitosa (Sin referencias rotas ni bucles inválidos).");

  // 4. Enviar al Motor para calcular la propagación
  console.log("4. Enviando snapshot al Motor (POST /calcular)...");
  const result = await controller.ejecutar();

  if (!result.ok) {
    console.error("❌ Error en la ejecución del Motor:", result.errors);
    process.exit(1);
  }

  console.log("   ¡Respuesta del Motor recibida exitosamente!");
  const finalSnapshot = controller.getState().snapshot;
  console.log(`   Iteraciones de estabilización: ${finalSnapshot.execution_trace?.iterations}`);
  console.log(`   Acciones en el rastro: ${finalSnapshot.execution_trace?.actions.length}`);

  // 5. Guardar el JSON resultante para cargarlo en el Simulador
  const outputDir = path.join(__dirname, "epic_simulador");
  // Asegurarnos que la carpeta public existe en vite para poder servirlo directamente, o guardarlo para cargar manual
  const outputPath = path.join(outputDir, "e2e-real-trace.json");
  
  fs.writeFileSync(outputPath, JSON.stringify(finalSnapshot, null, 2));
  console.log(`\n5. 🎉 Snapshot con Execution Trace guardado en:\n   ${outputPath}`);
  console.log("\n=== Instrucciones de Visualización ===");
  console.log("1. Abre el simulador en: http://localhost:5173/");
  console.log("2. Arrastra o sube el archivo 'e2e-real-trace.json' generado en 'epic_simulador/e2e-real-trace.json'.");
  console.log("3. ¡Disfruta la animación paso a paso!");
}

runEndToEndSimulation().catch(err => {
  console.error("Error crítico en la prueba:", err);
});
